export default function StatCard({ title, value, helper, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {value}
          </h3>

          {helper && (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {helper}
            </p>
          )}
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </div>
      </div>
    </div>
  );
}