import React from "react";
import AttendifyLogo from "./AttendifyLogo.jsx";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Award,
  Coins,
  History,
  UserCheck,
  UserPlus,
  PlusCircle,
  BarChart3,
  Settings,
  ShieldCheck,
  Sliders,
  DollarSign,
  FileSpreadsheet,
  Flame,
  Sparkles,
  MessageSquare,
  Users,
  BookOpen,
} from "lucide-react";

export default function Sidebar({ session, activeTab, setActiveTab }) {
  const role = session?.role || "student";

  // Navigation Items with formal college hierarchy & high-energy icons
  const navItemsByRole = {
    admin: [
      { id: "overview", label: "Admin Dashboard", emoji: "👑", icon: LayoutDashboard },
      { id: "students", label: "Manage Students", emoji: "🎓", icon: Users },
      { id: "teachers", label: "Manage Faculty", emoji: "👩‍🏫", icon: UserCheck },
      { id: "subjects", label: "Manage Subjects", emoji: "📚", icon: BookOpen },
      { id: "reports", label: "Attendance Overview", emoji: "📑", icon: FileSpreadsheet },
      { id: "rules", label: "Reward Management", emoji: "🪙", icon: Sliders },
      { id: "history", label: "Blockchain Records", emoji: "⛓️", icon: History },
      { id: "settings", label: "Settings", emoji: "⚙️", icon: Settings },
    ],
    teacher: [
      { id: "overview", label: "Faculty Hub", emoji: "👨‍🏫", icon: LayoutDashboard },
      { id: "registerStudent", label: "Enroll Student", emoji: "📝", icon: UserPlus },
      { id: "createSession", label: "Create Session", emoji: "⏱️", icon: PlusCircle },
      { id: "markAttendance", label: "Mark Attendance", emoji: "✅", icon: CalendarCheck },
      { id: "reports", label: "Attendance Matrix", emoji: "📈", icon: BarChart3 },
      { id: "messages", label: "Student Helpdesk & Queries", emoji: "💬", icon: MessageSquare },
      { id: "history", label: "Blockchain History", emoji: "⛓️", icon: History },
      { id: "profile", label: "Faculty Profile", emoji: "👨‍💼", icon: UserCheck },
      { id: "settings", label: "Settings", emoji: "⚙️", icon: Settings },
    ],
    student: [
      { id: "overview", label: "Overview", emoji: "📊", icon: LayoutDashboard },
      { id: "attendance", label: "My Attendance", emoji: "🎒", icon: CalendarCheck },
      { id: "calendar", label: "Class Calendar", emoji: "📅", icon: CalendarDays },
      { id: "eligibility", label: "Reward Eligibility", emoji: "🎯", icon: Award },
      { id: "claim", label: "Claim Rewards", emoji: "🪙", icon: Coins },
      { id: "feedback", label: "Teacher Helpdesk & Feedback", emoji: "💬", icon: MessageSquare },
      { id: "history", label: "Blockchain History", emoji: "⛓️", icon: History },
      { id: "profile", label: "Student Profile", emoji: "🎓", icon: UserCheck },
      { id: "settings", label: "Settings", emoji: "⚙️", icon: Settings },
    ],
  };

  const navItems = navItemsByRole[role] || navItemsByRole.student;

  return (
    <aside className="sidebar">
      {/* 3D Brand Logo */}
      <div className="sidebar-logo">
        <AttendifyLogo size={38} />
      </div>

      {/* Student Gamification Mini-Card */}
      {role === "student" && (
        <div style={{ margin: "1rem 0 0", padding: "0.75rem 0.9rem", background: "var(--primary-light)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="streak-flame">🔥</span>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)" }}>5-DAY STREAK</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Level 3 Scholar 🚀</div>
            </div>
          </div>
          <span style={{ fontSize: "0.72rem", background: "var(--emerald-light)", color: "var(--emerald)", padding: "0.15rem 0.45rem", borderRadius: "99px", fontWeight: 800 }}>
            +10% XP
          </span>
        </div>
      )}

      {/* Navigation Links with Emojis */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="sidebar-link-emoji">{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Status Profile */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {role === "admin" ? "👑" : role === "teacher" ? "👨‍🏫" : "🎒"}
        </div>
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontWeight: 800, fontSize: "0.88rem", textTransform: "capitalize" }}>
            {session?.title || `${session?.role} Account`}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {session?.address ? `${session.address.slice(0, 6)}…${session.address.slice(-4)}` : ""}
          </div>
        </div>
      </div>
    </aside>
  );
}
