import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { UserProfile, ServiceEvent, HoursLog, Announcement, CommunityFeedback } from "./types";

// Seed data imports
import { 
  INITIAL_USER, 
  INITIAL_COORDINATOR, 
  INITIAL_EVENTS, 
  INITIAL_HOURS_LOGS, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_FEEDBACK 
} from "./data";

const isProduction = process.env.NODE_ENV === "production";
let MONGO_URI = process.env.MONGODB_URI;

// Automatically correct common connection string typo
if (MONGO_URI && MONGO_URI.startsWith("mongodb+serif://")) {
  MONGO_URI = MONGO_URI.replace("mongodb+serif://", "mongodb+srv://");
}

// Path to file fallback DB
const JSON_DB_DIR = path.join(process.cwd(), "data");
const JSON_DB_PATH = path.join(JSON_DB_DIR, "db.json");

// Define interface for user including hashed password (for authentication)
export interface DbUser extends UserProfile {
  passwordHash: string;
}

// -----------------------------------------------------------------------------
// 1. MONGOOSE SCHEMA & MODEL DEFINITIONS (For real MongoDB)
// -----------------------------------------------------------------------------
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: "" },
  role: { type: String, enum: ["volunteer", "coordinator"], default: "volunteer" },
  phone: { type: String, default: "" },
  skills: { type: [String], default: [] },
  bio: { type: String, default: "" },
  emergencyContact: { type: String, default: "" },
  joinedDate: { type: String, default: "" },
  totalHours: { type: Number, default: 0 },
  completedEventsCount: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badgeIds: { type: [String], default: [] }
});

const EventSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  location: { type: String, required: true },
  maxVolunteers: { type: Number, required: true },
  signedUpVolunteers: { type: [String], default: [] }, // emails
  completed: { type: Boolean, default: false },
  organizerEmail: { type: String, required: true },
  image: { type: String, default: "" },
  impactMetric: { type: String, default: "" }
});

const HoursLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  eventId: { type: String, required: true },
  eventTitle: { type: String, required: true },
  date: { type: String, required: true },
  hours: { type: Number, required: true },
  reflection: { type: String, default: "" },
  supervisorEmail: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  dateLogged: { type: String, required: true },
  notes: { type: String, default: "" }
});

const AnnouncementSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: String, required: true },
  sender: { type: String, required: true },
  category: { type: String, enum: ["urgent", "general", "update"], default: "general" }
});

const FeedbackSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, default: "" },
  eventId: { type: String, required: true },
  eventTitle: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: String, required: true }
});

// Lazy-loaded Mongoose models
let MongoUser: mongoose.Model<any>;
let MongoEvent: mongoose.Model<any>;
let MongoHoursLog: mongoose.Model<any>;
let MongoAnnouncement: mongoose.Model<any>;
let MongoFeedback: mongoose.Model<any>;

function initMongoModels() {
  MongoUser = mongoose.models.User || mongoose.model("User", UserSchema);
  MongoEvent = mongoose.models.Event || mongoose.model("Event", EventSchema);
  MongoHoursLog = mongoose.models.HoursLog || mongoose.model("HoursLog", HoursLogSchema);
  MongoAnnouncement = mongoose.models.Announcement || mongoose.model("Announcement", AnnouncementSchema);
  MongoFeedback = mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);
}

// -----------------------------------------------------------------------------
// 2. FILE DB IMPLEMENTATION (FALLBACK SYSTEM)
// -----------------------------------------------------------------------------
interface FileDbData {
  users: DbUser[];
  events: ServiceEvent[];
  logs: HoursLog[];
  announcements: Announcement[];
  feedbacks: CommunityFeedback[];
}

