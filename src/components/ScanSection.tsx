import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Loader2, ImageIcon, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface ScanSectionProps {
  onScanComplete: (result: DiagnosisResult) => void;
}

export interface DiagnosisResult {
  problemName: string;
  confidence: number;
  cause: string;
  organicTreatment: string;
  chemicalTreatment: string;
  preventionTips: string[];
  severity: "low" | "medium" | "high";
}

const ScanSection = ({ onScanComplete }: ScanSectionProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processImage(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG or PNG image.",
        variant: "destructive",
      });
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImage(null);
  };

  const analyzeImage = async () => {
    if (!image) return;

    setIsAnalyzing(true);

    // Simulate AI analysis with realistic delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Mock result - in production, this would call the actual AI API
    const mockResult: DiagnosisResult = {
      problemName: "Early Blight (Alternaria solani)",
      confidence: 94,
      cause: "Fungal infection caused by warm, humid conditions and poor air circulation. Often spreads through contaminated soil or infected plant debris.",
      organicTreatment: "Apply neem oil spray (2-3 tablespoons per gallon of water) every 7-10 days. Remove and destroy infected leaves immediately. Mulch around plants to prevent soil splash.",
      chemicalTreatment: "Use chlorothalonil or mancozeb-based fungicide as per label instructions. Apply preventatively during humid conditions.",
      preventionTips: [
        "Rotate crops every 2-3 years",
        "Water at the base of plants, avoid wetting leaves",
        "Ensure proper spacing for air circulation",
        "Remove plant debris at end of season",
        "Use disease-resistant varieties when available",
      ],
      severity: "medium",
    };

    setIsAnalyzing(false);
    onScanComplete(mockResult);
    
    toast({
      title: "Analysis Complete!",
      description: "We've identified the issue and prepared treatment recommendations.",
    });
  };

  return (
    <section id="scan" className="py-20 md:py-32 bg-scan-gradient relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Scan Your <span className="text-gradient-primary">Plant</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload or capture a photo of your plant leaf. Our AI will analyze it
            and provide instant diagnosis.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div
            className={`nature-card p-8 transition-all duration-300 ${
              isDragging ? "ring-2 ring-primary scale-[1.02]" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <AnimatePresence mode="wait">
              {!image ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="relative mb-6">
                    <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-primary" />
                    </div>
                    <motion.div
                      className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-primary/30"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>

                  <h3 className="font-heading font-semibold text-xl text-foreground mb-2">
                    Drop your plant image here
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    or click to browse • Supports JPG, PNG
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                      <Button variant="nature" size="lg" asChild>
                        <span>
                          <Upload className="w-5 h-5" />
                          Upload Image
                        </span>
                      </Button>
                    </label>
                    <Button variant="outline" size="lg">
                      <Camera className="w-5 h-5" />
                      Take Photo
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center"
                >
                  <div className="relative inline-block mb-6">
                    <img
                      src={image}
                      alt="Plant preview"
                      className="max-w-full max-h-80 rounded-xl shadow-lg"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Scan Animation Overlay */}
                    {isAnalyzing && (
                      <motion.div
                        className="absolute inset-0 rounded-xl overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="absolute inset-0 bg-primary/10" />
                        <motion.div
                          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
                          animate={{ top: ["0%", "100%", "0%"] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-background/90 backdrop-blur-sm rounded-xl px-6 py-4 flex items-center gap-3">
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            <span className="font-medium text-foreground">Analyzing plant...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                      variant="scan"
                      size="lg"
                      onClick={analyzeImage}
                      disabled={isAnalyzing}
                      className="min-w-[200px]"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Analyze Plant
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={clearImage}
                      disabled={isAnalyzing}
                    >
                      Choose Different Image
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ScanSection;
