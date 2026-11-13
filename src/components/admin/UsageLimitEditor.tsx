"use client";

import { useState } from "react";
import type { Role } from "@prisma/client";
import type { UsageLimitItem } from "@/server/services/adminService";

interface UsageLimitEditorProps {
  limits: UsageLimitItem[];
  onSaveLimit: (role: Role, dailyRoundtables: number) => void;
}

export function UsageLimitEditor({
  limits,
  onSaveLimit,
}: UsageLimitEditorProps): React.JSX.Element {
  const [currentValues, setCurrentValues] = useState<Record<Role, number>>(() => {
    const initial: Partial<Record<Role, number>> = {};
    for (const item of limits) {
      initial[item.role] = item.dailyRoundtables;
    }
    return initial as Record<Role, number>;
  });

  const handleChange = (role: Role, value: string): void => {
    const parsed = parseInt(value, 10);
    setCurrentValues((prev) => ({
      ...prev,
      [role]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  };

  return (
    <section className="bg-white border-2 border-[#232323] p-6 shadow-[3px_3px_0px_#232323]">
      <h2 className="text-xl font-bold text-[#232323] mb-4">Daily Roundtable Limits</h2>
      <p className="text-sm text-[#6b6b6b] mb-4">
        Set the maximum number of roundtables a user can initiate per UTC day.
      </p>
      <div className="space-y-4">
        {limits.map((item) => (
          <div
            key={item.role}
            className="flex items-center justify-between border-b border-[#e6e6e6] pb-3"
          >
            <div>
              <span className="font-bold text-[#232323] text-base">{item.role}</span>
              <p className="text-xs text-[#6b6b6b]">Daily limit</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor={`limit-input-${item.role}`} className="sr-only">
                Daily limit for {item.role}
              </label>
              <input
                id={`limit-input-${item.role}`}
                type="number"
                min="0"
                value={currentValues[item.role] ?? item.dailyRoundtables}
                onChange={(e) => handleChange(item.role, e.target.value)}
                className="w-24 border-2 border-[#232323] px-2 py-1 text-right font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]"
              />
              <button
                type="button"
                onClick={() =>
                  onSaveLimit(
                    item.role,
                    currentValues[item.role] ?? item.dailyRoundtables,
                  )
                }
                className="bg-[#2d5be3] text-white px-3 py-1 text-sm font-semibold border-2 border-[#232323] shadow-[2px_2px_0px_#232323] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#232323] transition-all"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
