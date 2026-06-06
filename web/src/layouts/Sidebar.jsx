import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: "▣" },
  { to: "/products", label: "Products", icon: "◼" },
  { to: "/knowledge", label: "Knowledge", icon: "▤" },
  { to: "/quotes", label: "Quotes", icon: "▥" },
  { to: "/sessions", label: "Tool Logs", icon: "⚙" },
];

export default function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-200 bg-white px-5 py-6 dark:border-slate-800 dark:bg-slate-950 lg:block">
      <div className="mb-8 rounded-2xl bg-blue-900 p-5 text-white shadow-lg">
        <h1 className="text-2xl font-black tracking-tight">The Blue Red</h1>
        <p className="mt-1 text-sm text-blue-100">Admin Dashboard</p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                isActive
                  ? "bg-blue-900 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`
            }
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {link.icon}
            </span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}