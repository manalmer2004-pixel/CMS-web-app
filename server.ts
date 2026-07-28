import express, { Request, Response, NextFunction } from "express";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { db } from "./src/server-db";
import { UserRole } from "./src/types";

// Load environment variables (dotenv is configured by default)
import "dotenv/config";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "servicehub_jwt_super_secret_key_2026";

// Parse JSON request bodies
app.use(express.json());

// Extend express Request interface to support JWT user context
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

// -----------------------------------------------------------------------------
// JWT AUTHENTICATION MIDDLEWARE
// -----------------------------------------------------------------------------
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired session token" });
      return;
    }
    req.user = decoded;
    next();
  });
}

function requireCoordinator(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "coordinator") {
    res.status(403).json({ error: "Access denied: Coordinators only" });
    return;
  }
  next();
}

// -----------------------------------------------------------------------------
// AUTHENTICATION ENDPOINTS
// -----------------------------------------------------------------------------

// Sign Up
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, role, phone, skills, bio, emergencyContact } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await db.findUserByEmail(cleanEmail);
    if (existingUser) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Initial level, badges, and counters
    const isCoord = role === "coordinator";
    const newUserProfile = {
      name,
      email: cleanEmail,
      avatar: isCoord 
        ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250"
        : `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000)}?auto=format&fit=crop&q=80&w=250`,
      role: (role === "coordinator" ? "coordinator" : "volunteer") as UserRole,
      phone: phone || "",
      skills: skills || [],
      bio: bio || "",
      emergencyContact: emergencyContact || "",
      joinedDate: new Date().toISOString().split("T")[0],
      totalHours: 0,
      completedEventsCount: 0,
      level: 1,
      badgeIds: []
    };

    const createdUser = await db.createUser({
      ...newUserProfile,
      passwordHash
    });

    // Sign JWT
    const token = jwt.sign(
      { id: createdUser.id, email: createdUser.email, role: createdUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { passwordHash: _, ...userProfile } = createdUser;
    res.status(201).json({ token, user: userProfile });
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Log In
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.findUserByEmail(cleanEmail);
    if (!user) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { passwordHash: _, ...userProfile } = user;
    res.json({ token, user: userProfile });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during authentication" });
  }
});

// Fetch current logged in user details
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not logged in" });
      return;
    }
    const user = await db.findUserByEmail(req.user.email);
    if (!user) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }
    const { passwordHash: _, ...profile } = user;
    res.json({ user: profile });
  } catch (error: any) {
    console.error("Auth me error:", error);
    res.status(500).json({ error: "Server error retrieving profile" });
  }
});


// -----------------------------------------------------------------------------
// USER PROFILE ENDPOINTS
// -----------------------------------------------------------------------------
app.put("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not logged in" });
      return;
    }
    const updates = req.body;
    const profile = await db.updateUser(req.user.email, updates);
    if (!profile) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }
    res.json({ user: profile });
  } catch (error: any) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Server error updating profile" });
  }
});


// -----------------------------------------------------------------------------
// EVENTS ENDPOINTS
// -----------------------------------------------------------------------------

// List Events
app.get("/api/events", async (req, res) => {
  try {
    const list = await db.getEvents();
    res.json(list);
  } catch (error: any) {
    console.error("Get events error:", error);
    res.status(500).json({ error: "Server error retrieving initiatives" });
  }
});

// Create Event (Coordinator Only)
app.post("/api/events", authenticateToken, requireCoordinator, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not logged in" });
      return;
    }
    const eventData = req.body;
    const newEvent = await db.createEvent({
      ...eventData,
      organizerEmail: req.user.email
    });

    // Create system announcement for new event
    await db.createAnnouncement({
      title: `New Initiative: ${newEvent.title}`,
      content: `We launched a new community project under "${newEvent.category}" scheduled for ${newEvent.date}. Sign up now to lock your volunteer spot!`,
      date: new Date().toISOString().split("T")[0],
      sender: "Coordinator Portal",
      category: "general"
    });

    res.status(201).json(newEvent);
  } catch (error: any) {
    console.error("Create event error:", error);
    res.status(500).json({ error: "Server error creating initiative" });
  }
});

// Register / Leave Event (Volunteer)
app.post("/api/events/:id/signup", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not logged in" });
      return;
    }
    const eventId = req.params.id;
    const updatedEvent = await db.toggleSignUp(eventId, req.user.email);
    if (!updatedEvent) {
      res.status(404).json({ error: "Initiative not found" });
      return;
    }
    res.json(updatedEvent);
  } catch (error: any) {
    console.error("Toggle signup error:", error);
    res.status(400).json({ error: error.message || "Failed to register for initiative" });
  }
});


// -----------------------------------------------------------------------------
// HOURS LOGGING ENDPOINTS
// -----------------------------------------------------------------------------

// List hours logs (Coordinator sees all, Volunteer sees only theirs)
app.get("/api/logs", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not logged in" });
      return;
    }
    const filterEmail = req.user.role === "coordinator" ? undefined : req.user.email;
    const list = await db.getLogs(filterEmail);
    res.json(list);
  } catch (error: any) {
    console.error("Get logs error:", error);
    res.status(500).json({ error: "Server error retrieving logs" });
  }
});

