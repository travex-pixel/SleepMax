"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "lg" | "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 select-none rounded-[var(--radius-control)] font-medium transition-[background-color,color,border-color,opacity,transform] duration-200 ease-[var(--ease-settle)] active:scale-[0.985] disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-lamp text-lamp-ink hover:bg-[color-mix(in_oklch,var(--color-lamp)_92%,white)]",
  secondary: "border border-line-strong text-ink hover:border-ink-3 hover:bg-ground-raise/60",
  ghost: "text-ink-2 hover:text-ink hover:bg-ground-raise/50",
  danger: "text-danger hover:bg-[color-mix(in_oklch,var(--color-danger)_12%,transparent)]",
};

const sizes: Record<Size, string> = {
  lg: "h-14 px-6 text-[1.0625rem] w-full",
  md: "h-11 px-4 text-[0.9375rem]",
  sm: "h-9 px-3 text-[0.875rem]",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "secondary", size = "md", className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function LinkButton({ variant = "secondary", size = "md", className = "", ...rest }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
