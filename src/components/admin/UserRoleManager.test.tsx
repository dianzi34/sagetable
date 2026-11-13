import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UserRoleManager } from "./UserRoleManager";

describe("UserRoleManager", () => {
  const mockUsers = [
    {
      id: "u-1",
      email: "user1@example.com",
      role: "USER" as const,
      createdAt: new Date("2026-11-01T00:00:00Z"),
    },
    {
      id: "u-2",
      email: "curator1@example.com",
      role: "CURATOR" as const,
      createdAt: new Date("2026-11-02T00:00:00Z"),
    },
  ];

  it("renders users with their emails and roles", () => {
    render(<UserRoleManager users={mockUsers} onRoleChange={vi.fn()} />);

    expect(screen.getByText("user1@example.com")).toBeInTheDocument();
    expect(screen.getByText("curator1@example.com")).toBeInTheDocument();
  });

  it("calls onRoleChange when selecting a new role", () => {
    const onRoleChange = vi.fn();
    render(<UserRoleManager users={mockUsers} onRoleChange={onRoleChange} />);

    const selectElements = screen.getAllByRole("combobox");
    expect(selectElements.length).toBeGreaterThanOrEqual(2);

    fireEvent.change(selectElements[0]!, { target: { value: "CURATOR" } });
    expect(onRoleChange).toHaveBeenCalledWith("u-1", "CURATOR");
  });
});
