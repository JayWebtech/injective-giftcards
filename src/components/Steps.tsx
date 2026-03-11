"use client";

import clsx from "clsx";

interface StepsProps {
  current: number;
  steps: string[];
}

export default function Steps({ current, steps }: StepsProps) {
  return (
    <div className="mb-8 flex items-center gap-2">
      {steps.map((label, index) => {
        const i = index;
        const stepNumber = i + 1;
        const isActive = stepNumber === current;
        const isCompleted = stepNumber < current;

        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={clsx(
                "flex h-[30px] w-[30px] items-center justify-center rounded-full text-[12px] font-mono font-bold transition-all",
                isCompleted &&
                  "bg-orange-500 text-white border-0",
                isActive && !isCompleted &&
                  "bg-[#E63946] text-white border-2 border-[#E63946]",
                !isActive && !isCompleted &&
                  "bg-white/10 text-white/30 border-2 border-transparent",
              )}
            >
              {isCompleted ? "✓" : stepNumber}
            </div>
            <span
              className={clsx(
                "text-[13px]",
                isActive ? "font-semibold text-white" : "font-normal text-white/40",
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className="h-px w-5 bg-white/10" />
            )}
          </div>
        );
      })}
    </div>
  );
}
