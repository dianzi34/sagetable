import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDashboardClient } from "./AdminDashboardClient";

describe("AdminDashboardClient", () => {
  const mockUsers = [
    {
      id: "u-1",
      email: "user1@example.com",
      role: "USER" as const,
      createdAt: new Date("2026-11-01T00:00:00Z"),
    },
  ];

  const mockLimits = [
    { role: "USER" as const, dailyRoundtables: 5 },
    { role: "CURATOR" as const, dailyRoundtables: 20 },
    { role: "ADMIN" as const, dailyRoundtables: 100 },
  ];

  const mockLogs = [
    {
      id: "log-1",
      action: "ROLE_CHANGE",
      actorId: "admin-1",
      targetId: "u-1",
      before: { role: "USER" },
      after: { role: "CURATOR" },
      createdAt: new Date("2026-11-12T10:00:00Z"),
      actor: {
        email: "superadmin@example.com",
        role: "ADMIN" as const,
      },
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders users, limits, and logs sections", () => {
    render(
      <AdminDashboardClient
        initialUsers={mockUsers}
        initialLimits={mockLimits}
        initialLogs={mockLogs}
      />,
    );

    expect(screen.getByText("User Roles")).toBeInTheDocument();
    expect(screen.getByText("Daily Roundtable Limits")).toBeInTheDocument();
    expect(screen.getByText("Audit Log")).toBeInTheDocument();
    expect(screen.getByText("user1@example.com")).toBeInTheDocument();
  });

  it("handles successful role change and shows success notification", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/admin/users/u-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { user: { id: "u-1", role: "CURATOR" } } }),
        });
      }
      if (url.includes("/api/admin/audit-logs")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { logs: mockLogs } }),
        });
      }
      return Promise.reject(new Error("unknown URL"));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AdminDashboardClient
        initialUsers={mockUsers}
        initialLimits={mockLimits}
        initialLogs={mockLogs}
      />,
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "CURATOR" } });

    await waitFor(() => {
      expect(screen.getByText(/User role successfully updated to CURATOR/i)).toBeInTheDocument();
    });
  });

  it("handles successful limit update and shows notification", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/admin/limits")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { limit: { role: "USER", dailyRoundtables: 12 } },
            }),
        });
      }
      if (url.includes("/api/admin/audit-logs")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { logs: mockLogs } }),
        });
      }
      return Promise.reject(new Error("unknown URL"));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AdminDashboardClient
        initialUsers={mockUsers}
        initialLimits={mockLimits}
        initialLogs={mockLogs}
      />,
    );

    const input = screen.getByDisplayValue("5");
    fireEvent.change(input, { target: { value: "12" } });

    const saveButtons = screen.getAllByRole("button", { name: /save/i });
    fireEvent.click(saveButtons[0]!);

    await waitFor(() => {
      expect(
        screen.getByText(/Daily limit for USER saved to 12/i),
      ).toBeInTheDocument();
    });
  });
});
