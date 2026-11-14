import { AiExtractionDemo } from "@/components/landing/AiExtractionDemo";
import { FlagExamples } from "@/components/landing/FlagExamples";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <AiExtractionDemo />
        <FlagExamples />
      </main>
      <Footer />
    </>
  );
}
