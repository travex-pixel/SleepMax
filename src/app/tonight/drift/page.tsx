import type { Metadata } from "next";
import { Drift } from "@/components/drift";

export const metadata: Metadata = { title: "Drift" };

export default function Page() {
  return <Drift />;
}
