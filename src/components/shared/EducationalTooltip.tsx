
import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface EducationalTooltipProps {
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const EducationalTooltip = ({
  title,
  content,
  position = 'top',
  className = '',
}: EducationalTooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-1 rounded-md text-[#64748B] hover:text-[#22D3EE] hover:bg-[#22D3EE]/10 transition-colors focus:outline-none"
        aria-label="More information"
      >
        <Info size={14} />
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-50 w-64 p-3 rounded-lg
            bg-[#1E293B] border border-[#334155]
            shadow-xl shadow-black/40
            ${positionClasses[position]}
          `}
        >
          <div className="text-xs font-semibold text-[#F8FAFC] mb-1">
            {title}
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            {content}
          </p>

          {/* Small arrow */}
          <div
            className={`
              absolute w-2 h-2 bg-[#1E293B] border-[#334155] rotate-45
              ${
                position === 'top'
                  ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b'
                  : position === 'bottom'
                  ? 'top-[-5px] left-1/2 -translate-x-1/2 border-l border-t'
                  : position === 'left'
                  ? 'right-[-5px] top-1/2 -translate-y-1/2 border-r border-t'
                  : 'left-[-5px] top-1/2 -translate-y-1/2 border-l border-b'
              }
            `}
          />
        </div>
      )}
    </div>
  );
};