// File hours log (Volunteer)
app.post("/api/logs", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not logged in" });
      return;
    }
    const { eventId, eventTitle, date, hours, reflection, supervisorEmail } = req.body;
    
    // Find volunteer details for user name
    const volunteer = await db.findUserByEmail(req.user.email);
    const userName = volunteer ? volunteer.name : "Volunteer";

    const newLog = await db.createLog({
      userEmail: req.user.email,
      userName,
      eventId,
      eventTitle,
      date,
      hours: Number(hours),
      reflection: reflection || "",
      supervisorEmail,
      notes: ""
    });

    res.status(201).json(newLog);
  } catch (error: any) {
    console.error("Create log error:", error);
    res.status(500).json({ error: "Server error submitting hours log" });
  }
});

// Approve/Reject Hours Log (Coordinator Only)
app.put("/api/logs/:id/status", authenticateToken, requireCoordinator, async (req, res) => {
  try {
    const logId = req.params.id;
    const { status, notes } = req.body; // status: "approved" | "rejected"

    if (status !== "approved" && status !== "rejected") {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const updatedLog = await db.updateLogStatus(logId, status, notes || "");
    if (!updatedLog) {
      res.status(404).json({ error: "Hours log not found" });
      return;
    }

    // If log is approved, update volunteer's hours and award badges/levels
    if (status === "approved") {
      const volunteer = await db.findUserByEmail(updatedLog.userEmail);
      if (volunteer) {
        const addedHours = updatedLog.hours;
        const currentTotalHours = volunteer.totalHours + addedHours;
        const currentCompletedCount = volunteer.completedEventsCount + 1;
        const newLevel = Math.floor(currentTotalHours / 15) + 1;

        // Badge award check
        const currentBadgeIds = [...volunteer.badgeIds];
        const events = await db.getEvents();
        const logs = await db.getLogs();

        // 1. Green Guard (id: b-1) -> Env hours >= 10
        const envEvents = events.filter(e => e.category === "Environment").map(e => e.id);
        const envHours = logs
          .filter(l => l.userEmail === volunteer.email && l.status === "approved" && (l.eventId === updatedLog.eventId || envEvents.includes(l.eventId)))
          .reduce((sum, l) => sum + l.hours, 0);

        if (envHours >= 10 && !currentBadgeIds.includes("b-1")) {
          currentBadgeIds.push("b-1");
        }

        // 2. Compassionate Heart (id: b-3) -> Elderly Care
        const elderlyEvents = events.filter(e => e.category === "Elderly Care").map(e => e.id);
        const isElderlyLog = updatedLog.eventId && (elderlyEvents.includes(updatedLog.eventId) || updatedLog.eventTitle.toLowerCase().includes("senior"));
        if (isElderlyLog && !currentBadgeIds.includes("b-3")) {
          currentBadgeIds.push("b-3");
        }

        // 3. Community Pillar (id: b-6) -> hours >= 30
        if (currentTotalHours >= 30 && !currentBadgeIds.includes("b-6")) {
          currentBadgeIds.push("b-6");
        }

        await db.updateUserStats(
          volunteer.email, 
          currentTotalHours, 
          currentCompletedCount, 
          newLevel, 
          currentBadgeIds
        );
      }
    }

    res.json(updatedLog);
  } catch (error: any) {
    console.error("Update log status error:", error);
    res.status(500).json({ error: "Server error finalizing log review" });
  }
});


// -----------------------------------------------------------------------------
// ANNOUNCEMENTS ENDPOINTS
// -----------------------------------------------------------------------------
app.get("/api/announcements", async (req, res) => {
  try {
    const list = await db.getAnnouncements();
    res.json(list);
  } catch (error: any) {
    console.error("Get announcements error:", error);
    res.status(500).json({ error: "Server error retrieving announcements" });
  }
});


// -----------------------------------------------------------------------------
// FEEDBACK ENDPOINTS
// -----------------------------------------------------------------------------
app.get("/api/feedbacks", async (req, res) => {
  try {
    const list = await db.getFeedbacks();
    res.json(list);
  } catch (error: any) {
    console.error("Get feedbacks error:", error);
    res.status(500).json({ error: "Server error retrieving feedbacks" });
  }
});

app.post("/api/feedbacks", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not logged in" });
      return;
    }
    const { eventId, eventTitle, rating, comment } = req.body;
    
    const volunteer = await db.findUserByEmail(req.user.email);
    const userName = volunteer ? volunteer.name : "Volunteer";
    const userAvatar = volunteer ? volunteer.avatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250";

    const newFeedback = await db.createFeedback({
      userEmail: req.user.email,
      userName,
      userAvatar,
      eventId,
      eventTitle,
      rating: Number(rating),
      comment,
      date: new Date().toISOString().split("T")[0]
    });

    res.status(201).json(newFeedback);
  } catch (error: any) {
    console.error("Create feedback error:", error);
    res.status(500).json({ error: "Server error submitting initiative feedback" });
  }
});


// -----------------------------------------------------------------------------
// VITE CLIENT DEV MIDDLEWARE & PRODUCTION STATIC HOSTING
// -----------------------------------------------------------------------------
async function startServer() {
  // Connect database (real MongoDB or file-based DB)
  await db.findUserByEmail("test@test.com"); // Triggers connectDb lazily at startup

  if (process.env.NODE_ENV !== "production") {
    console.log("Vite dev server integrating as middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Production build hosting static dist files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started! Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server bootstrap failure:", err);
});
