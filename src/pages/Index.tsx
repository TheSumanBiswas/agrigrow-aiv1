import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ScanSection, { DiagnosisResult } from "@/components/ScanSection";
import ResultSection from "@/components/ResultSection";
import HowItWorks from "@/components/HowItWorks";
import AboutSection from "@/components/AboutSection";
import ContactFooter from "@/components/ContactFooter";

const Index = () => {
  const [scanResult, setScanResult] = useState<DiagnosisResult | null>(null);

  const handleScanComplete = (result: DiagnosisResult) => {
    setScanResult(result);
    // Scroll to results
    setTimeout(() => {
      const element = document.querySelector("#results");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <>
      <Helmet>
        <title>AgriScan AI – AI-Powered Plant Disease Detection for Farmers</title>
        <meta
          name="description"
          content="Scan your crop leaves with AI to instantly identify plant diseases, pests, and nutrient deficiencies. Get safe treatment recommendations for a healthier harvest."
        />
        <meta
          name="keywords"
          content="plant disease detection, crop health, agriculture AI, farming technology, plant diagnosis, pest identification"
        />
        <link rel="canonical" href="https://agriscan.ai" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <ScanSection onScanComplete={handleScanComplete} />
          <ResultSection result={scanResult} />
          <HowItWorks />
          <AboutSection />
        </main>
        <ContactFooter />
      </div>
    </>
  );
};

export default Index;
