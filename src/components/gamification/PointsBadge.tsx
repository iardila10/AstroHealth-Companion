
interface PointsBadgeProps {
  points: number;
}

function PointsBadge({ points }: PointsBadgeProps) {

  return (
    <div className="inline-flex items-center gap-3 rounded-lg border border-cyan-500/30 bg-slate-800 px-4 py-3">

      {/* Points Icon */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-6 w-6 text-cyan-400"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3l2.5 5.5L20 9.5l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1L12 3z"
          />
        </svg>
      </div>

      {/* Points Information */}
      <div>
        <p className="text-xs font-semibold tracking-widest text-slate-400">
          MISSION POINTS
        </p>

        <p className="mt-1 text-xl font-bold tabular-nums text-slate-100">
          {points.toLocaleString("en-US")}
          <span className="ml-2 text-xs font-medium text-cyan-400">
            PTS
          </span>
        </p>
      </div>

    </div>
  );
}

export default PointsBadge;
