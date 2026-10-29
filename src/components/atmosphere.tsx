"use client";

import { useEffect } from "react";
import { useAtmosphere, type Ground } from "@/lib/atmosphere";

const groundVar: Record<Ground, string> = {
  home: "var(--color-ground)",
  deep: "var(--color-ground-deep)",
  drift: "var(--color-ground-drift)",
};

const themeColor: Record<Ground, string> = {
  home: "#121523",
  deep: "#0c0e19",
  drift: "#080910",
};

export function Atmosphere() {
  const a = useAtmosphere();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--horizon", String(a.horizon));
    root.style.setProperty("--horizon-alpha", String(a.glow));
    root.style.setProperty("--bg", groundVar[a.ground]);
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = a.veil > 0.3 ? "#000000" : themeColor[a.ground];
  }, [a]);

  return (
    <>
      <div className="horizon" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="veil" aria-hidden="true" style={{ opacity: a.veil }} />
    </>
  );
}
