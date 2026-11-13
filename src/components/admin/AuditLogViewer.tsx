import type { AuditLogItem } from "@/server/services/adminService";

interface AuditLogViewerProps {
  logs: AuditLogItem[];
}

export function AuditLogViewer({ logs }: AuditLogViewerProps): React.JSX.Element {
  if (logs.length === 0) {
    return (
      <section className="bg-white border-2 border-[#232323] p-6 shadow-[3px_3px_0px_#232323]">
        <h2 className="text-xl font-bold text-[#232323] mb-4">Audit Log</h2>
        <p className="text-sm text-[#6b6b6b]">No audit logs found.</p>
      </section>
    );
  }

  return (
    <section className="bg-white border-2 border-[#232323] p-6 shadow-[3px_3px_0px_#232323]">
      <h2 className="text-xl font-bold text-[#232323] mb-4">Audit Log</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-[#e6e6e6] text-sm text-[#6b6b6b]">
              <th className="py-2 px-3">Date (UTC)</th>
              <th className="py-2 px-3">Actor</th>
              <th className="py-2 px-3">Action</th>
              <th className="py-2 px-3">Target</th>
              <th className="py-2 px-3">Change Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-[#e6e6e6] text-sm hover:bg-[#f2efea]/40">
                <td className="py-3 px-3 font-mono text-xs text-[#6b6b6b]">
                  {new Date(log.createdAt).toISOString().replace("T", " ").slice(0, 19)}
                </td>
                <td className="py-3 px-3 font-medium text-[#232323]">
                  {log.actor?.email ?? log.actorId}
                </td>
                <td className="py-3 px-3 font-mono font-semibold text-[#2d5be3]">
                  {log.action}
                </td>
                <td className="py-3 px-3 font-mono text-xs text-[#232323]">
                  {log.targetId}
                </td>
                <td className="py-3 px-3 font-mono text-xs text-[#6b6b6b]">
                  {log.before ? `Before: ${JSON.stringify(log.before)} → ` : ""}
                  {log.after ? `After: ${JSON.stringify(log.after)}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
