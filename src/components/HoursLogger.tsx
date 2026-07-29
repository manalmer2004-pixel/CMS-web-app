import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  PlusCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Calendar, 
  Search,
  BookOpen
} from "lucide-react";
import { HoursLog, ServiceEvent, UserProfile } from "../types";

interface HoursLoggerProps {
  logs: HoursLog[];
  events: ServiceEvent[];
  user: UserProfile;
  onSubmitLog: (log: Omit<HoursLog, "id" | "userEmail" | "userName" | "status" | "dateLogged">) => void;
}

export default function HoursLogger({ logs, events, user, onSubmitLog }: HoursLoggerProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [customEventTitle, setCustomEventTitle] = useState("");
  const [hours, setHours] = useState<number>(3);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [reflection, setReflection] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");

  const DRAFT_KEY = `hourslog_draft_${user.email}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.selectedEventId) setSelectedEventId(draft.selectedEventId);
        if (draft.customEventTitle) setCustomEventTitle(draft.customEventTitle);
        if (draft.reflection) setReflection(draft.reflection);
      }
    } catch {
      // ignore malformed drafts
    }
  }, []);

  useEffect(() => {
    if (!reflection.trim() && !customEventTitle.trim()) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ selectedEventId, customEventTitle, reflection })
      );
    } catch {
      // localStorage unavailable — fail silently
    }
  }, [selectedEventId, customEventTitle, reflection]);
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Get only events the user is signed up for or completed
  const volunteerEvents = events.filter(
    e => e.signedUpVolunteers.includes(user.email) || e.completed
  );

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedEventId(val);
    
    if (val && val !== "custom") {
      const matchedEvent = events.find(event => event.id === val);
      if (matchedEvent) {
        setSupervisorEmail(matchedEvent.organizerEmail);
        setDate(matchedEvent.date);
      }
    } else {
      setSupervisorEmail("");
      setDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      setError("Please select an event or choose 'Independent custom service'.");
      return;
    }
    if (selectedEventId === "custom" && !customEventTitle.trim()) {
      setError("Please write the name of your independent community project.");
      return;
    }
    if (hours <= 0 || hours > 24) {
      setError("Please enter a valid amount of hours worked (between 0.5 and 24).");
      return;
    }
    if (!supervisorEmail.trim()) {
      setError("Please provide a supervisor email for hours verification.");
      return;
    }
    if (reflection.trim().length < 15) {
      setError("Please write a small reflection (at least 15 characters) about your service.");
      return;
    }

    const eventTitle = selectedEventId === "custom" 
      ? customEventTitle 
      : (events.find(ev => ev.id === selectedEventId)?.title || "Independent Service");

    onSubmitLog({
      eventId: selectedEventId,
      eventTitle,
      hours,
      date,
      reflection,
      supervisorEmail
    });

    // Reset form
    setSelectedEventId("");
    setCustomEventTitle("");
    setHours(3);
    setDate(new Date().toISOString().split('T')[0]);
    setSupervisorEmail("");
    setReflection("");
    setError("");
    setSuccess(true);
    localStorage.removeItem(DRAFT_KEY);
    setTimeout(() => setSuccess(false), 3000);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reflection.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="grid gap-8 md:grid-cols-5" id="hours-logger-root">
      {/* Left Column: Form (2/5 size) */}
      <div className="md:col-span-2 space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PlusCircle className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="font-display text-base font-bold text-slate-800">Log Volunteer Hours</h2>
              <p className="text-[11px] text-slate-400">Report completed hours for coordinator review</p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="mt-4 space-y-4 text-xs">
            {/* Event Dropdown Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600">Select Service Initiative</label>
              <select
                value={selectedEventId}
                onChange={handleEventChange}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none transition focus:border-emerald-500"
              >
                <option value="">-- Choose an event --</option>
                <optgroup label="Your Registered Initiatives">
                  {volunteerEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.date})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Other Service Options">
                  <option value="custom">✍️ Independent custom service project</option>
                </optgroup>
              </select>
            </div>

            {/* Custom Event Input (Conditional) */}
            {selectedEventId === "custom" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-1.5"
              >
                <label className="font-semibold text-slate-600">Independent Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Local Library book cataloging"
                  value={customEventTitle}
                  onChange={(e) => setCustomEventTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none transition focus:border-emerald-500"
                />
              </motion.div>
            )}

            {/* Hours and Date (Row) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600">Hours Worked</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600">Service Date</label>
                <div className="relative">
                  <Calendar className="absolute top-3 left-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pr-2.5 pl-8 outline-none transition focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Supervisor Email */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600">Supervisor / Witness Email</label>
              <div className="relative">
                <Mail className="absolute top-3 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  placeholder="supervisor@community.org"
                  value={supervisorEmail}
                  onChange={(e) => setSupervisorEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2.5 pr-2.5 pl-8 outline-none transition focus:border-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400">An automatic verification request will be sent to this email.</p>
            </div>

            {/* Reflection / Summary */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600">Personal Reflection & Impact Summary</label>
              <textarea
                rows={4}
                placeholder="What exactly did you help with? What did you learn and how did this benefit the community?"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 outline-none transition focus:border-emerald-500"
              />
            </div>

            {/* Alert prompts */}
            {error && (
              <div className="flex items-center gap-1 rounded-lg bg-red-50 p-2.5 text-[11px] text-red-600 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-1 rounded-lg bg-emerald-50 p-2.5 text-[11px] text-emerald-700 font-semibold">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Hours log submitted successfully! Pending supervisor verification.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white py-2.5 transition shadow-xs"
            >
              Submit Hours Log
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: List & Details (3/5 size) */}
      <div className="md:col-span-3 space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-800">Your Volunteer Logs</h2>
              <p className="text-[11px] text-slate-400">Overview of all submitted hours, approved or pending</p>
            </div>

            {/* Small status filters */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
              {[
                { label: "All", value: "all" },
                { label: "Approved", value: "approved" },
                { label: "Pending", value: "pending" }
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => setStatusFilter(item.value as any)}
                  className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold tracking-wide transition ${
                    statusFilter === item.value 
                      ? "bg-white text-slate-800 shadow-3xs" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search box for logs */}
          <div className="mt-4 relative">
            <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 py-2 pr-3 pl-9 outline-none transition focus:border-emerald-500"
            />
          </div>

          {/* Logs List */}
          <div className="mt-4 divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FileText className="h-10 w-10 text-slate-300 stroke-1 mx-auto" />
                <p className="text-xs text-slate-400 font-semibold mt-2">No volunteer logs matched your search</p>
              </div>
            ) : (
              filteredLogs.map(log => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div key={log.id} className="py-3.5 text-xs">
                    <div 
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="flex items-center justify-between cursor-pointer hover:bg-slate-50/50 p-1.5 rounded-md -mx-1.5 transition"
                    >
                      <div className="space-y-1 pr-4">
                        <h4 className="font-bold text-slate-800 line-clamp-1">{log.eventTitle}</h4>
                        <div className="flex gap-3 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {log.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {log.hours} hours worked
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide border ${
                          log.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : log.status === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                          {log.status}
                        </span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expandable reflection and comments details */}
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 bg-slate-50/70 border border-slate-100 rounded-lg p-3 space-y-2.5"
                      >
                        <div>
                          <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wide flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> Reflection notes
                          </span>
                          <p className="mt-1 text-slate-600 leading-relaxed italic text-[11px]">
                            "{log.reflection}"
                          </p>
                        </div>

                        <div className="flex flex-wrap justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-2">
                          <span>Supervisor: {log.supervisorEmail}</span>
                          <span>Logged: {log.dateLogged}</span>
                        </div>

                        {log.notes && (
                          <div className="bg-white rounded border border-emerald-100 p-2 text-[10px] leading-relaxed text-emerald-950 font-medium">
                            <span className="font-bold text-emerald-800">Supervisor comments:</span> {log.notes}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
