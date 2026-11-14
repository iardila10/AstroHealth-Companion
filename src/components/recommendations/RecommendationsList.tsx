
import { useHealthStore } from '../../stores/useHealthStore';
import { RecommendationCard } from './RecommendationCard';
import { ListChecks } from 'lucide-react';

export const RecommendationsList = () => {
  const recommendations = useHealthStore((s) => s.recommendations);

  // Sort by priority: high → medium → low
  const sorted = [...recommendations].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  if (sorted.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-8 text-center">
        <ListChecks size={32} className="mx-auto text-[#64748B] mb-3" />
        <p className="text-sm text-[#94A3B8]">No recommendations at this time</p>
        <p className="text-xs text-[#64748B] mt-1">
          All indicators are within normal ranges
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-[#F8FAFC] uppercase tracking-wider">
          Recommendations
        </h2>
        <span className="text-xs text-[#64748B] tabular-nums">
          {sorted.length} active
        </span>
      </div>

      {sorted.map((rec) => (
        <RecommendationCard key={rec.id} recommendation={rec} />
      ))}
    </div>
  );
};