"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { setAtmosphere } from "@/lib/atmosphere";

interface ScreenProps {
  children: ReactNode;
  /** Where the back chevron goes. Omit for none. */
  back?: string;
  backLabel?: string;
  /** Left header slot when there is no back link (the wordmark on home). */
  lead?: ReactNode;
  /** Small text in the centre of the header. Only for screens without a headline. */
  title?: string;
  /** Right-hand header slot. */
  aside?: ReactNode;
  /** Bottom-anchored actions, in thumb reach. Sticky, so they never fall below the fold. */
  footer?: ReactNode;
  /** Centre content vertically (opening and Unwind screens). */
  center?: boolean;
  /**
   * Where the horizon sits. "footer" (default) puts the line at the footer's
   * top edge so the primary action stands on the ground, or near the bottom
   * when there is no footer. "fixed" leaves it to the screen (home).
   */
  horizon?: "footer" | "fixed";
  className?: string;
}

export function Screen({
  children,
  back,
  backLabel = "Back",
  lead,
  title,
  aside,
  footer,
  center,
  horizon = "footer",
  className = "",
}: ScreenProps) {
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (horizon !== "footer") return;
    const el = footerRef.current;
    const update = () => {
      const h = window.innerHeight;
      if (!el) {
        setAtmosphere({ horizon: 0.96 });
        return;
      }
      const top = el.getBoundingClientRect().top;
      setAtmosphere({ horizon: Math.min(0.97, Math.max(0.5, top / h)) });
    };
    // After layout, so the sticky footer has its resting position.
    const raf = window.requestAnimationFrame(update);
    const ro = el ? new ResizeObserver(update) : null;
    if (el) ro?.observe(el);
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [horizon]);

  return (
    <main className={`mx-auto flex w-full max-w-[30rem] flex-1 flex-col ${className}`}>
      <header className="flex h-14 shrink-0 items-center justify-between px-5">
        <div className="flex w-24 items-center">
          {back ? (
            <Link
              href={back}
              aria-label={backLabel}
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-2 hover:text-ink"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          ) : (
            lead
          )}
        </div>
        {title ? <p className="wordmark">{title}</p> : null}
        <div className="flex w-24 items-center justify-end">{aside}</div>
      </header>
      <div className={`flex flex-1 flex-col px-5 ${center ? "justify-center" : ""}`}>{children}</div>
      {footer ? (
        <div ref={footerRef} className="screen-footer sticky bottom-0 shrink-0 px-5 pb-5 pt-8">
          {footer}
        </div>
      ) : (
        <div className="pb-5" />
      )}
    </main>
  );
}
