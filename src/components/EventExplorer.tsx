import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  ArrowLeft, 
  MessageSquare, 
  Star, 
  CheckCircle, 
  Heart,
  Share2,
  AlertCircle
} from "lucide-react";
import { ServiceEvent, EventCategory, CommunityFeedback, UserProfile } from "../types";

interface EventExplorerProps {
  events: ServiceEvent[];
  user: UserProfile;
  feedbacks: CommunityFeedback[];
  onToggleSignUp: (eventId: string) => void;
  onSubmitFeedback: (eventId: string, rating: number, comment: string) => void;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
}

const CATEGORIES: ("All" | EventCategory)[] = [
  "All",
  "Environment",
  "Education",
  "Hunger Relief",
  "Elderly Care",
  "Animal Welfare",
  "Crisis Support",
  "Community Development"
];

export default function EventExplorer({
  events,
  user,
  feedbacks,
  onToggleSignUp,
  onSubmitFeedback,
  selectedEventId,
  setSelectedEventId
}: EventExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | EventCategory>("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("active");
  
  // Feedback form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");

  // Filters
  const filteredEvents = events.filter((event) => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || event.category === selectedCategory;
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && !event.completed) ||
      (statusFilter === "completed" && event.completed);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const eventFeedbacks = feedbacks.filter((f) => f.eventId === selectedEventId);

  const isUserSignedUp = selectedEvent?.signedUpVolunteers.includes(user.email);
  const isFull = selectedEvent ? selectedEvent.signedUpVolunteers.length >= selectedEvent.maxVolunteers : false;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    if (!reviewComment.trim()) {
      setReviewError("Please write a small comment first!");
      return;
    }
    onSubmitFeedback(selectedEventId, reviewRating, reviewComment);
    setReviewComment("");
    setReviewRating(5);
    setReviewError("");
  };

  return (
    <div className="space-y-6" id="event-explorer-root">
      {!selectedEvent ? (
        <>
          {/* Filter Bar & Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-800">Explore Service Events</h1>
              <p className="text-xs text-slate-400">Discover and register for community opportunities</p>
            </div>

            {/* Quick Status Toggles */}
            <div className="inline-flex rounded-lg bg-slate-100 p-1 self-start">
              {[
                { label: "All Events", value: "all" },
                { label: "Active", value: "active" },
                { label: "Completed", value: "completed" }
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value as any)}
                  className={`rounded-md px-3.5 py-1 text-xs font-semibold tracking-wide transition ${
                    statusFilter === tab.value 
                      ? "bg-white text-slate-800 shadow-3xs" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Categories bar */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute top-3.5 left-4 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search events by title, description, tags, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Category buttons list */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition ${
                    selectedCategory === cat 
                      ? "bg-emerald-600 text-white shadow-2xs" 
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 text-center bg-white px-4">
              <Search className="h-12 w-12 text-slate-300 stroke-1" />
              <h3 className="mt-3 text-base font-bold text-slate-700">No events matched your search</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">Try relaxing your search terms or choosing a different category filter above.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event, index) => {
                const userRegistered = event.signedUpVolunteers.includes(user.email);
                const isFullEvent = event.signedUpVolunteers.length >= event.maxVolunteers;
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-3xs transition-all duration-300 hover:shadow-xs hover:border-slate-300"
                  >
                    <div>
                      {/* Image header */}
                      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-slate-800 uppercase tracking-wide shadow-3xs backdrop-blur-xs">
                            {event.category}
                          </span>
                        </div>
                        {event.completed && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wide backdrop-blur-xs">
                              <CheckCircle className="h-3 w-3" /> Completed
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3.5">
                        <h3 className="font-display text-base font-bold text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition">
                          {event.title}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>

                        {/* Location / Date info */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-400 font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="text-slate-600 font-semibold">{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{event.startTime} - {event.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom controls */}
                    <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between">
                      {/* Volunteers indicator */}
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                        <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>
                          {event.signedUpVolunteers.length} / {event.maxVolunteers}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedEventId(event.id)}
                          className="rounded-lg bg-white border border-slate-200 text-slate-600 px-3.5 py-1.5 text-xs font-semibold hover:bg-slate-50 transition"
                        >
                          View Details
                        </button>

                        {!event.completed && (
                          <button
                            onClick={() => onToggleSignUp(event.id)}
                            disabled={!userRegistered && isFullEvent}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold tracking-wide transition ${
                              userRegistered
                                ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                                : isFullEvent
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                            }`}
                          >
                            {userRegistered ? "Leave" : isFullEvent ? "Full" : "Join"}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Detailed Event Overlay View */
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
          id="event-detail-view"
        >
          {/* Header Banner */}
          <div className="relative h-64 md:h-80 w-full bg-slate-900">
            <img
              src={selectedEvent.image}
              alt={selectedEvent.title}
              className="h-full w-full object-cover opacity-85"
              referrerPolicy="no-referrer"
            />
            {/* Top Bar inside image */}
            <div className="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-center text-white">
              <button
                onClick={() => setSelectedEventId(null)}
                className="inline-flex items-center gap-1 text-xs font-bold bg-white/20 hover:bg-white/30 transition px-3 py-1.5 rounded-lg backdrop-blur-xs"
              >
                <ArrowLeft className="h-4 w-4" /> Back to explorer
              </button>
              
              <div className="flex gap-2">
                <span className="rounded-full bg-white/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                  {selectedEvent.category}
                </span>
                {selectedEvent.completed && (
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                    Completed
                  </span>
                )}
              </div>
            </div>

            {/* Title Block inside image bottom */}
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white space-y-1">
              <h2 className="font-display text-xl md:text-3xl font-extrabold tracking-tight">
                {selectedEvent.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-200">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {selectedEvent.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {selectedEvent.startTime} - {selectedEvent.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedEvent.location}
                </span>
              </div>
            </div>
          </div>

          {/* Split Detail Layout */}
          <div className="grid gap-8 p-6 md:grid-cols-3">
            {/* Left Content Column */}
            <div className="md:col-span-2 space-y-6">
              
              <div className="space-y-3">
                <h3 className="font-display text-base font-bold text-slate-800 border-b border-slate-100 pb-2">About this community initiative</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Community Impact block */}
              <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-4 space-y-2">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" /> Planned Community Impact
                </h4>
                <p className="text-sm text-emerald-950 font-medium">
                  {selectedEvent.impactMetric}
                </p>
              </div>

              {/* Registered Volunteers row */}
              <div className="space-y-3">
                <h3 className="font-display text-base font-bold text-slate-800 flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" /> 
                  Registered Community Members ({selectedEvent.signedUpVolunteers.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.signedUpVolunteers.length === 0 ? (
                    <p className="text-xs text-slate-400">No volunteers registered yet. Be the first to join!</p>
                  ) : (
                    selectedEvent.signedUpVolunteers.map((email) => (
                      <span 
                        key={email}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border ${
                          email === user.email 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        {email === user.email ? "You" : email.split("@")[0]}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Interactive Reviews / Feedback Area */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="font-display text-base font-bold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-500" /> Volunteer Experiences & Feedback
                </h3>

                {/* Submit review form */}
                {selectedEvent.completed && isUserSignedUp && (
                  <form onSubmit={handleReviewSubmit} className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-700">Write an honest reflection or review</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Your rating:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="text-amber-400 hover:scale-110 transition shrink-0"
                          >
                            <Star className={`h-4.5 w-4.5 ${reviewRating >= star ? "fill-amber-400" : ""}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Share what you learned, any highlights, or comments about the experience..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2.5 outline-none transition focus:border-emerald-500"
                    />

                    {reviewError && (
                      <div className="flex items-center gap-1 text-[11px] text-red-600 font-medium">
                        <AlertCircle className="h-3 w-3" /> {reviewError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white px-4 py-2 transition"
                    >
                      Post Experience
                    </button>
                  </form>
                )}

                {/* Feedbacks Listing */}
                <div className="space-y-3">
                  {eventFeedbacks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No feedback shares posted for this event yet.</p>
                  ) : (
                    eventFeedbacks.map((f) => (
                      <div key={f.id} className="rounded-lg border border-slate-100 p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <img
                              src={f.userAvatar}
                              alt={f.userName}
                              className="h-6 w-6 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className="font-bold text-slate-700">{f.userName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex text-amber-400">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star 
                                  key={s} 
                                  className={`h-3 w-3 ${f.rating >= s ? "fill-amber-400" : ""}`} 
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold">{f.date}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {f.comment}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Action Side Block */}
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status Dashboard</h4>

                {selectedEvent.completed ? (
                  <div className="rounded-lg bg-slate-200 p-3 text-center text-xs font-semibold text-slate-600">
                    This event is archived and complete
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Capacity Indicator */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                        <span>CAPACITY</span>
                        <span>{selectedEvent.signedUpVolunteers.length} / {selectedEvent.maxVolunteers} Joined</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-emerald-500" 
                          style={{ width: `${Math.min((selectedEvent.signedUpVolunteers.length / selectedEvent.maxVolunteers) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Join / Leave Big Button */}
                    <button
                      onClick={() => onToggleSignUp(selectedEvent.id)}
                      disabled={!isUserSignedUp && isFull}
                      className={`w-full rounded-xl py-3 text-sm font-bold tracking-wide transition shadow-sm ${
                        isUserSignedUp
                          ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100/80"
                          : isFull
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {isUserSignedUp ? "Cancel registration" : isFull ? "Capacity Reached" : "Join this initiative"}
                    </button>
                  </div>
                )}

                <div className="divide-y divide-slate-100 text-xs text-slate-500 pt-2">
                  <div className="flex justify-between py-2.5">
                    <span>Organizer:</span>
                    <span className="font-bold text-slate-700">{selectedEvent.organizerEmail}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span>Work Domain:</span>
                    <span className="font-bold text-emerald-700">{selectedEvent.category}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span>Duration:</span>
                    <span className="font-bold text-slate-700">Approx. 3 hours</span>
                  </div>
                </div>
              </div>

              {/* Guidelines block */}
              <div className="rounded-xl border border-slate-200 p-5 space-y-3 bg-white">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-emerald-600" /> Essential Volunteer Info
                </h4>
                <ul className="list-disc pl-4 text-xs text-slate-500 space-y-2 leading-relaxed">
                  <li>Please arrive exactly 10 minutes early for a quick orientation briefing.</li>
                  <li>Dress in comfortable clothing suitable for working in the event's domain.</li>
                  <li>Log your volunteer hours immediately after completion so supervisors can approve them.</li>
                  <li>Badges will be unlocked automatically as soon as hours are verified.</li>
                </ul>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
