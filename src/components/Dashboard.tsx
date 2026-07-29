import React from "react";
import { motion } from "motion/react";
import { 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Trophy, 
  Sparkles, 
  ArrowRight,
  MapPin,
  Award
} from "lucide-react";
import { UserProfile, ServiceEvent, Badge, HoursLog } from "../types";
import { ALL_BADGES } from "../data";

interface DashboardProps {
  user: UserProfile;
  events: ServiceEvent[];
  logs: HoursLog[];
  onTabChange: (tab: string) => void;
  onSelectEvent: (eventId: string) => void;
}

export default function Dashboard({ 
  user, 
  events, 
  logs, 
  onTabChange,
  onSelectEvent
}: DashboardProps) {
  // Get upcoming events user is signed up for
  const upcomingCommitments = events.filter(
    (e) => !e.completed && e.signedUpVolunteers.includes(user.email)
  );

  // Compute stats
  const totalApprovedHours = logs
    .filter((l) => l.status === "approved")
    .reduce((sum, l) => sum + l.hours, 0);

  const pendingHoursCount = logs
    .filter((l) => l.status === "pending")
    .reduce((sum, l) => sum + l.hours, 0);

  const currentHours = totalApprovedHours;

  return (
    <div className="space-y-8" id="dashboard-container">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white shadow-md md:p-8"
        id="dashboard-welcome-banner"
      >
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-12 translate-x-12">
          <Sparkles className="h-64 w-64" />
        </div>
        
        <div className="relative z-10 grid gap-6 md:grid-cols-3 md:items-center">
          <div className="md:col-span-2 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-xs text-white">
              <Sparkles className="h-3 w-3" />
              Community Champion
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl text-white">
              Welcome Back, {user.name}!
            </h1>
            <p className="text-emerald-100 text-sm max-w-xl leading-relaxed">
              Every hour you give makes our community a stronger, warmer place. Your current active efforts are building local environmental beauty, supporting young scholars, and helping rescue pets.
            </p>
          </div>
          
          <div className="rounded-xl bg-white/10 p-5 backdrop-blur-md border border-white/10 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100">
              <Sparkles className="h-3 w-3" />
              Activity Snapshot
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Your current impact</p>
              <p className="mt-2 text-xs text-slate-200 leading-relaxed">
                You’ve approved <strong>{totalApprovedHours} volunteer hours</strong> and joined <strong>{upcomingCommitments.length}</strong> active commitments toward community growth.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-800/70 p-3 text-[11px] text-slate-200">
              Keep up the momentum—your contributions are helping local initiatives thrive.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3" id="stats-grid">
        {[
          { 
            id: "stat-hours",
            label: "Approved Hours", 
            value: `${totalApprovedHours}h`, 
            subtitle: `${pendingHoursCount}h pending approval`,
            icon: Clock, 
            color: "text-emerald-600 bg-emerald-50 border-emerald-100" 
          },
          { 
            id: "stat-events",
            label: "Completed Events", 
            value: user.completedEventsCount, 
            subtitle: "Lifetime events",
            icon: CheckCircle2, 
            color: "text-blue-600 bg-blue-50 border-blue-100" 
          },
          { 
            id: "stat-badges",
            label: "Badges Earned", 
            value: user.badgeIds.length, 
            subtitle: "Achievements unlocked",
            icon: Trophy, 
            color: "text-rose-600 bg-rose-50 border-rose-100" 
          }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
              id={stat.id}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{stat.label}</span>
                <div className={`rounded-lg p-2 ${stat.color.split(" ")[1]} ${stat.color.split(" ")[0]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-display text-2xl font-bold text-slate-800">{stat.value}</span>
                <p className="mt-1 text-xs text-slate-400 font-medium">{stat.subtitle}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-8 md:grid-cols-2 items-stretch" id="dashboard-main-content">
          
          {/* Upcoming Shifts / Schedule */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs h-full flex flex-col" id="upcoming-schedule-section">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-800">Your Volunteer Schedule</h2>
                <p className="text-xs text-slate-400">Events you are currently registered to attend</p>
              </div>
              <button 
                onClick={() => onTabChange("events")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
                id="btn-discover-more-events"
              >
                Discover Events <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {upcomingCommitments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-10 px-4 text-center">
                  <Calendar className="h-10 w-10 text-slate-300 stroke-1" />
                  <p className="mt-2 text-sm font-medium text-slate-600">No upcoming commitments scheduled</p>
                  <p className="text-xs text-slate-400 mt-1">Check out our event explorer to sign up for community events!</p>
                  <button 
                    onClick={() => onTabChange("events")}
                    className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                  >
                    Browse Local Events
                  </button>
                </div>
              ) : (
                upcomingCommitments.map((event) => (
                  <div 
                    key={event.id}
                    className="group relative flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-emerald-200 hover:bg-white md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                        <img 
                          src={event.image} 
                          alt={event.title} 
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          {event.category}
                        </span>
                        <h3 className="font-semibold text-sm text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {event.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            {event.startTime} - {event.endTime}
                          </span>
                          <span className="flex items-center gap-1 line-clamp-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => onSelectEvent(event.id)}
                      className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-emerald-600 hover:text-emerald-700 transition group-hover:shadow-xs self-start md:self-center"
                    >
                      Details
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Badges Accomplishment Wall */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs h-full flex flex-col" id="badges-wall-section">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-800">Your Badge Cabinet</h2>
              <p className="text-xs text-slate-400">Unlock volunteer achievements by completing goals</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {ALL_BADGES.map((badge) => {
                const isUnlocked = user.badgeIds.includes(badge.id);
                return (
                  <div 
                    key={badge.id}
                    className={`relative rounded-xl border p-4 flex flex-col items-center text-center transition ${
                      isUnlocked 
                        ? `${badge.color} shadow-xs font-medium` 
                        : "border-slate-100 bg-slate-50/30 opacity-55 text-slate-400"
                    }`}
                  >
                    <div className={`rounded-full p-2.5 ${isUnlocked ? "bg-white/90 shadow-2xs" : "bg-slate-100"}`}>
                      <Award className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 text-xs font-bold tracking-tight text-slate-800 line-clamp-1">
                      {badge.name}
                    </h3>
                    <p className="mt-1 text-[10px] text-slate-500 leading-normal line-clamp-2">
                      {badge.description}
                    </p>
                    {isUnlocked && (
                      <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
      </div>
    </div>
  );
}
