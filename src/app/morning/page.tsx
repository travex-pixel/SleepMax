import type { Metadata } from "next";
import { MorningScreen } from "@/components/morning-screen";

export const metadata: Metadata = { title: "Morning" };

export default function Page() {
  return <MorningScreen />;
}
