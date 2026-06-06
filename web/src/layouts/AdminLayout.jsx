import Sidebar from "./Sidebar";

export default function AdminLayout({ children, darkMode, onToggleTheme }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Admin Panel
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Products, knowledge, shared quotes and tool-call logs
                </p>
              </div>

              <button
                type="button"
                onClick={onToggleTheme}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {darkMode ? "☀️ Light" : "🌙 Dark"}
              </button>
            </div>
          </header>

          <section className="p-6">{children}</section>
        </main>
      </div>
    </div>
  );
}