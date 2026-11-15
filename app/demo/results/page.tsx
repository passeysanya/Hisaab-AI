import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { HisaabResults } from "@/components/results/HisaabResults";

export const metadata: Metadata = {
  title: "Your Hisaab · Hisaab AI demo",
  robots: { index: false },
};

export default function ResultsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-8">
        <HisaabResults />
      </main>
    </>
  );
}
