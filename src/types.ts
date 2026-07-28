export type UserRole = "volunteer" | "coordinator";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  phone: string;
  skills: string[];
  bio: string;
  emergencyContact: string;
  joinedDate: string;
  totalHours: number;
  completedEventsCount: number;
  level: number;
  badgeIds: string[];
}

export type EventCategory = 
  | "Environment" 
  | "Education" 
  | "Hunger Relief" 
  | "Elderly Care" 
  | "Animal Welfare" 
  | "Crisis Support" 
  | "Community Development";

export interface ServiceEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxVolunteers: number;
  signedUpVolunteers: string[]; // List of user emails
  completed: boolean;
  organizerEmail: string;
  image: string;
  impactMetric: string; // e.g. "150 lbs of trash cleaned", "50 meals served"
}

export interface HoursLog {
  id: string;
  userEmail: string;
  userName: string;
  eventId: string;
  eventTitle: string;
  date: string;
  hours: number;
  reflection: string;
  supervisorEmail: string;
  status: "pending" | "approved" | "rejected";
  dateLogged: string;
  notes?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  unlockedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  sender: string;
  category: "urgent" | "general" | "update";
}

export interface CommunityFeedback {
  id: string;
  userEmail: string;
  userName: string;
  userAvatar: string;
  eventId: string;
  eventTitle: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}
