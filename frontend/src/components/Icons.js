import React from 'react';
import {
  Crown,
  LayoutDashboard,
  Users,
  Film,
  Key,
  LogOut,
  Download,
  Eye,
  DollarSign,
  Flame,
  Award,
  Pencil,
  Trash2,
  RefreshCw,
  Globe,
  Calendar,
  Clock,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sun,
  Moon,
  Search
} from 'lucide-react';

// 📸 Logo / PNG Image (without background)
export const LogoIcon = ({ size = 20, style = {} }) => (
  <img src="/Logo.png" alt="Amplify Logo" width={size} height={size} style={{ objectFit: 'contain', ...style }} />
);

// 👑 Crown / Shield (Admin Panel)
export const ShieldIcon = ({ size = 17, style = {} }) => (
  <Crown size={size} style={style} />
);

// 📊 Dashboard (Bar Chart)
export const DashboardIcon = ({ size = 17, style = {} }) => (
  <LayoutDashboard size={size} style={style} />
);

// 👥 Clients / Users
export const ClientsIcon = ({ size = 17, style = {} }) => (
  <Users size={size} style={style} />
);

// 🎬 Reels (Film/Video Camera)
export const ReelsIcon = ({ size = 17, style = {} }) => (
  <Film size={size} style={style} />
);

// 🔑 Client Users (Key)
export const KeyIcon = ({ size = 17, style = {} }) => (
  <Key size={size} style={style} />
);

// 🚪 Logout (Log Out / Exit)
export const LogOutIcon = ({ size = 17, style = {} }) => (
  <LogOut size={size} style={style} />
);

// ⬇️ Export CSV (Download)
export const DownloadIcon = ({ size = 14, style = {} }) => (
  <Download size={size} style={style} />
);

// 👁️ Total Views (Eye)
export const EyeIcon = ({ size = 17, style = {} }) => (
  <Eye size={size} style={style} />
);

// 💰 Earnings / Dollar (Earnings)
export const EarningsIcon = ({ size = 17, style = {} }) => (
  <DollarSign size={size} style={style} />
);

// 🔥 Flame / Hot Milestone
export const FlameIcon = ({ size = 16, style = {} }) => (
  <Flame size={size} style={{ color: '#ff4500', ...style }} />
);

// 🎉 Award / Crossed Milestone
export const AwardIcon = ({ size = 16, style = {} }) => (
  <Award size={size} style={{ color: '#f59e0b', ...style }} />
);

// ✏️ Edit
export const EditIcon = ({ size = 14, style = {} }) => (
  <Pencil size={size} style={style} />
);

// 🗑️ Delete (Trash)
export const DeleteIcon = ({ size = 14, style = {} }) => (
  <Trash2 size={size} style={style} />
);

// 🔄 Sync / Refresh
export const SyncIcon = ({ size = 14, style = {} }) => (
  <RefreshCw size={size} style={style} />
);

// 🌐 Globe (International Format)
export const GlobeIcon = ({ size = 14, style = {} }) => (
  <Globe size={size} style={style} />
);

// 📅 Calendar
export const CalendarIcon = ({ size = 16, style = {} }) => (
  <Calendar size={size} style={style} />
);

// ⏳ Clock / Pending
export const ClockIcon = ({ size = 16, style = {} }) => (
  <Clock size={size} style={style} />
);

// 🚨 Siren / Alert
export const AlertSirenIcon = ({ size = 16, style = {} }) => (
  <AlertOctagon size={size} style={style} />
);

// ⚠️ Warning
export const WarningIcon = ({ size = 16, style = {} }) => (
  <AlertTriangle size={size} style={style} />
);

// ✅ Check / Success
export const CheckCircleIcon = ({ size = 16, style = {} }) => (
  <CheckCircle size={size} style={style} />
);

// ❌ X / Error
export const XCircleIcon = ({ size = 16, style = {} }) => (
  <XCircle size={size} style={style} />
);

// ☀️ Sun (Light Mode)
export const SunIcon = ({ size = 16, style = {} }) => (
  <Sun size={size} style={style} />
);

// 🌙 Moon (Dark Mode)
export const MoonIcon = ({ size = 16, style = {} }) => (
  <Moon size={size} style={style} />
);

// 🔍 Search
export const SearchIcon = ({ size = 14, style = {} }) => (
  <Search size={size} style={style} />
);
