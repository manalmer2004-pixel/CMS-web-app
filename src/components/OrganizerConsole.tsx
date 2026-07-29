import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Award, 
  TrendingUp, 
  Users, 
  Clock, 
  MapPin, 
  AlertCircle,
  Calendar,
  Image as ImageIcon
} from "lucide-react";
import { ServiceEvent, HoursLog, EventCategory, UserProfile } from "../types";

interface OrganizerConsoleProps {
  events: ServiceEvent[];
  logs: HoursLog[];
  users: UserProfile[];
  onApproveLog: (logId: string, notes: string) => void;
  onRejectLog: (logId: string, notes: string) => void;
  onAddEvent: (event: Omit<ServiceEvent, "id" | "signedUpVolunteers" | "completed">) => void;
}

const CATEGORIES: EventCategory[] = [
  "Environment",
  "Education",
  "Hunger Relief",
  "Elderly Care",
  "Animal Welfare",
  "Crisis Support",
  "Community Development"
];

export default function OrganizerConsole({ 
  events, 
  logs, 
  users,
  onApproveLog, 
  onRejectLog, 
  onAddEvent 
}: OrganizerConsoleProps) {
  // Tabs: "approvals" | "create_event" | "analytics"
  const [activeTab, setActiveTab] = useState<"approvals" | "create_event" | "analytics">("approvals");

  // Form states
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventCat, setNewEventCat] = useState<EventCategory>("Environment");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventStartTime, setNewEventStartTime] = useState("09:00");
  const [newEventEndTime, setNewEventEndTime] = useState("12:00");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventCapacity, setNewEventCapacity] = useState<number>(20);
  const [newEventImpact, setNewEventImpact] = useState("");
  const [newEventImage, setNewEventImage] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  // Verification notes states mapped by logId
  const [verificationNotes, setVerificationNotes] = useState<Record<string, string>>({});

  const pendingLogs = logs.filter(log => log.status === "pending");
  const approvedLogsCount = logs.filter(log => log.status === "approved").length;
  
  // Calculations
  const totalHoursDelivered = logs
    .filter(log => log.status === "approved")
    .reduce((sum, log) => sum + log.hours, 0);

  // Real registered volunteers (not just people who've logged hours) —
  // this updates the moment someone signs up, with zero hours until they log some.
  const registeredVolunteers = users
    .filter(u => u.role === "volunteer")
    .sort((a, b) => b.totalHours - a.totalHours);

  const activeVolunteersCount = registeredVolunteers.length;

  const handleNotesChange = (logId: string, text: string) => {
    setVerificationNotes(prev => ({ ...prev, [logId]: text }));
  };

  const handlePublishEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDesc.trim() || !newEventLocation.trim() || !newEventImpact.trim() || !newEventDate) {
      setFormError("All key event details must be filled in.");
      return;
    }
    if (newEventCapacity <= 0) {
      setFormError("Capacity must be at least 1 volunteer.");
      return;
    }

    const defaultImages: Record<EventCategory, string> = {
      "Environment": "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=600",
      "Education": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600",
      "Hunger Relief": "https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&q=80&w=600",
      "Elderly Care": "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=600",
      "Animal Welfare": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600",
      "Crisis Support": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600",
      "Community Development": "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=600"
    };

    const finalImage = newEventImage.trim() || defaultImages[newEventCat];

    onAddEvent({
      title: newEventTitle,
      description: newEventDesc,
      category: newEventCat,
      date: newEventDate,
      startTime: newEventStartTime,
      endTime: newEventEndTime,
      location: newEventLocation,
      maxVolunteers: newEventCapacity,
      organizerEmail: "marcus.director@community.org",
      image: finalImage,
      impactMetric: newEventImpact
    });

    // Reset Form
    setNewEventTitle("");
    setNewEventDesc("");
    setNewEventDate("");
    setNewEventStartTime("09:00");
    setNewEventEndTime("12:00");
    setNewEventLocation("");
    setNewEventCapacity(20);
    setNewEventImpact("");
    setNewEventImage("");
    setFormError("");
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
  };

  return (
    <div className="space-y-6" id="organizer-console-root">
      
      {/* Top Console Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Coordinator Console</h1>
          <p className="text-xs text-slate-400 font-medium">Verify service times, create community initiatives, and view impact analytics</p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1 self-start">
          {[
            { id: "approvals", label: `Pending Approvals (${pendingLogs.length})` },
            { id: "create_event", label: "Create Event" },
            { id: "analytics", label: "Program Analytics" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold tracking-wide transition ${
                activeTab === tab.id 
                  ? "bg-white text-slate-800 shadow-3xs" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* RENDER ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Hours Delivered</span>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                <span className="font-display text-2xl font-bold text-slate-800">{totalHoursDelivered}h</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Registered Volunteers</span>
              <div className="flex items-center gap-2 mt-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-display text-2xl font-bold text-slate-800">{activeVolunteersCount}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Active Initiatives</span>
              <div className="flex items-center gap-2 mt-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                <span className="font-display text-2xl font-bold text-slate-800">{events.filter(e => !e.completed).length}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Approved Logs</span>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <span className="font-display text-2xl font-bold text-slate-800">{approvedLogsCount}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-3">
              <h3 className="font-display text-sm font-bold text-slate-800">Impact Categories Distribution</h3>
              <p className="text-[11px] text-slate-400">Total hours logged per sector</p>
              
              <div className="space-y-3 pt-2 text-xs">
                {CATEGORIES.map(category => {
                  const catEvents = events.filter(e => e.category === category).map(e => e.id);
                  const catHours = logs
                    .filter(l => l.status === "approved" && catEvents.includes(l.eventId))
                    .reduce((sum, l) => sum + l.hours, 0);
                  
                  const maxVal = Math.max(...CATEGORIES.map(c => {
                    const evs = events.filter(e => e.category === c).map(e => e.id);
                    return logs.filter(l => l.status === "approved" && evs.includes(l.eventId)).reduce((sum, l) => sum + l.hours, 0);
                  }), 1);

                  const fillPercent = (catHours / maxVal) * 100;

                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-600">{category}</span>
                        <span className="font-bold text-slate-800">{catHours}h</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-emerald-600 transition-all duration-500" 
                          style={{ width: `${Math.max(fillPercent, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-3">
              <h3 className="font-display text-sm font-bold text-slate-800">Registered Community Volunteers</h3>
              <p className="text-[11px] text-slate-400">Live list of every volunteer account, most active hours first</p>
              
              <div className="divide-y divide-slate-100 pt-2 text-xs max-h-72 overflow-y-auto">
                {registeredVolunteers.length === 0 ? (
                  <p className="text-slate-400 italic py-6 text-center">
                    No volunteers have registered yet.
                  </p>
                ) : (
                  registeredVolunteers.map((vol) => (
                    <div key={vol.email} className="flex items-center justify-between py-2.5">
                      <div>
                        <span className="font-bold text-slate-800 block">{vol.name}</span>
                        <span className="text-[10px] text-slate-400">{vol.email}</span>
                      </div>
                      <span className="font-mono bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                        {vol.totalHours}h
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* RENDER APPROVALS TAB */}
      {activeTab === "approvals" && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {pendingLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 text-center bg-white px-4">
              <CheckCircle className="h-12 w-12 text-emerald-500 stroke-1" />
              <h3 className="mt-3 text-base font-bold text-slate-700">Excellent! Inbox is clean</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">All submitted hours from volunteers have been processed and resolved.</p>
            </div>
          ) : (
            pendingLogs.map((log) => (
              <div 
                key={log.id} 
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-3xs text-xs"
              >
                {/* Header info */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {log.userName} ({log.userEmail})
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Completed <strong className="text-slate-600 font-bold">{log.hours} hours</strong> for <strong className="text-slate-600 font-bold">{log.eventTitle}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold">
                    <span>Date of Service: {log.date}</span>
                    <span>Logged: {log.dateLogged}</span>
                  </div>
                </div>

                {/* Reflection Notes */}
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider block">Volunteer Reflection:</span>
                  <p className="text-slate-600 italic leading-relaxed">
                    "{log.reflection}"
                  </p>
                </div>

                {/* Approval actions panel */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Add supervisor notes or feedback comments (optional)..."
                      value={verificationNotes[log.id] || ""}
                      onChange={(e) => handleNotesChange(log.id, e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 p-2.5 outline-none transition focus:border-emerald-500 bg-white"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const confirmed = window.confirm(
                          `Reject ${log.hours} hours logged by ${log.userName} for "${log.eventTitle}"? They will not be credited for this time.`
                        );
                        if (confirmed) onRejectLog(log.id, verificationNotes[log.id] || "");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 transition"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>

                    <button
                      onClick={() => onApproveLog(log.id, verificationNotes[log.id] || "Hours verified and approved. Great work!")}
                      className="inline-flex items-center gap-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 transition shadow-2xs"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve Hours
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}

      {/* RENDER CREATE EVENT TAB */}
      {activeTab === "create_event" && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-3xs"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-6">
            <PlusCircle className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="font-display text-base font-bold text-slate-800 font-display">Publish New Community Event</h2>
              <p className="text-[11px] text-slate-400">Launch a new volunteer project onto the discovery explorer board</p>
            </div>
          </div>

          <form onSubmit={handlePublishEvent} className="space-y-4 text-xs">
            {/* Event Title */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600">Event Title / Initiative Name</label>
              <input
                type="text"
                placeholder="e.g. Park Street Tree Planting Drive"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 outline-none transition focus:border-emerald-500 text-xs"
              />
            </div>

            {/* Event Description */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600">Event Description & Instructions</label>
              <textarea
                rows={4}
                placeholder="Describe the service, what volunteers will be doing, and any specific requirements or clothing constraints..."
                value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 outline-none transition focus:border-emerald-500 text-xs"
              />
            </div>

            {/* Category, Date, Times Row */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600">Work Domain</label>
                <select
                  value={newEventCat}
                  onChange={(e) => setNewEventCat(e.target.value as EventCategory)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none transition focus:border-emerald-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600">Service Date</label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600">Start Time</label>
                <input
                  type="time"
                  value={newEventStartTime}
                  onChange={(e) => setNewEventStartTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600">End Time</label>
                <input
                  type="time"
                  value={newEventEndTime}
                  onChange={(e) => setNewEventEndTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none transition focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Location & Capacity & Impact */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600">Location Address</label>
                <div className="relative">
                  <MapPin className="absolute top-3 left-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Hope Commons room 30"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pr-2.5 pl-8 outline-none transition focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600">Max Capacity (Volunteers)</label>
                <input
                  type="number"
                  min="1"
                  value={newEventCapacity}
                  onChange={(e) => setNewEventCapacity(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600">Planned Impact Statement</label>
                <input
                  type="text"
                  placeholder="e.g. Sort 200 boxes of food supplies"
                  value={newEventImpact}
                  onChange={(e) => setNewEventImpact(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none transition focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Custom Image URL */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600">Custom Cover Image URL (Optional)</label>
              <div className="relative">
                <ImageIcon className="absolute top-3 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newEventImage}
                  onChange={(e) => setNewEventImage(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2.5 pr-2.5 pl-8 outline-none transition focus:border-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400">Leave blank to assign a beautiful themed category cover illustration automatically.</p>
            </div>

            {/* Form messaging */}
            {formError && (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-50 p-3 text-[11px] text-red-600 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 p-3 text-[11px] text-emerald-700 font-semibold">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Community event successfully published! Volunteers can now view and register.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white py-3 transition shadow-xs"
            >
              Publish Initiative
            </button>
          </form>
        </motion.div>
      )}

    </div>
  );
}