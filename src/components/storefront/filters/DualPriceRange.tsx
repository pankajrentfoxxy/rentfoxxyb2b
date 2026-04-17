"use client";

import { cn } from "@/lib/utils";
import * as Slider from "@radix-ui/react-slider";
import { useEffect, useState } from "react";

type Props = {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  className?: string;
};

export function DualPriceRange({ min, max, valueMin, valueMax, onChange, className }: Props) {
  const [val, setVal] = useState([valueMin, valueMax]);

  useEffect(() => {
    setVal([valueMin, valueMax]);
  }, [valueMin, valueMax]);

  return (
    <div className={cn("space-y-2 pt-1", className)}>
      <Slider.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        min={min}
        max={max}
        step={Math.max(500, Math.round((max - min) / 200))}
        value={val}
        onValueChange={(v) => {
          const [a, b] = v;
          setVal([a, b]);
          onChange(a, b);
        }}
      >
        <Slider.Track className="relative h-1.5 w-full grow rounded-full bg-border-light">
          <Slider.Range className="absolute h-full rounded-full bg-navy/40" />
        </Slider.Track>
        <Slider.Thumb
          className="block h-4 w-4 rounded-full border-2 border-navy bg-card shadow focus:outline-none focus:ring-2 focus:ring-amber/50"
          aria-label="Minimum price"
        />
        <Slider.Thumb
          className="block h-4 w-4 rounded-full border-2 border-navy bg-card shadow focus:outline-none focus:ring-2 focus:ring-amber/50"
          aria-label="Maximum price"
        />
      </Slider.Root>
      <div className="flex justify-between text-[11px] text-ink-muted">
        <span>₹{val[0].toLocaleString("en-IN")}</span>
        <span>₹{val[1].toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
