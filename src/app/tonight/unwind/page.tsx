import type { Metadata } from "next";
import { UnwindScreen } from "@/components/unwind-screen";

export const metadata: Metadata = { title: "Wind down" };

export default function Page() {
  return <UnwindScreen />;
}
