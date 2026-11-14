
interface ReminderToastProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
}

function ReminderToast({
  visible,
  title,
  message,
  onDismiss,
}: ReminderToastProps) {

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] max-w-sm rounded-xl border border-cyan-500/30 bg-slate-800 p-4 shadow-xl"
    >

      {/* Toast Header */}
      <div className="flex items-start justify-between gap-4">

        <div className="flex items-center gap-3">

          {/* Notification Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5 text-cyan-400"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-5-5.9V4a1 1 0 00-2 0v1.1A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 01-6 0"
              />
            </svg>

          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest text-cyan-400">
              MISSION REMINDER
            </p>

            <h3 className="mt-1 font-semibold text-slate-100">
              {title}
            </h3>
          </div>

        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss reminder"
          className="rounded-md p-1 text-slate-400 transition hover:bg-slate-700 hover:text-slate-100"
        >
          <span className="text-xl leading-none">×</span>
        </button>

      </div>

      {/* Reminder Message */}
      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        {message}
      </p>

    </div>
  );
}

export default ReminderToast;
