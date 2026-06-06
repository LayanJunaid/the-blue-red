import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import { getSessionLogs, getSessions } from "../services/sessionService";
import { formatDateTime } from "../utils/date";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    getSessions().then(setSessions);
  }, []);

  const openLogs = async (sessionId) => {
    setLogs(await getSessionLogs(sessionId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Tool Call Logs</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Trace tool-call execution, success state and quote deltas.
        </p>
      </div>

      <DataTable
        title="Chat Sessions"
        description="Select a session to inspect logs."
        rows={sessions}
        emptyText="No sessions yet"
        columns={[
          {
            key: "session_id",
            label: "Session",
            render: (session) => (
              <button
                onClick={() => openLogs(session.session_id)}
                className="font-black text-blue-600 hover:underline"
              >
                {session.session_id}
              </button>
            ),
          },
          {
            key: "created_at",
            label: "Created At",
            render: (session) => formatDateTime(session.created_at),
          },
        ]}
      />

      {logs.length > 0 && (
        <DataTable
          title="Selected Session Logs"
          description="Tool-call sequence generated during streaming."
          rows={logs}
          columns={[
            { key: "sequence", label: "Seq" },
            {
              key: "tool_name",
              label: "Tool",
              render: (log) => (
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {log.tool_name}
                </span>
              ),
            },
            { key: "input_summary", label: "Input" },
            {
              key: "success",
              label: "Success",
              render: (log) => (log.success ? "✅" : "❌"),
            },
            {
              key: "quote_delta",
              label: "Quote Delta",
              render: (log) => (
                <code className="block max-w-xs overflow-hidden text-ellipsis rounded-xl bg-slate-100 px-3 py-2 text-xs dark:bg-slate-800">
                  {log.quote_delta ? JSON.stringify(log.quote_delta) : "-"}
                </code>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}