"use client";

import type { Role } from "@prisma/client";
import type { AdminUserListItem } from "@/server/services/adminService";

interface UserRoleManagerProps {
  users: AdminUserListItem[];
  onRoleChange: (userId: string, newRole: Role) => void;
}

const ROLES: Role[] = ["USER", "CURATOR", "ADMIN"];

export function UserRoleManager({
  users,
  onRoleChange,
}: UserRoleManagerProps): React.JSX.Element {
  return (
    <section className="bg-white border-2 border-[#232323] p-6 shadow-[3px_3px_0px_#232323]">
      <h2 className="text-xl font-bold text-[#232323] mb-4">User Roles</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-[#e6e6e6] text-sm text-[#6b6b6b]">
              <th className="py-2 px-3">Email</th>
              <th className="py-2 px-3">Joined</th>
              <th className="py-2 px-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[#e6e6e6] hover:bg-[#f2efea]/40">
                <td className="py-3 px-3 font-medium text-[#232323]">{user.email}</td>
                <td className="py-3 px-3 text-sm text-[#6b6b6b]">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-3">
                  <label htmlFor={`role-select-${user.id}`} className="sr-only">
                    Change role for {user.email}
                  </label>
                  <select
                    id={`role-select-${user.id}`}
                    value={user.role}
                    onChange={(e) => onRoleChange(user.id, e.target.value as Role)}
                    className="border-2 border-[#232323] bg-white px-2 py-1 text-sm font-semibold rounded-none focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
