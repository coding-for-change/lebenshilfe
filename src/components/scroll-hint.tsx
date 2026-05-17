"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type ScrollHintProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Wraps a horizontally-scrollable child. Shows a fading edge + chevron on
 * the right when there is more content offscreen, so users discover they
 * can swipe sideways. The hint hides as soon as the user reaches the end.
 */
export function ScrollHint({ children, className }: ScrollHintProps) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);

  React.useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;
    // The shadcn <Table /> renders an inner <div data-slot="table-container">
    // that is the actual scrollable element. Fall back to the root if we
    // can't find it.
    const scroller =
      root.querySelector<HTMLElement>('[data-slot="table-container"]') ?? root;

    const update = () => {
      const max = scroller.scrollWidth - scroller.clientWidth;
      setCanScrollLeft(scroller.scrollLeft > 4);
      setCanScrollRight(max - scroller.scrollLeft > 4);
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(scroller);

    return () => {
      scroller.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={cn("relative", className)}
    >
      {children}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-card to-transparent transition-opacity duration-200",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-end bg-gradient-to-l from-card to-transparent pr-1 transition-opacity duration-200",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
      >
        <ChevronRight className="size-5 animate-pulse text-muted-foreground" />
      </div>
    </div>
  );
}