function loadFileDb(): FileDbData {
  if (!fs.existsSync(JSON_DB_DIR)) {
    fs.mkdirSync(JSON_DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(JSON_DB_PATH)) {
    // Generate default passwords hashed for initial users
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync("password123", salt);

    const initialUsers: DbUser[] = [
      {
        ...INITIAL_USER,
        passwordHash: defaultPasswordHash
      },
      {
        ...INITIAL_COORDINATOR,
        passwordHash: defaultPasswordHash
      }
    ];

    const initialData: FileDbData = {
      users: initialUsers,
      events: INITIAL_EVENTS,
      logs: INITIAL_HOURS_LOGS,
      announcements: INITIAL_ANNOUNCEMENTS,
      feedbacks: INITIAL_FEEDBACK
    };

    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(initialData, null, 2), "utf8");
    return initialData;
  }

  try {
    const raw = fs.readFileSync(JSON_DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading db.json, returning default empty structures", err);
    return { users: [], events: [], logs: [], announcements: [], feedbacks: [] };
  }
}

function saveFileDb(data: FileDbData) {
  if (!fs.existsSync(JSON_DB_DIR)) {
    fs.mkdirSync(JSON_DB_DIR, { recursive: true });
  }
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

// -----------------------------------------------------------------------------
// 3. DATABASE CONNECTION & SEED ENGINE
// -----------------------------------------------------------------------------
let isDbConnected = false;
let useMongo = false;

export async function connectDb() {
  if (isDbConnected) return useMongo;

  if (MONGO_URI && MONGO_URI !== "MY_MONGODB_URI" && !MONGO_URI.includes("username:password")) {
    try {
      console.log("Connecting to MongoDB via Mongoose...");
      await mongoose.connect(MONGO_URI);
      initMongoModels();
      useMongo = true;
      isDbConnected = true;
      console.log("MongoDB connection established successfully!");
      
      // Seed MongoDB if users collection is empty
      const userCount = await MongoUser.countDocuments();
      if (userCount === 0) {
        console.log("MongoDB is empty. Seeding initial records...");
        const salt = await bcrypt.genSalt(10);
        const defaultPasswordHash = await bcrypt.hash("password123", salt);

        await MongoUser.create({
          ...INITIAL_USER,
          passwordHash: defaultPasswordHash
        });

        await MongoUser.create({
          ...INITIAL_COORDINATOR,
          passwordHash: defaultPasswordHash
        });

        await MongoEvent.insertMany(INITIAL_EVENTS);
        await MongoHoursLog.insertMany(INITIAL_HOURS_LOGS);
        await MongoAnnouncement.insertMany(INITIAL_ANNOUNCEMENTS);
        await MongoFeedback.insertMany(INITIAL_FEEDBACK);
        
        console.log("MongoDB database seeded successfully!");
      }
    } catch (err) {
      console.error("Failed to connect to MongoDB, falling back to JSON local file storage.", err);
      useMongo = false;
      isDbConnected = true;
      loadFileDb(); // trigger creation of local file
    }
  } else {
    console.log("No valid MONGODB_URI environment variable detected.");
    console.log("Initializing persistent JSON database fallback at:", JSON_DB_PATH);
    useMongo = false;
    isDbConnected = true;
    loadFileDb(); // trigger creation of local file
  }

  return useMongo;
}

// Helper to convert Mongo document into clean JSON object
function cleanDoc(doc: any) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj._id;
  delete obj.__v;
  return obj;
}

// -----------------------------------------------------------------------------
// 4. COMBINED SERVICE DRIVER METHODS
// -----------------------------------------------------------------------------
export const db = {
  // Users
  async findUserByEmail(email: string): Promise<DbUser | null> {
    await connectDb();
    const cleanEmail = email.toLowerCase().trim();
    if (useMongo) {
      const user = await MongoUser.findOne({ email: new RegExp(`^${cleanEmail}$`, "i") });
      return user ? cleanDoc(user) as DbUser : null;
    } else {
      const data = loadFileDb();
      const user = data.users.find(u => u.email.toLowerCase() === cleanEmail);
      return user || null;
    }
  },

  async createUser(user: Omit<DbUser, "id">): Promise<DbUser> {
    await connectDb();
    const id = `u-${Date.now()}`;
    const newUser: DbUser = {
      ...user,
      id,
      email: user.email.toLowerCase().trim()
    };

    if (useMongo) {
      const doc = await MongoUser.create(newUser);
      return cleanDoc(doc) as DbUser;
    } else {
      const data = loadFileDb();
      data.users.push(newUser);
      saveFileDb(data);
      return newUser;
    }
  },

  async updateUser(email: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    await connectDb();
    const cleanEmail = email.toLowerCase().trim();
    if (useMongo) {
      // Don't allow changing role or email for safety here
      const { email: _, role: __, id: ___, ...allowedUpdates } = updates;
      const doc = await MongoUser.findOneAndUpdate(
        { email: new RegExp(`^${cleanEmail}$`, "i") },
        { $set: allowedUpdates },
        { new: true }
      );
      return doc ? cleanDoc(doc) as UserProfile : null;
    } else {
      const data = loadFileDb();
      const idx = data.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
      if (idx === -1) return null;

      const updatedUser = {
        ...data.users[idx],
        ...updates,
        // protect keys
        id: data.users[idx].id,
        email: data.users[idx].email,
        role: data.users[idx].role
      };

      data.users[idx] = updatedUser;
      saveFileDb(data);
      
      const { passwordHash: _, ...profile } = updatedUser;
      return profile;
    }
  },

  async updateUserStats(email: string, hours: number, eventsCount: number, level: number, badgeIds: string[]): Promise<UserProfile | null> {
    await connectDb();
    const cleanEmail = email.toLowerCase().trim();
    if (useMongo) {
      const doc = await MongoUser.findOneAndUpdate(
        { email: new RegExp(`^${cleanEmail}$`, "i") },
        { 
          $set: { 
            totalHours: hours, 
            completedEventsCount: eventsCount, 
            level, 
            badgeIds 
          } 
        },
        { new: true }
      );
      return doc ? cleanDoc(doc) as UserProfile : null;
    } else {
      const data = loadFileDb();
      const idx = data.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
      if (idx === -1) return null;

      data.users[idx].totalHours = hours;
      data.users[idx].completedEventsCount = eventsCount;
      data.users[idx].level = level;
      data.users[idx].badgeIds = badgeIds;
      
      saveFileDb(data);
      const { passwordHash: _, ...profile } = data.users[idx];
      return profile;
    }
  },

  // Events
  async getEvents(): Promise<ServiceEvent[]> {
    await connectDb();
    if (useMongo) {
      const list = await MongoEvent.find({}).sort({ date: -1 });
      return list.map(cleanDoc) as ServiceEvent[];
    } else {
      const data = loadFileDb();
      return [...data.events].sort((a, b) => b.date.localeCompare(a.date));
    }
  },

  async createEvent(event: Omit<ServiceEvent, "id" | "signedUpVolunteers" | "completed">): Promise<ServiceEvent> {
    await connectDb();
    const id = `e-${Date.now()}`;
    const newEvent: ServiceEvent = {
      ...event,
      id,
      signedUpVolunteers: [],
      completed: false
    };

    if (useMongo) {
      const doc = await MongoEvent.create(newEvent);
      return cleanDoc(doc) as ServiceEvent;
    } else {
      const data = loadFileDb();
      data.events.push(newEvent);
      saveFileDb(data);
      return newEvent;
    }
  },

  async toggleSignUp(eventId: string, email: string): Promise<ServiceEvent | null> {
    await connectDb();
    const cleanEmail = email.toLowerCase().trim();
    if (useMongo) {
      const event = await MongoEvent.findOne({ id: eventId });
      if (!event) return null;

      const isSignedUp = event.signedUpVolunteers.includes(cleanEmail);
      if (isSignedUp) {
        event.signedUpVolunteers = event.signedUpVolunteers.filter((e: string) => e !== cleanEmail);
      } else {
        if (event.signedUpVolunteers.length >= event.maxVolunteers) {
          throw new Error("Initiative capacity full");
        }
        event.signedUpVolunteers.push(cleanEmail);
      }
      await event.save();
      return cleanDoc(event) as ServiceEvent;
    } else {
      const data = loadFileDb();
      const idx = data.events.findIndex(e => e.id === eventId);
      if (idx === -1) return null;

      const event = data.events[idx];
      const isSignedUp = event.signedUpVolunteers.some(e => e.toLowerCase() === cleanEmail);
      
      if (isSignedUp) {
        event.signedUpVolunteers = event.signedUpVolunteers.filter(e => e.toLowerCase() !== cleanEmail);
      } else {
        if (event.signedUpVolunteers.length >= event.maxVolunteers) {
          throw new Error("Initiative capacity full");
        }
        event.signedUpVolunteers.push(cleanEmail);
      }

      data.events[idx] = event;
      saveFileDb(data);
      return event;
    }
  },

  // Hours Logs
  async getLogs(userEmail?: string): Promise<HoursLog[]> {
    await connectDb();
    if (useMongo) {
      const query = userEmail ? { userEmail: new RegExp(`^${userEmail.toLowerCase().trim()}$`, "i") } : {};
      const list = await MongoHoursLog.find(query).sort({ dateLogged: -1 });
      return list.map(cleanDoc) as HoursLog[];
    } else {
      const data = loadFileDb();
      if (userEmail) {
        const clean = userEmail.toLowerCase().trim();
        return data.logs.filter(l => l.userEmail.toLowerCase() === clean).sort((a, b) => b.dateLogged.localeCompare(a.dateLogged));
      }
      return [...data.logs].sort((a, b) => b.dateLogged.localeCompare(a.dateLogged));
    }
  },

  async createLog(log: Omit<HoursLog, "id" | "status" | "dateLogged">): Promise<HoursLog> {
    await connectDb();
    const id = `log-${Date.now()}`;
    const newLog: HoursLog = {
      ...log,
      id,
      status: "pending",
      dateLogged: new Date().toISOString().split("T")[0]
    };

    if (useMongo) {
      const doc = await MongoHoursLog.create(newLog);
      return cleanDoc(doc) as HoursLog;
    } else {
      const data = loadFileDb();
      data.logs.unshift(newLog); // Prepend new logs
      saveFileDb(data);
      return newLog;
    }
  },

  async updateLogStatus(logId: string, status: "approved" | "rejected", notes: string): Promise<HoursLog | null> {
    await connectDb();
    if (useMongo) {
      const doc = await MongoHoursLog.findOneAndUpdate(
        { id: logId },
        { $set: { status, notes } },
        { new: true }
      );
      return doc ? cleanDoc(doc) as HoursLog : null;
    } else {
      const data = loadFileDb();
      const idx = data.logs.findIndex(l => l.id === logId);
      if (idx === -1) return null;

      data.logs[idx].status = status;
      data.logs[idx].notes = notes;
      saveFileDb(data);
      return data.logs[idx];
    }
  },

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    await connectDb();
    if (useMongo) {
      const list = await MongoAnnouncement.find({}).sort({ date: -1 });
      return list.map(cleanDoc) as Announcement[];
    } else {
      const data = loadFileDb();
      return [...data.announcements].sort((a, b) => b.date.localeCompare(a.date));
    }
  },

  async createAnnouncement(ann: Omit<Announcement, "id">): Promise<Announcement> {
    await connectDb();
    const id = `a-${Date.now()}`;
    const newAnn: Announcement = {
      ...ann,
      id
    };

    if (useMongo) {
      const doc = await MongoAnnouncement.create(newAnn);
      return cleanDoc(doc) as Announcement;
    } else {
      const data = loadFileDb();
      data.announcements.unshift(newAnn);
      saveFileDb(data);
      return newAnn;
    }
  },

  // Feedback
  async getFeedbacks(): Promise<CommunityFeedback[]> {
    await connectDb();
    if (useMongo) {
      const list = await MongoFeedback.find({}).sort({ date: -1 });
      return list.map(cleanDoc) as CommunityFeedback[];
    } else {
      const data = loadFileDb();
      return [...data.feedbacks].sort((a, b) => b.date.localeCompare(a.date));
    }
  },

  async createFeedback(feedback: Omit<CommunityFeedback, "id">): Promise<CommunityFeedback> {
    await connectDb();
    const id = `f-${Date.now()}`;
    const newFeedback: CommunityFeedback = {
      ...feedback,
      id
    };

    if (useMongo) {
      const doc = await MongoFeedback.create(newFeedback);
      return cleanDoc(doc) as CommunityFeedback;
    } else {
      const data = loadFileDb();
      data.feedbacks.unshift(newFeedback);
      saveFileDb(data);
      return newFeedback;
    }
  }
};
