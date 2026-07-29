import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  User, 
  Phone, 
  Mail, 
  Heart, 
  Tag, 
  Edit2, 
  Check, 
  BookOpen, 
  UserCheck,
  ShieldAlert
} from "lucide-react";
import { UserProfile } from "../types";

interface VolunteerProfileProps {
  user: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

export default function VolunteerProfile({ user, onUpdateProfile }: VolunteerProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [bio, setBio] = useState(user.bio);
  const [emergencyContact, setEmergencyContact] = useState(user.emergencyContact);
  const [skillsText, setSkillsText] = useState(user.skills.join(", "));
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setAvatarPreview(user.avatar);
  }, [user.avatar]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = skillsText
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    onUpdateProfile({
      name,
      phone,
      bio,
      emergencyContact,
      skills,
      avatar: avatarPreview
    });

    setIsEditing(false);
    setSuccessMsg("Profile information updated successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="volunteer-profile-root">
      
      {/* Header and Title */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Your Volunteer Profile</h1>
        <p className="text-xs text-slate-400 font-medium">Manage your volunteer preferences, skills, and emergency contact details</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Card: Summary Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-3xs flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <img
              src={isEditing ? avatarPreview : user.avatar}
              alt={user.name}
              className="h-24 w-24 rounded-full object-cover border-4 border-emerald-50 shadow-md"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
              <UserCheck className="h-2.5 w-2.5 text-white" />
            </span>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-slate-800">{user.name}</h2>
            <span className="inline-block mt-1 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Volunteer
            </span>
          </div>

          <p className="text-xs text-slate-500 italic max-w-xs leading-relaxed">
            "{user.bio || "No biography details shared yet."}"
          </p>

          <div className="w-full border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-500 text-left">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{user.phone || "No phone added"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span className="line-clamp-1">Emergency: {user.emergencyContact || "No contact added"}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Editor Form / Display Details */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-3xs">
          
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
            <h3 className="font-display text-base font-bold text-slate-800 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-emerald-600" /> Account Information
            </h3>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Profile
              </button>
            )}
          </div>

          {successMsg && (
            <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
              <Check className="h-4 w-4 shrink-0" /> {successMsg}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600">Profile Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="w-full rounded-lg border border-slate-200 p-2.5 bg-white text-xs outline-none file:cursor-pointer file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-slate-700 file:rounded-md"
                  />
                  <p className="text-[11px] text-slate-400">Upload a picture to personalize your volunteer profile.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600">Mobile Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600">Short Biography / Introduction</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-emerald-500"
                  placeholder="Share a bit about why you volunteer and what causes you love..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600">Skills & Passions (comma separated)</label>
                  <input
                    type="text"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-emerald-500"
                    placeholder="e.g. Tutoring, Cooking, Driving"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600">Emergency Contact Details</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-emerald-500"
                    placeholder="e.g. Sarah Mer (Mother) - +1 (555) 432-8700"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setName(user.name);
                    setPhone(user.phone);
                    setBio(user.bio);
                    setEmergencyContact(user.emergencyContact);
                    setSkillsText(user.skills.join(", "));
                    setAvatarPreview(user.avatar);
                    setIsEditing(false);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 shadow-2xs"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5 text-xs">
              
              <div className="space-y-2">
                <h4 className="font-bold text-slate-500 uppercase text-[9px] tracking-wider flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> Skills and Domain Expertise
                </h4>
                <div className="flex flex-wrap gap-2">
                  {user.skills.length === 0 ? (
                    <span className="text-slate-400 italic">No skills cataloged yet. Edit profile to add skills.</span>
                  ) : (
                    user.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-1 font-bold"
                      >
                        <Tag className="h-3 w-3 text-emerald-600 shrink-0" />
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-4">
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Account Role</span>
                  <p className="text-slate-700 font-semibold text-sm">Volunteer Participant</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Date Joined Community</span>
                  <p className="text-slate-700 font-semibold text-sm">{user.joinedDate}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-500" /> Security & Safety Protocols
                </span>
                <p className="text-slate-600 leading-relaxed max-w-lg">
                  Your safety and privacy are our top concern. Emergency contact information is strictly shared only with active event coordinators for security assurance during ongoing service operations.
                </p>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
