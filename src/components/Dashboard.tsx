import React from "react";
import { motion } from "motion/react";
import { 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Trophy, 
  Bell, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Flame,
  Award
} from "lucide-react";
import { UserProfile, ServiceEvent, Badge, Announcement, HoursLog } from "../types";
import { ALL_BADGES } from "../data";

interface DashboardProps {
  user: UserProfile;
  events: ServiceEvent[];
  announcements: Announcement[];
  logs: HoursLog[];
  onTabChange: (tab: string) => void;
  onSelectEvent: (eventId: string) => void;
}

export default function Dashboard({ 
  user, 
  events, 
  announcements, 
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

  // Level Progression Calculation (Level = floor(hours / 15) + 1, Max Level 10)
  const currentHours = totalApprovedHours;
  const level = Math.floor(currentHours / 15) + 1;
  const hoursInCurrentLevel = currentHours % 15;
  const progressPercent = Math.min((hoursInCurrentLevel / 15) * 100, 100);
  const hoursNeededForNext = Math.max(15 - hoursInCurrentLevel, 0);

  // Mock leaderboard of other top volunteers
  const leaderboard = [
    { name: "Sophia Chen", hours: 48, level: 4, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100", isCurrentUser: false },
    { name: "Manal Mer", hours: totalApprovedHours, level: level, avatar: user.avatar, isCurrentUser: true },
    { name: "Alex Johnson", hours: 24, level: 2, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100", isCurrentUser: false },
    { name: "Emily Rod", hours: 18, level: 2, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100", isCurrentUser: false },
    { name: "Carlos Diaz", hours: 15, level: 2, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100", isCurrentUser: false }
  ].sort((a, b) => b.hours - a.hours);

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
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-xs">
              <Sparkles className="h-3 w-3" />
              Community Champion
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Welcome Back, {user.name}!
            </h1>
            <p className="text-emerald-50 text-sm max-w-xl leading-relaxed">
              Every hour you give makes our community a stronger, warmer place. Your current active efforts are building local environmental beauty, supporting young scholars, and helping rescue pets.
            </p>
          </div>
          
          <div className="rounded-xl bg-white/10 p-5 backdrop-blur-md border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs text-emerald-100 font-semibold">
              <span>LEVEL {level} PROGRESS</span>
              <span>{currentHours} / {Math.floor(currentHours / 15 + 1) * 15} hours</span>
            </div>
            
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-emerald-950/40">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
            <p className="text-xs text-emerald-50 text-center">
              💡 Just <strong className="font-semibold text-white">{hoursNeededForNext} more approved hours</strong> to reach Level {level + 1}!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4" id="stats-grid">
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
            id: "stat-commitments",
            label: "Active Commitments", 
            value: upcomingCommitments.length, 
            subtitle: "Registered shifts",
            icon: Calendar, 
            color: "text-amber-600 bg-amber-50 border-amber-100" 
          },
          { 
            id: "stat-rank",
            label: "Community Rank", 
            value: `#${leaderboard.findIndex(l => l.isCurrentUser) + 1}`, 
            subtitle: "Out of 120 volunteers",
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

      <div className="grid gap-8 md:grid-cols-3" id="dashboard-main-content">
        {/* Left Column: Schedule & Badges */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Upcoming Shifts / Schedule */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs" id="upcoming-schedule-section">
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
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs" id="badges-wall-section">
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

        {/* Right Column: Announcements & Leaderboard */}
        <div className="space-y-8">
          
          {/* Announcements Panel */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs" id="announcements-section">
            <h2 className="font-display text-base font-bold text-slate-800 flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-600" /> Announcements
            </h2>
            
            <div className="mt-4 space-y-3.5">
              {announcements.map((ann) => (
                <div 
                  key={ann.id}
                  className={`rounded-lg p-3.5 border text-xs leading-relaxed ${
                    ann.category === "urgent" 
                      ? "bg-red-50/50 border-red-100 text-red-950" 
                      : ann.category === "update"
                      ? "bg-amber-50/50 border-amber-100 text-amber-950"
                      : "bg-slate-50/50 border-slate-100 text-slate-950"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded-sm bg-white border">
                      {ann.category}
                    </span>
                    <span className="text-slate-400 text-[10px]">{ann.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1">{ann.title}</h4>
                  <p className="text-slate-600">{ann.content}</p>
                  <p className="mt-1.5 text-[10px] text-slate-400 text-right">By {ann.sender}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Leaderboard Panel */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs" id="leaderboard-section">
            <h2 className="font-display text-base font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Community Leaderboard
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Top active volunteers this quarter</p>

            <div className="mt-4 divide-y divide-slate-100">
              {leaderboard.map((item, index) => (
                <div 
                  key={item.name}
                  className={`flex items-center justify-between py-3 ${
                    item.isCurrentUser ? "bg-emerald-50/40 rounded-lg px-2 -mx-2 my-1" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 text-center text-xs font-bold ${
                      index === 0 ? "text-amber-500" : index === 1 ? "text-slate-500" : index === 2 ? "text-amber-700" : "text-slate-400"
                    }`}>
                      {index + 1}
                    </span>
                    <img 
                      src={item.avatar} 
                      alt={item.name} 
                      className="h-8 w-8 rounded-full object-cover border border-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        {item.name} 
                        {item.isCurrentUser && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 py-0.1 rounded-sm">You</span>}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">Level {item.level}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1 justify-end">
                      <Flame className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      {item.hours}h
                    </span>
                    <span className="text-[9px] text-slate-400 block">approved</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
