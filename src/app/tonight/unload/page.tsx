import type { Metadata } from "next";
import { UnloadScreen } from "@/components/unload-screen";

export const metadata: Metadata = { title: "Put it down" };

export default function Page() {
  return <UnloadScreen />;
}
