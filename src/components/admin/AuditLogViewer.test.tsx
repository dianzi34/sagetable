import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuditLogViewer } from "./AuditLogViewer";

describe("AuditLogViewer", () => {
  const mockLogs = [
    {
      id: "log-1",
      action: "ROLE_CHANGE",
      actorId: "admin-1",
      targetId: "user-2",
      before: { role: "USER" },
      after: { role: "CURATOR" },
      createdAt: new Date("2026-11-12T10:00:00Z"),
      actor: {
        email: "superadmin@example.com",
        role: "ADMIN" as const,
      },
    },
  ];

  it("renders audit logs with actor email, action, and details", () => {
    render(<AuditLogViewer logs={mockLogs} />);

    expect(screen.getByText("superadmin@example.com")).toBeInTheDocument();
    expect(screen.getByText("ROLE_CHANGE")).toBeInTheDocument();
    expect(screen.getByText(/user-2/i)).toBeInTheDocument();
  });

  it("renders empty state when there are no logs", () => {
    render(<AuditLogViewer logs={[]} />);

    expect(screen.getByText(/no audit logs found/i)).toBeInTheDocument();
  });
});
