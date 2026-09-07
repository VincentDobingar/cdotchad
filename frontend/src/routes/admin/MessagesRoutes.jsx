// ✅ src/routes/admin/messagesRoutes.js
import AdminMessages from "@/pages/admin/AdminMessages";
import Messages from "@/pages/Messages";
import Notifications from "@/pages/Notifications";
import { MessagesSquare, Bell } from "lucide-react";

const messagesRoutes = [
  { path: "messages", element: <AdminMessages />, label: "Messages", icon: <MessagesSquare className="w-5 h-5" /> },
  { path: "notifications", element: <Notifications />, label: "Notifications", icon: <Bell className="w-5 h-5" /> },
  { path: "messages-old", element: <Messages /> },
];

export default messagesRoutes;