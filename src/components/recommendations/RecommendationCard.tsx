
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { Recommendation } from '../../types/health';
import { useAstronautStore } from '../../stores/useAstronautStore';

interface Props {
  recommendation: Recommendation;
}

export const RecommendationCard = ({ recommendation }: Props) => {
  const { completedRecommendations, markRecommendationCompleted, addPoints } =
    useAstronautStore();

  const isCompleted = completedRecommendations.includes(recommendation.id);

  const priorityStyles = {
    high: {
      border: 'border-l-[#F43F5E]',
      badge: 'bg-[#F43F5E]/15 text-[#F43F5E]',
      icon: <AlertTriangle size={14} />,
    },
    medium: {
      border: 'border-l-[#F59E0B]',
      badge: 'bg-[#F59E0B]/15 text-[#F59E0B]',
      icon: <Clock size={14} />,
    },
    low: {
      border: 'border-l-[#10B981]',
      badge: 'bg-[#10B981]/15 text-[#10B981]',
      icon: <CheckCircle2 size={14} />,
    },
  };

  const style = priorityStyles[recommendation.priority];

  const handleComplete = () => {
    if (isCompleted) return;
    markRecommendationCompleted(recommendation.id);
    addPoints(10); // Light gamification
  };

  return (
    <div
      className={`bg-[#1E293B] border border-[#334155] border-l-4 ${style.border} rounded-lg p-4 transition-all ${
        isCompleted ? 'opacity-60' : 'hover:border-[#475569]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide ${style.badge}`}
            >
              {style.icon}
              {recommendation.priority}
            </span>
            {recommendation.estimatedTimeMinutes && (
              <span className="text-xs text-[#64748B]">
                ~{recommendation.estimatedTimeMinutes} min
              </span>
            )}
          </div>

          <h3
            className={`text-sm font-medium ${
              isCompleted ? 'line-through text-[#94A3B8]' : 'text-[#F8FAFC]'
            }`}
          >
            {recommendation.title}
          </h3>

          <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
            {recommendation.description}
          </p>
        </div>

        {recommendation.actionable && !isCompleted && (
          <button
            onClick={handleComplete}
            className="shrink-0 px-3 py-1.5 rounded-md bg-[#22D3EE]/10 text-[#22D3EE] text-xs font-medium hover:bg-[#22D3EE]/20 transition-colors"
          >
            Complete
          </button>
        )}

        {isCompleted && (
          <div className="shrink-0 text-[#10B981]">
            <CheckCircle2 size={18} />
          </div>
        )}
      </div>
    </div>
  );
};