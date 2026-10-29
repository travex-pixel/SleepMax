import type { Metadata } from "next";
import { ChooseScreen } from "@/components/choose-screen";

export const metadata: Metadata = { title: "Tonight" };

export default function Page() {
  return <ChooseScreen />;
}
