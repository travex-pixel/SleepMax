"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

interface ScreenProps {
  children: ReactNode;
  /** Where the back chevron goes. Omit for none. */
  back?: string;
  backLabel?: string;
  /** Small text in the centre of the header. */
  title?: string;
  /** Right-hand header slot. */
  aside?: ReactNode;
  /** Bottom-anchored actions, in thumb reach. */
  footer?: ReactNode;
  /** Centre content vertically (opening and Unwind screens). */
  center?: boolean;
  className?: string;
}

export function Screen({ children, back, backLabel = "Back", title, aside, footer, center, className = "" }: ScreenProps) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`mx-auto flex w-full max-w-[30rem] flex-1 flex-col px-5 ${className}`}
    >
      <header className="flex h-14 shrink-0 items-center justify-between">
        <div className="flex w-20 items-center">
          {back ? (
            <Link
              href={back}
              aria-label={backLabel}
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-2 hover:text-ink"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
        {title ? <p className="wordmark">{title}</p> : null}
        <div className="flex w-20 items-center justify-end">{aside}</div>
      </header>
      <div className={`flex flex-1 flex-col ${center ? "justify-center" : ""}`}>{children}</div>
      {footer ? <div className="shrink-0 pb-5 pt-6">{footer}</div> : <div className="pb-5" />}
    </motion.main>
  );
}
