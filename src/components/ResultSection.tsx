import { motion } from "framer-motion";
import { AlertTriangle, Leaf, Shield, CheckCircle, Beaker, Info, Camera, XCircle } from "lucide-react";
import { DiagnosisResult } from "./ScanSection";
import { Button } from "./ui/button";

interface ResultSectionProps {
  result: DiagnosisResult | null;
}

const ResultSection = ({ result }: ResultSectionProps) => {
  if (!result) return null;

  const isUnableToAnalyze = result.problemName === "Unable to Analyze" || result.problemName === "Analysis Error";
  const isHealthyPlant = result.problemName === "Healthy Plant";

  const getSeverityColor = (severity: string) => {
    if (isUnableToAnalyze) {
      return "bg-accent/10 text-accent-foreground border-accent/30";
    }
    switch (severity) {
      case "low":
        return "bg-primary/10 text-primary border-primary/30";
      case "medium":
        return "bg-accent/10 text-accent-foreground border-accent/30";
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (isUnableToAnalyze) {
      return XCircle;
    }
    switch (severity) {
      case "low":
        return CheckCircle;
      case "medium":
        return AlertTriangle;
      case "high":
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const SeverityIcon = getSeverityIcon(result.severity);

  const scrollToScan = () => {
    const element = document.querySelector("#scan");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="results" className="py-20 bg-nature-gradient">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Diagnosis <span className="text-gradient-primary">Results</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {isUnableToAnalyze 
              ? "We need a better image to analyze your plant"
              : "Here's what we found and how you can treat it"
            }
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid gap-6">
          {/* Problem Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`nature-card p-6 md:p-8 ${isUnableToAnalyze ? 'border-accent/50' : ''}`}
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  isUnableToAnalyze ? 'bg-accent/10' : isHealthyPlant ? 'bg-primary/10' : 'bg-destructive/10'
                }`}>
                  {isUnableToAnalyze ? (
                    <Camera className="w-8 h-8 text-accent" />
                  ) : isHealthyPlant ? (
                    <CheckCircle className="w-8 h-8 text-primary" />
                  ) : (
                    <Leaf className="w-8 h-8 text-destructive" />
                  )}
                </div>
              </div>
              <div className="flex-grow">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                    {result.problemName}
                  </h3>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(result.severity)}`}>
                    <SeverityIcon className="w-4 h-4" />
                    {isUnableToAnalyze ? "Image Issue" : `${result.severity.charAt(0).toUpperCase() + result.severity.slice(1)} Severity`}
                  </span>
                </div>
                
                {/* Confidence Bar - Hide for unable to analyze */}
                {!isUnableToAnalyze && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Confidence Level</span>
                      <span className="font-semibold text-primary">{result.confidence}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${result.confidence}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {/* Show "Try Again" button for unable to analyze */}
                {isUnableToAnalyze && (
                  <div className="mt-4">
                    <Button variant="nature" onClick={scrollToScan}>
                      <Camera className="w-4 h-4" />
                      Take New Photo
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Cause Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="nature-card p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h4 className="font-heading font-semibold text-lg text-foreground mb-2">
                  {isUnableToAnalyze ? "📷 What Went Wrong" : "⚠️ Cause"}
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {result.cause}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Treatment Cards Grid - Only show for analyzable results */}
          {!isUnableToAnalyze && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Organic Treatment */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="nature-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-heading font-semibold text-lg text-foreground">
                    🌿 Organic Treatment
                  </h4>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {result.organicTreatment}
                </p>
              </motion.div>

              {/* Chemical Treatment */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="nature-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky/10 flex items-center justify-center">
                    <Beaker className="w-5 h-5 text-sky" />
                  </div>
                  <h4 className="font-heading font-semibold text-lg text-foreground">
                    💊 Chemical Treatment
                  </h4>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {result.chemicalTreatment}
                </p>
              </motion.div>
            </div>
          )}

          {/* Prevention Tips / Photo Tips */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="nature-card p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-heading font-semibold text-lg text-foreground">
                {isUnableToAnalyze ? "📸 Tips for Better Photos" : "🛡️ Prevention Tips"}
              </h4>
            </div>
            <ul className="space-y-3">
              {result.preventionTips.map((tip, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{tip}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ResultSection;
