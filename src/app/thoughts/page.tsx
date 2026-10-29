import type { Metadata } from "next";
import { ThoughtsScreen } from "@/components/thoughts-screen";

export const metadata: Metadata = { title: "Parked" };

export default function Page() {
  return <ThoughtsScreen />;
}
