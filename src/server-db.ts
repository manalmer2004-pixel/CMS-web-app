import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore, QueryDocumentSnapshot } from "@google-cloud/firestore";
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

// Path to file fallback DB
const JSON_DB_DIR = path.join(process.cwd(), "data");
const JSON_DB_PATH = path.join(JSON_DB_DIR, "db.json");

// Define interface for user including hashed password (for authentication)
export interface DbUser extends UserProfile {
  passwordHash: string;
}

// -----------------------------------------------------------------------------
// 1. FILE DB IMPLEMENTATION (FALLBACK SYSTEM) — unchanged from the Mongo version
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
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync("password123", salt);

    const initialUsers: DbUser[] = [
      { ...INITIAL_USER, passwordHash: defaultPasswordHash },
      { ...INITIAL_COORDINATOR, passwordHash: defaultPasswordHash }
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
// 2. FIRESTORE CONNECTION & SEED ENGINE
// -----------------------------------------------------------------------------
let isDbConnected = false;
let useFirebase = false;
let firestoreDb: Firestore;

const COLLECTIONS = {
  users: "users",
  events: "events",
  logs: "hoursLogs",
  announcements: "announcements",
  feedbacks: "feedbacks"
};

export async function connectDb() {
  if (isDbConnected) return useFirebase;

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const hasCredentialsFile = !!credentialsPath && fs.existsSync(path.resolve(credentialsPath));

  if (hasCredentialsFile) {
    try {
      console.log("Connecting to Firebase Firestore...");
      if (!admin.getApps().length) {
        admin.initializeApp({
          credential: admin.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      }
      firestoreDb = getFirestore();
      useFirebase = true;
      isDbConnected = true;
      console.log("Firebase Firestore connection established successfully!");

      // Seed Firestore if the users collection is empty
      const usersSnapshot = await firestoreDb.collection(COLLECTIONS.users).limit(1).get();
      if (usersSnapshot.empty) {
        console.log("Firestore is empty. Seeding initial records...");
        const salt = await bcrypt.genSalt(10);
        const defaultPasswordHash = await bcrypt.hash("password123", salt);

        const batch = firestoreDb.batch();

        const user1: DbUser = { ...INITIAL_USER, passwordHash: defaultPasswordHash };
        batch.set(firestoreDb.collection(COLLECTIONS.users).doc(user1.id), user1);

        const user2: DbUser = { ...INITIAL_COORDINATOR, passwordHash: defaultPasswordHash };
        batch.set(firestoreDb.collection(COLLECTIONS.users).doc(user2.id), user2);

        INITIAL_EVENTS.forEach(ev => batch.set(firestoreDb.collection(COLLECTIONS.events).doc(ev.id), ev));
        INITIAL_HOURS_LOGS.forEach(log => batch.set(firestoreDb.collection(COLLECTIONS.logs).doc(log.id), log));
        INITIAL_ANNOUNCEMENTS.forEach(a => batch.set(firestoreDb.collection(COLLECTIONS.announcements).doc(a.id), a));
        INITIAL_FEEDBACK.forEach(f => batch.set(firestoreDb.collection(COLLECTIONS.feedbacks).doc(f.id), f));

        await batch.commit();
        console.log("Firestore database seeded successfully!");
      }
    } catch (err) {
      console.error("Failed to connect to Firebase, falling back to JSON local file storage.", err);
      useFirebase = false;
      isDbConnected = true;
      loadFileDb();
    }
  } else {
    console.log("No valid GOOGLE_APPLICATION_CREDENTIALS file detected.");
    console.log("Initializing persistent JSON database fallback at:", JSON_DB_PATH);
    useFirebase = false;
    isDbConnected = true;
    loadFileDb();
  }

  return useFirebase;
}

// -----------------------------------------------------------------------------
// 3. COMBINED SERVICE DRIVER METHODS
// -----------------------------------------------------------------------------
export const db = {
  // Users
  async findUserByEmail(email: string): Promise<DbUser | null> {
    await connectDb();
    const cleanEmail = email.toLowerCase().trim();
    if (useFirebase) {
      const snapshot = await firestoreDb
        .collection(COLLECTIONS.users)
        .where("email", "==", cleanEmail)
        .limit(1)
        .get();
      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as DbUser;
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

    if (useFirebase) {
      await firestoreDb.collection(COLLECTIONS.users).doc(id).set(newUser);
      return newUser;
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
    const { email: _e, role: _r, id: _id, ...allowedUpdates } = updates;

    if (useFirebase) {
      const snapshot = await firestoreDb
        .collection(COLLECTIONS.users)
        .where("email", "==", cleanEmail)
        .limit(1)
        .get();
      if (snapshot.empty) return null;
      const docRef = snapshot.docs[0].ref;
      await docRef.update(allowedUpdates as Record<string, unknown>);
      const updatedDoc = await docRef.get();
      const { passwordHash: _p, ...profile } = updatedDoc.data() as DbUser;
      return profile;
    } else {
      const data = loadFileDb();
      const idx = data.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
      if (idx === -1) return null;

      const updatedUser = {
        ...data.users[idx],
        ...updates,
        id: data.users[idx].id,
        email: data.users[idx].email,
        role: data.users[idx].role
      };

      data.users[idx] = updatedUser;
      saveFileDb(data);

      const { passwordHash: _p, ...profile } = updatedUser;
      return profile;
    }
  },

  async updateUserStats(
    email: string,
    hours: number,
    eventsCount: number,
    level: number,
    badgeIds: string[]
  ): Promise<UserProfile | null> {
    await connectDb();
    const cleanEmail = email.toLowerCase().trim();
    const updates = { totalHours: hours, completedEventsCount: eventsCount, level, badgeIds };

    if (useFirebase) {
      const snapshot = await firestoreDb
        .collection(COLLECTIONS.users)
        .where("email", "==", cleanEmail)
        .limit(1)
        .get();
      if (snapshot.empty) return null;
      const docRef = snapshot.docs[0].ref;
      await docRef.update(updates);
      const updatedDoc = await docRef.get();
      const { passwordHash: _p, ...profile } = updatedDoc.data() as DbUser;
      return profile;
    } else {
      const data = loadFileDb();
      const idx = data.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
      if (idx === -1) return null;

      data.users[idx].totalHours = hours;
      data.users[idx].completedEventsCount = eventsCount;
      data.users[idx].level = level;
      data.users[idx].badgeIds = badgeIds;

      saveFileDb(data);
      const { passwordHash: _p, ...profile } = data.users[idx];
      return profile;
    }
  },

  async getAllUsers(): Promise<UserProfile[]> {
    await connectDb();
    if (useFirebase) {
      const snapshot = await firestoreDb.collection(COLLECTIONS.users).get();
      return snapshot.docs.map(d => {
        const { passwordHash, ...profile } = d.data() as DbUser;
        return profile;
      });
    } else {
      const data = loadFileDb();
      return data.users.map(u => {
        const { passwordHash, ...profile } = u;
        return profile;
      });
    }
  },

  // Events
  async getEvents(): Promise<ServiceEvent[]> {
    await connectDb();
    if (useFirebase) {
      const snapshot = await firestoreDb.collection(COLLECTIONS.events).get();
      const events: ServiceEvent[] = snapshot.docs.map((d: QueryDocumentSnapshot) => d.data() as ServiceEvent);
      return events.sort((a, b) => b.date.localeCompare(a.date));
    } else {
      const data = loadFileDb();
      return [...data.events].sort((a, b) => b.date.localeCompare(a.date));
    }
  },

  async createEvent(
    event: Omit<ServiceEvent, "id" | "signedUpVolunteers" | "completed">
  ): Promise<ServiceEvent> {
    await connectDb();
    const id = `e-${Date.now()}`;
    const newEvent: ServiceEvent = {
      ...event,
      id,
      signedUpVolunteers: [],
      completed: false
    };

    if (useFirebase) {
      await firestoreDb.collection(COLLECTIONS.events).doc(id).set(newEvent);
      return newEvent;
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

    if (useFirebase) {
      const docRef = firestoreDb.collection(COLLECTIONS.events).doc(eventId);
      const doc = await docRef.get();
      if (!doc.exists) return null;

      const event = doc.data() as ServiceEvent;
      const isSignedUp = event.signedUpVolunteers.some(e => e.toLowerCase() === cleanEmail);

      let updatedVolunteers: string[];
      if (isSignedUp) {
        updatedVolunteers = event.signedUpVolunteers.filter(e => e.toLowerCase() !== cleanEmail);
      } else {
        if (event.signedUpVolunteers.length >= event.maxVolunteers) {
          throw new Error("Initiative capacity full");
        }
        updatedVolunteers = [...event.signedUpVolunteers, cleanEmail];
      }

      await docRef.update({ signedUpVolunteers: updatedVolunteers });
      return { ...event, signedUpVolunteers: updatedVolunteers };
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
    if (useFirebase) {
      const snapshot = await firestoreDb.collection(COLLECTIONS.logs).get();
      let logs: HoursLog[] = snapshot.docs.map((d: QueryDocumentSnapshot) => d.data() as HoursLog);
      if (userEmail) {
        const clean = userEmail.toLowerCase().trim();
        logs = logs.filter(l => l.userEmail.toLowerCase() === clean);
      }
      return logs.sort((a, b) => b.dateLogged.localeCompare(a.dateLogged));
    } else {
      const data = loadFileDb();
      if (userEmail) {
        const clean = userEmail.toLowerCase().trim();
        return data.logs
          .filter(l => l.userEmail.toLowerCase() === clean)
          .sort((a, b) => b.dateLogged.localeCompare(a.dateLogged));
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

    if (useFirebase) {
      await firestoreDb.collection(COLLECTIONS.logs).doc(id).set(newLog);
      return newLog;
    } else {
      const data = loadFileDb();
      data.logs.unshift(newLog);
      saveFileDb(data);
      return newLog;
    }
  },

  async updateLogStatus(
    logId: string,
    status: "approved" | "rejected",
    notes: string
  ): Promise<HoursLog | null> {
    await connectDb();

    if (useFirebase) {
      const docRef = firestoreDb.collection(COLLECTIONS.logs).doc(logId);
      const doc = await docRef.get();
      if (!doc.exists) return null;

      await docRef.update({ status, notes });
      const updatedDoc = await docRef.get();
      return updatedDoc.data() as HoursLog;
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
    if (useFirebase) {
      const snapshot = await firestoreDb.collection(COLLECTIONS.announcements).get();
      const announcements: Announcement[] = snapshot.docs.map((d: QueryDocumentSnapshot) => d.data() as Announcement);
      return announcements.sort((a, b) => b.date.localeCompare(a.date));
    } else {
      const data = loadFileDb();
      return [...data.announcements].sort((a, b) => b.date.localeCompare(a.date));
    }
  },

  async createAnnouncement(ann: Omit<Announcement, "id">): Promise<Announcement> {
    await connectDb();
    const id = `a-${Date.now()}`;
    const newAnn: Announcement = { ...ann, id };

    if (useFirebase) {
      await firestoreDb.collection(COLLECTIONS.announcements).doc(id).set(newAnn);
      return newAnn;
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
    if (useFirebase) {
      const snapshot = await firestoreDb.collection(COLLECTIONS.feedbacks).get();
      const feedbacks: CommunityFeedback[] = snapshot.docs.map((d: QueryDocumentSnapshot) => d.data() as CommunityFeedback);
      return feedbacks.sort((a, b) => b.date.localeCompare(a.date));
    } else {
      const data = loadFileDb();
      return [...data.feedbacks].sort((a, b) => b.date.localeCompare(a.date));
    }
  },

  async createFeedback(feedback: Omit<CommunityFeedback, "id">): Promise<CommunityFeedback> {
    await connectDb();
    const id = `f-${Date.now()}`;
    const newFeedback: CommunityFeedback = { ...feedback, id };

    if (useFirebase) {
      await firestoreDb.collection(COLLECTIONS.feedbacks).doc(id).set(newFeedback);
      return newFeedback;
    } else {
      const data = loadFileDb();
      data.feedbacks.unshift(newFeedback);
      saveFileDb(data);
      return newFeedback;
    }
  }
};