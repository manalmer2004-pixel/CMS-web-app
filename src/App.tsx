import React, { useState, useEffect } from "react";
import { 
  Heart, 
  Calendar, 
  Clock, 
  User, 
  Trophy, 
  Users, 
  Menu, 
  X, 
  Settings, 
  ChevronRight,
  Shield,
  ArrowRightLeft,
  Activity,
  Award,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserPlus
} from "lucide-react";

import { 
  UserProfile, 
  ServiceEvent, 
  HoursLog, 
  Announcement, 
  CommunityFeedback, 
  UserRole 
} from "./types";

import Dashboard from "./components/Dashboard";
import EventExplorer from "./components/EventExplorer";
import HoursLogger from "./components/HoursLogger";
import OrganizerConsole from "./components/OrganizerConsole";
import VolunteerProfile from "./components/VolunteerProfile";

export default function App() {
  // ---------------------------------------------------------------------------
  // Reactive States (Synchronized with Full-Stack MongoDB API)
  // ---------------------------------------------------------------------------
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("servicehub_token"));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(!!token);

  const [events, setEvents] = useState<ServiceEvent[]>([]);
  const [logs, setLogs] = useState<HoursLog[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [feedbacks, setFeedbacks] = useState<CommunityFeedback[]>([]);

  // Current selected view/tab
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  
  // Current mode/role ("volunteer" | "coordinator")
  const [currentRole, setCurrentRole] = useState<UserRole>("volunteer");

  // Selected event ID in the explorer (for details view)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // App-wide notification toasts
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // Mobile menu control toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth Form States
  const [isSignUp, setIsSignUp] = useState(false);
  const [authRole, setAuthRole] = useState<UserRole>("volunteer");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Helper to trigger notification toasts
  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Generic full-stack API fetch wrapper
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };
    
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed with status ${res.status}`);
    }
    return res.json();
  };

  // ---------------------------------------------------------------------------
  // Auth Session Verification on startup
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (token) {
      setIsLoadingAuth(true);
      fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error("Session expired");
          return res.json();
        })
        .then(data => {
          setUser(data.user);
          setCurrentRole(data.user.role);
          setActiveTab(data.user.role === "coordinator" ? "coordinator" : "dashboard");
          setIsLoadingAuth(false);
        })
        .catch(() => {
          // Clear expired token
          setToken(null);
          setUser(null);
          localStorage.removeItem("servicehub_token");
          setIsLoadingAuth(false);
        });
    } else {
      setUser(null);
      setIsLoadingAuth(false);
    }
  }, [token]);

  // Save token to localStorage when set
  useEffect(() => {
    if (token) {
      localStorage.setItem("servicehub_token", token);
    } else {
      localStorage.removeItem("servicehub_token");
    }
  }, [token]);

  // ---------------------------------------------------------------------------
  // Data synchronization when logged in
  // ---------------------------------------------------------------------------
  const syncAppData = () => {
    if (!user) return;

    apiFetch("/api/events")
      .then(data => setEvents(data))
      .catch(err => showToast(`Failed to sync initiatives: ${err.message}`, "error"));

    apiFetch("/api/logs")
      .then(data => setLogs(data))
      .catch(err => showToast(`Failed to sync log history: ${err.message}`, "error"));

    apiFetch("/api/announcements")
      .then(data => setAnnouncements(data))
      .catch(err => showToast(`Failed to sync announcements: ${err.message}`, "error"));

    apiFetch("/api/feedbacks")
      .then(data => setFeedbacks(data))
      .catch(err => showToast(`Failed to sync experience feedback: ${err.message}`, "error"));
  };

  useEffect(() => {
    syncAppData();
  }, [user]);

  // ---------------------------------------------------------------------------
  // Auth Handlers
  // ---------------------------------------------------------------------------
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput || (isSignUp && !nameInput)) {
      showToast("Please fill out all required fields", "error");
      return;
    }

    setIsSubmittingAuth(true);
    const url = isSignUp ? "/api/auth/signup" : "/api/auth/login";
    const body = isSignUp 
      ? {
          name: nameInput,
          email: emailInput,
          password: passwordInput,
          role: authRole,
          phone: phoneInput,
          bio: bioInput,
          skills: skillsInput ? skillsInput.split(",").map(s => s.trim()).filter(Boolean) : []
        }
      : {
          email: emailInput,
          password: passwordInput
        };

    try {
      const data = await apiFetch(url, {
        method: "POST",
        body: JSON.stringify(body)
      });
      
      setToken(data.token);
      setUser(data.user);
      setCurrentRole(data.user.role);
      setActiveTab(data.user.role === "coordinator" ? "coordinator" : "dashboard");
      showToast(isSignUp ? "Account registered successfully! Welcome." : "Logged in successfully!", "success");
      
      // Clean up form inputs
      setEmailInput("");
      setPasswordInput("");
      setNameInput("");
      setPhoneInput("");
      setSkillsInput("");
      setBioInput("");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setEvents([]);
    setLogs([]);
    setAnnouncements([]);
    setFeedbacks([]);
    showToast("Logged out successfully. See you soon!", "info");
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setIsSubmittingAuth(true);
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: demoEmail,
          password: "password123"
        })
      });
      setToken(data.token);
      setUser(data.user);
      setCurrentRole(data.user.role);
      setActiveTab(data.user.role === "coordinator" ? "coordinator" : "dashboard");
      showToast(`Logged in successfully as ${data.user.name}!`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // ---------------------------------------------------------------------------
  // State Mutators & Handlers (Proxied to MongoDB Express API)
  // ---------------------------------------------------------------------------

  // 1. Volunteer Register / Leave Event Handler
  const handleToggleSignUp = (eventId: string) => {
    apiFetch(`/api/events/${eventId}/signup`, { method: "POST" })
      .then(updatedEvent => {
        setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
        const isSignedUp = updatedEvent.signedUpVolunteers.includes(user!.email);
        showToast(
          isSignedUp 
            ? `Registered successfully! Shift scheduled for: ${updatedEvent.title}`
            : `Successfully canceled registration for: ${updatedEvent.title}`,
          isSignedUp ? "success" : "info"
        );
      })
      .catch(err => showToast(err.message, "error"));
  };

  // 2. Submit Hours Log Form Handler
  const handleSubmitHoursLog = (newLogData: Omit<HoursLog, "id" | "userEmail" | "userName" | "status" | "dateLogged">) => {
    apiFetch("/api/logs", {
      method: "POST",
      body: JSON.stringify(newLogData)
    })
      .then(newLog => {
        setLogs(prev => [newLog, ...prev]);
        showToast("Hours log filed successfully! A coordinator will verify soon.", "success");
      })
      .catch(err => showToast(`Failed to submit hours log: ${err.message}`, "error"));
  };

  // 3. Coordinator Approves Hour Log
  const handleApproveLog = (logId: string, notes: string) => {
    apiFetch(`/api/logs/${logId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "approved", notes })
    })
      .then(updatedLog => {
        setLogs(prev => prev.map(l => l.id === logId ? updatedLog : l));
        
        // Re-fetch current user profile because hours, level, or badges might have been updated!
        apiFetch("/api/auth/me")
          .then(data => {
            setUser(data.user);
          });

        showToast(`Approved ${updatedLog.hours} hours logged by ${updatedLog.userName}.`, "success");
      })
      .catch(err => showToast(`Failed to approve log: ${err.message}`, "error"));
  };

  // 4. Coordinator Rejects Hour Log
  const handleRejectLog = (logId: string, notes: string) => {
    apiFetch(`/api/logs/${logId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "rejected", notes })
    })
      .then(updatedLog => {
        setLogs(prev => prev.map(l => l.id === logId ? updatedLog : l));
        showToast(`Rejected log of ${updatedLog.hours} hours by ${updatedLog.userName}.`, "info");
      })
      .catch(err => showToast(`Failed to reject log: ${err.message}`, "error"));
  };

  // 5. Coordinator Creates & Publishes New Event
  const handleAddEvent = (newEventData: Omit<ServiceEvent, "id" | "signedUpVolunteers" | "completed">) => {
    apiFetch("/api/events", {
      method: "POST",
      body: JSON.stringify(newEventData)
    })
      .then(newEvent => {
        setEvents(prev => [newEvent, ...prev]);
        
        // Re-sync announcements to display the automated event-launch announcement
        apiFetch("/api/announcements")
          .then(data => setAnnouncements(data));

        showToast("Initiative published! A notification announcement was broadcasted.", "success");
      })
      .catch(err => showToast(`Failed to publish initiative: ${err.message}`, "error"));
  };

  // 6. User Profile Edits Handler
  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    apiFetch("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify(updates)
    })
      .then(data => {
        setUser(data.user);
        showToast("Successfully updated your profile coordinates!", "success");
      })
      .catch(err => showToast(`Failed to update profile: ${err.message}`, "error"));
  };

  // 7. Write and Post Event Feedback Handler
  const handleSubmitFeedback = (eventId: string, rating: number, comment: string) => {
    apiFetch("/api/feedbacks", {
      method: "POST",
      body: JSON.stringify({ eventId, rating, comment })
    })
      .then(newFeedback => {
        setFeedbacks(prev => [newFeedback, ...prev]);
        showToast("Thank you for sharing your genuine experience review!", "success");
      })
      .catch(err => showToast(`Failed to submit feedback: ${err.message}`, "error"));
  };

  // Navigation tabs list depending on active role mode
  const navTabs = currentRole === "volunteer" 
    ? [
        { id: "dashboard", label: "Dashboard", icon: Activity },
        { id: "events", label: "Discover Initiatives", icon: Calendar },
        { id: "hours", label: "Track & Log Hours", icon: Clock },
        { id: "profile", label: "My Profile", icon: User }
      ]
    : [
        { id: "coordinator", label: "Coordinator Console", icon: Shield }
      ];

  // Helper helper to handle selection from dashboard schedule
  const handleSelectEventFromDashboard = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab("events");
  };

  // ---------------------------------------------------------------------------
  // AUTHENTICATION VIEW (If not logged in)
  // ---------------------------------------------------------------------------
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-3" id="auth-loading-screen">
        <Heart className="h-10 w-10 text-emerald-600 animate-pulse" />
        <span className="text-xs font-semibold text-slate-400 font-mono tracking-widest">LOADING SESSION...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row" id="auth-screen">
        
        {/* Left Side: Brand & Metrics Banner */}
        <div className="hidden md:flex md:w-5/12 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-600 p-2 text-white">
                <Heart className="h-6 w-6 fill-white stroke-0" />
              </div>
              <div>
                <span className="font-display text-lg font-extrabold tracking-tight text-white block leading-none">ServiceHub</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-wider">COMMUNITY PLATFORM</span>
              </div>
            </div>
          </div>

          <div className="z-10 space-y-6 my-auto">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              Inspire, Connect, and Grow Together.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Discover and organize local grassroots initiatives, file volunteer hours seamlessly, earn badges, and leave reviews to strengthen community enrichment.
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div>
                <span className="text-2xl font-bold text-emerald-400 block font-mono">1,000+</span>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Service Hours</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-emerald-400 block font-mono">6</span>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Grassroots Areas</span>
              </div>
            </div>
          </div>

          <div className="z-10 text-xs text-slate-500 font-medium">
            ServiceHub © 2026. Made with love for public community service.
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 p-8 shadow-md">
            
            <div className="text-center md:text-left mb-6">
              <div className="flex md:hidden justify-center items-center gap-2 mb-3">
                <div className="rounded-lg bg-emerald-600 p-1.5 text-white">
                  <Heart className="h-5 w-5 fill-white stroke-0" />
                </div>
                <span className="font-display text-sm font-extrabold text-slate-800">ServiceHub</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                {isSignUp ? "Create a service account" : "Welcome back to ServiceHub"}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {isSignUp ? "Join as a helper or an organizer today" : "Sign in to track hours and join new volunteer initiatives"}
              </p>
            </div>

            {/* Custom Toast inside form */}
            {toastMessage && (
              <div className={`mb-4 flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-bold leading-snug animate-fade-in ${
                toastMessage.type === "success" 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                  : toastMessage.type === "error"
                  ? "bg-rose-50 border-rose-100 text-rose-800"
                  : "bg-blue-50 border-blue-100 text-blue-800"
              }`}>
                {toastMessage.type === "success" ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                )}
                <span>{toastMessage.text}</span>
              </div>
            )}

            {/* Main Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {isSignUp && (
                <>
                  {/* Account Role Selector */}
                  <div>
                    <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1.5">
                      Select Your Role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAuthRole("volunteer")}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                          authRole === "volunteer"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Volunteer
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthRole("coordinator")}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                          authRole === "coordinator"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Coordinator
                      </button>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full text-xs bg-slate-50 hover:bg-slate-50/50 focus:bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500 transition font-medium"
                    />
                  </div>

                  {/* Phone (Optional) */}
                  <div>
                    <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full text-xs bg-slate-50 hover:bg-slate-50/50 focus:bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500 transition font-medium"
                    />
                  </div>
                </>
              )}

              {/* Email */}
              <div>
                <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full text-xs bg-slate-50 hover:bg-slate-50/50 focus:bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-emerald-500 transition font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1">
                  Password *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full text-xs bg-slate-50 hover:bg-slate-50/50 focus:bg-white border border-slate-200 rounded-lg pl-9 pr-10 py-2.5 outline-none focus:border-emerald-500 transition font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && authRole === "volunteer" && (
                <>
                  {/* Skills (Optional) */}
                  <div>
                    <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1">
                      Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="Tutoring, Graphic Design, Event Planning"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      className="w-full text-xs bg-slate-50 hover:bg-slate-50/50 focus:bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500 transition font-medium"
                    />
                  </div>

                  {/* Bio (Optional) */}
                  <div>
                    <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1">
                      Short Bio
                    </label>
                    <textarea
                      placeholder="Share a short bio with local coordinators..."
                      rows={2}
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      className="w-full text-xs bg-slate-50 hover:bg-slate-50/50 focus:bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500 transition font-medium resize-none"
                    />
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmittingAuth ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : isSignUp ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Complete Sign Up
                  </>
                ) : (
                  "Sign In Securely"
                )}
              </button>

            </form>

            {/* Navigation Toggle */}
            <div className="text-center mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setToastMessage(null);
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer transition"
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up as Volunteer"}
              </button>
            </div>

            {/* Preset Demo Credentials Box */}
            <div className="mt-6 bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider leading-none">Sandbox Demo Logins</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-normal">
                Click a preset account below to log in instantly with seeded MongoDB database data:
              </p>
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleDemoLogin("manalmer2004@gmail.com")}
                  disabled={isSubmittingAuth}
                  className="bg-white hover:bg-emerald-50 border border-slate-200/60 hover:border-emerald-200 text-slate-700 hover:text-emerald-800 text-[10px] font-bold py-2 px-2.5 rounded-lg text-left cursor-pointer transition flex flex-col gap-0.5 shadow-3xs"
                >
                  <span className="text-[8px] uppercase tracking-wider text-slate-400">VOLUNTEER</span>
                  <span className="truncate">Manal Mer</span>
                </button>
                <button
                  onClick={() => handleDemoLogin("marcus.director@community.org")}
                  disabled={isSubmittingAuth}
                  className="bg-white hover:bg-emerald-50 border border-slate-200/60 hover:border-emerald-200 text-slate-700 hover:text-emerald-800 text-[10px] font-bold py-2 px-2.5 rounded-lg text-left cursor-pointer transition flex flex-col gap-0.5 shadow-3xs"
                >
                  <span className="text-[8px] uppercase tracking-wider text-slate-400">COORDINATOR</span>
                  <span className="truncate">Director Marcus</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="app-viewport">
      
      {/* -----------------------------------------------------------------------
          TOP GLOBAL NOTIFICATION BAR / TOAST
          ----------------------------------------------------------------------- */}
      {toastMessage && (
        <div 
          className="fixed top-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border p-4 shadow-lg animate-bounce duration-300 bg-white animate-fade-in"
          style={{
            borderColor: toastMessage.type === "success" ? "#bbf7d0" : toastMessage.type === "error" ? "#fecaca" : "#e2e8f0"
          }}
          id="toast-notification"
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : toastMessage.type === "error" ? (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          ) : (
            <Info className="h-5 w-5 text-slate-500 shrink-0" />
          )}
          <span className="text-xs font-bold text-slate-700 leading-normal">
            {toastMessage.text}
          </span>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          ROLE PREFERENCE QUICK SWITCH BANNER
          ----------------------------------------------------------------------- */}
      {user.role === "coordinator" && (
        <div className="bg-slate-900 border-b border-slate-800 text-slate-400 py-1.5 px-4 text-[11px] font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Coordinator Viewport Sandbox: You have access to both volunteer and administration screens!</span>
          </div>
          
          <button
            onClick={() => {
              const nextRole = currentRole === "volunteer" ? "coordinator" : "volunteer";
              setCurrentRole(nextRole);
              setActiveTab(nextRole === "volunteer" ? "dashboard" : "coordinator");
              setSelectedEventId(null);
              showToast(`Switched workspace into: ${nextRole === "volunteer" ? "Volunteer View" : "Coordinator Console"}`);
            }}
            className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 transition px-2.5 py-1 rounded text-emerald-400 cursor-pointer"
          >
            <ArrowRightLeft className="h-3 w-3" />
            Switch to {currentRole === "volunteer" ? "Coordinator Console" : "Volunteer View"}
          </button>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MAIN HEADER NAVIGATION BAR
          ----------------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-3xs" id="app-main-navbar">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            
            {/* Brand Logo */}
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-2 text-white">
                <Heart className="h-5 w-5 fill-white stroke-0" />
              </div>
              <div>
                <span className="font-display text-base font-extrabold tracking-tight text-slate-800">ServiceHub</span>
                <span className="text-[10px] text-slate-400 block font-mono -mt-1 font-semibold">COMMUNITY COOPERATIVE</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navTabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSelectedEventId(null);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold tracking-wide transition ${
                      isActive 
                        ? "bg-emerald-50 text-emerald-800 shadow-2xs border border-emerald-100/50" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <TabIcon className="h-4 w-4 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Desktop Right User Bubble */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-700 block leading-none">{user.name}</span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {user.role === "coordinator" ? "Site Coordinator" : `LVL ${user.level} Volunteer`}
                </span>
              </div>
              <button 
                onClick={() => {
                  if (currentRole === "volunteer") {
                    setActiveTab("profile");
                    setSelectedEventId(null);
                  }
                }}
                className="relative cursor-pointer group"
                disabled={currentRole !== "volunteer"}
              >
                <img
                  src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"}
                  alt={user.name}
                  className="h-9 w-9 rounded-full object-cover border-2 border-emerald-500/20 group-hover:border-emerald-600 transition"
                  referrerPolicy="no-referrer"
                />
                {user.role === "volunteer" && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white border border-white">
                    {user.badgeIds?.length || 0}
                  </span>
                )}
              </button>

              {/* Secure Log Out Icon */}
              <button
                onClick={handleLogout}
                title="Sign Out Securely"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition focus:outline-none ml-1"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Navigation Trigger */}
            <div className="flex md:hidden items-center gap-3">
              <button
                onClick={() => {
                  if (currentRole === "volunteer") {
                    setActiveTab("profile");
                    setSelectedEventId(null);
                  }
                }}
                className="h-8 w-8 rounded-full overflow-hidden border border-slate-200"
                disabled={currentRole !== "volunteer"}
              >
                <img 
                  src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"} 
                  alt={user.name} 
                  className="h-full w-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-2 shadow-sm animate-fade-in">
            {navTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedEventId(null);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold ${
                    isActive 
                      ? "bg-emerald-50 text-emerald-800" 
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <TabIcon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
            
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50/50"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign Out Securely
            </button>
          </div>
        )}
      </header>

      {/* -----------------------------------------------------------------------
          MAIN APP CONTENT WORKSPACE AREA
          ----------------------------------------------------------------------- */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 md:px-6" id="app-workspace-body">
        {activeTab === "dashboard" && currentRole === "volunteer" && (
          <Dashboard 
            user={user} 
            events={events} 
            announcements={announcements} 
            logs={logs} 
            onTabChange={setActiveTab}
            onSelectEvent={handleSelectEventFromDashboard}
          />
        )}

        {activeTab === "events" && currentRole === "volunteer" && (
          <EventExplorer 
            events={events} 
            user={user} 
            feedbacks={feedbacks} 
            onToggleSignUp={handleToggleSignUp} 
            onSubmitFeedback={handleSubmitFeedback}
            selectedEventId={selectedEventId}
            setSelectedEventId={setSelectedEventId}
          />
        )}

        {activeTab === "hours" && currentRole === "volunteer" && (
          <HoursLogger 
            logs={logs} 
            events={events} 
            user={user} 
            onSubmitLog={handleSubmitHoursLog} 
          />
        )}

        {activeTab === "profile" && currentRole === "volunteer" && (
          <VolunteerProfile 
            user={user} 
            onUpdateProfile={handleUpdateProfile} 
          />
        )}

        {activeTab === "coordinator" && currentRole === "coordinator" && (
          <OrganizerConsole 
            events={events} 
            logs={logs} 
            onApproveLog={handleApproveLog} 
            onRejectLog={handleRejectLog} 
            onAddEvent={handleAddEvent} 
          />
        )}
      </main>

      {/* -----------------------------------------------------------------------
          MAIN APP FOOTER
          ----------------------------------------------------------------------- */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400 font-semibold" id="app-footer">
        <div className="mx-auto max-w-7xl px-4 md:px-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span>ServiceHub © 2026. Made with love for community enrichment.</span>
          <div className="flex gap-4 justify-center">
            <a href="#" className="hover:text-slate-600 transition">Code of Conduct</a>
            <a href="#" className="hover:text-slate-600 transition">Privacy Guidelines</a>
            <a href="#" className="hover:text-slate-600 transition">Coordinator Help</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
