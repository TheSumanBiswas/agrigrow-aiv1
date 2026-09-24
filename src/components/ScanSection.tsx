import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Loader2, ImageIcon, Sparkles, CameraOff } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fileToCompressedDataUrl } from "@/lib/image/resizeImage";
import { useLanguage } from "@/i18n/LanguageProvider";

interface ScanSectionProps {
  onScanComplete: (result: DiagnosisResult) => void;
}

export interface DiagnosisResult {
  problemName: string;
  problemNameLocal?: string;
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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const { t, aiLanguageName } = useLanguage();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, []);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  const openCamera = async () => {
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t("scan.noSupportErr"));
      toast({
        title: t("scan.noSupportTitle"),
        description: t("scan.noSupportDesc"),
        variant: "destructive",
      });
      return;
    }

    setIsCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("[AgriScan] Camera access failed:", err);
      setIsCameraOpen(false);
      const denied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "SecurityError");
      toast({
        title: denied ? t("scan.deniedTitle") : t("scan.unavailableTitle"),
        description: denied ? t("scan.deniedDesc") : t("scan.unavailableDesc"),
        variant: "destructive",
      });
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopCamera();

    // Run the captured frame through the same compression pipeline
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
    processImage(file);
  };

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
        title: t("scan.invalidTitle"),
        description: t("scan.invalidDesc"),
        variant: "destructive",
      });
    }
  }, [t]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = async (file: File) => {
    try {
      // Reduce payload size to prevent browser/network failures when invoking the backend function.
      const compressed = await fileToCompressedDataUrl(file, {
        maxSize: 1280,
        mimeType: "image/jpeg",
        quality: 0.82,
      });
      setImage(compressed);
    } catch (e) {
      console.error("Image processing failed:", e);
      toast({
        title: t("scan.processFailTitle"),
        description: t("scan.processFailDesc"),
        variant: "destructive",
      });
    }
  };

  const clearImage = () => {
    setImage(null);
  };

  const analyzeImage = async () => {
    if (!image) return;

    setIsAnalyzing(true);

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AgriScan] Attempt ${attempt}/${maxRetries} - Sending image to analyze-plant function...`);

        const { data, error } = await supabase.functions.invoke('analyze-plant', {
          body: { imageBase64: image, language: aiLanguageName }
        });

        if (error) {
          console.error(`[AgriScan] Attempt ${attempt} - Function error:`, error);
          if (error.message?.includes('Failed to send') || error.message?.includes('fetch')) {
            lastError = new Error(t("scan.failDesc"));
            if (attempt < maxRetries) {
              await new Promise(r => setTimeout(r, 1500 * attempt));
              continue;
            }
          }
          throw new Error(error.message || t("scan.failDesc"));
        }

        if (data?.error && !data?.diagnosis) {
          console.error(`[AgriScan] Attempt ${attempt} - API error:`, data.error);
          throw new Error(data.error);
        }

        const diagnosis = data.diagnosis as DiagnosisResult;
        console.log('[AgriScan] Analysis complete:', diagnosis);

        onScanComplete(diagnosis);

        const displayName = diagnosis.problemNameLocal || diagnosis.problemName;

        if (diagnosis.problemName === "Unable to Analyze" || diagnosis.problemName === "Analysis Error") {
          toast({
            title: t("scan.issueTitle"),
            description: diagnosis.cause || t("scan.issueDesc"),
            variant: "destructive",
          });
        } else if (diagnosis.problemName === "Healthy Plant") {
          toast({
            title: t("scan.healthyTitle"),
            description: t("scan.healthyDesc"),
          });
        } else {
          toast({
            title: t("scan.completeTitle"),
            description: `${displayName} — ${diagnosis.confidence}%`,
          });
        }

        setIsAnalyzing(false);
        return; // Success - exit function
      } catch (error) {
        console.error(`[AgriScan] Attempt ${attempt} - Caught error:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < maxRetries) {
          console.log(`[AgriScan] Retrying in ${1500 * attempt}ms...`);
          await new Promise(r => setTimeout(r, 1500 * attempt));
        }
      }
    }

    // All retries failed
    console.error('[AgriScan] All retry attempts failed:', lastError);
    toast({
      title: t("scan.failTitle"),
      description: lastError?.message || t("scan.failDesc"),
      variant: "destructive",
    });
    setIsAnalyzing(false);
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
            {t("scan.title1")} <span className="text-gradient-primary">{t("scan.title2")}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("scan.subtitle")}
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
              {isCameraOpen ? (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="relative inline-block mb-6">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="max-w-full max-h-80 rounded-xl shadow-lg bg-black"
                    />
                    <button
                      onClick={stopCamera}
                      className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      aria-label={t("scan.closeCamera")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {cameraError && (
                    <p className="flex items-center justify-center gap-2 text-destructive mb-4">
                      <CameraOff className="w-4 h-4" />
                      {cameraError}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button variant="scan" size="lg" onClick={capturePhoto} className="min-w-[200px]">
                      <Camera className="w-5 h-5" />
                      {t("scan.capture")}
                    </Button>
                    <Button variant="ghost" size="lg" onClick={stopCamera}>
                      {t("scan.cancel")}
                    </Button>
                  </div>
                </motion.div>
              ) : !image ? (
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
                    {t("scan.drop")}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t("scan.browse")}
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
                          {t("scan.upload")}
                        </span>
                      </Button>
                    </label>
                    <Button variant="outline" size="lg" onClick={openCamera}>
                      <Camera className="w-5 h-5" />
                      {t("scan.take")}
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
                      alt={t("scan.previewAlt")}
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
                            <span className="font-medium text-foreground">{t("scan.analyzingPlant")}</span>
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
                          {t("scan.analyzing")}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          {t("scan.analyze")}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={clearImage}
                      disabled={isAnalyzing}
                    >
                      {t("scan.different")}
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
