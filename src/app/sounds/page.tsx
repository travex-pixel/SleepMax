import type { Metadata } from "next";
import { Drift } from "@/components/drift";

export const metadata: Metadata = { title: "Sound" };

export default function Page() {
  return <Drift standalone />;
}
