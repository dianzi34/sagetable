"use client";

import { useState } from "react";
import type { Role } from "@prisma/client";
import type {
  AdminUserListItem,
  AuditLogItem,
  UsageLimitItem,
} from "@/server/services/adminService";
import { AuditLogViewer } from "./AuditLogViewer";
import { UsageLimitEditor } from "./UsageLimitEditor";
import { UserRoleManager } from "./UserRoleManager";

interface AdminDashboardClientProps {
  initialUsers: AdminUserListItem[];
  initialLimits: UsageLimitItem[];
  initialLogs: AuditLogItem[];
}

export function AdminDashboardClient({
  initialUsers,
  initialLimits,
  initialLogs,
}: AdminDashboardClientProps): React.JSX.Element {
  const [users, setUsers] = useState<AdminUserListItem[]>(initialUsers);
  const [limits, setLimits] = useState<UsageLimitItem[]>(initialLimits);
  const [logs, setLogs] = useState<AuditLogItem[]>(initialLogs);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const refreshLogs = async (): Promise<void> => {
    try {
      const res = await fetch("/api/admin/audit-logs");
      if (res.ok) {
        const data = await res.json();
        if (data.data?.logs) {
          setLogs(data.data.logs);
        }
      }
    } catch {
      // Ignore background log refresh failure
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role): Promise<void> => {
    try {
      setNotification(null);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setNotification({
          type: "error",
          message: errorData.error?.message ?? "Failed to update role",
        });
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      setNotification({
        type: "success",
        message: `User role successfully updated to ${newRole}`,
      });
      await refreshLogs();
    } catch {
      setNotification({
        type: "error",
        message: "An unexpected error occurred while updating the role",
      });
    }
  };

  const handleSaveLimit = async (
    role: Role,
    dailyRoundtables: number,
  ): Promise<void> => {
    try {
      setNotification(null);
      const res = await fetch("/api/admin/limits", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, dailyRoundtables }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setNotification({
          type: "error",
          message: errorData.error?.message ?? "Failed to save usage limit",
        });
        return;
      }

      setLimits((prev) =>
        prev.map((l) =>
          l.role === role ? { ...l, dailyRoundtables } : l,
        ),
      );
      setNotification({
        type: "success",
        message: `Daily limit for ${role} saved to ${dailyRoundtables}`,
      });
      await refreshLogs();
    } catch {
      setNotification({
        type: "error",
        message: "An unexpected error occurred while saving the limit",
      });
    }
  };

  return (
    <div className="space-y-8">
      {notification && (
        <div
          role={notification.type === "error" ? "alert" : "status"}
          className={`p-4 border-2 border-[#232323] shadow-[2px_2px_0px_#232323] ${
            notification.type === "error"
              ? "bg-red-50 text-red-800"
              : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <UserRoleManager users={users} onRoleChange={handleRoleChange} />
        <UsageLimitEditor limits={limits} onSaveLimit={handleSaveLimit} />
      </div>

      <AuditLogViewer logs={logs} />
    </div>
  );
}
