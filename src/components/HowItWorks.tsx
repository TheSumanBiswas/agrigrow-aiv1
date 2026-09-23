import { motion } from "framer-motion";
import { Upload, Scan, FileText, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";

const steps: { icon: typeof Upload; titleKey: TranslationKey; descKey: TranslationKey; color: string }[] = [
  { icon: Upload, titleKey: "how.s1t", descKey: "how.s1d", color: "primary" },
  { icon: Scan, titleKey: "how.s2t", descKey: "how.s2d", color: "accent" },
  { icon: FileText, titleKey: "how.s3t", descKey: "how.s3d", color: "sky" },
  { icon: Sparkles, titleKey: "how.s4t", descKey: "how.s4d", color: "primary" },
];

const HowItWorks = () => {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t("how.title1")} <span className="text-gradient-primary">{t("how.title2")}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("how.subtitle")}
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.titleKey}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-border to-transparent" />
                )}

                <div className="nature-card-hover p-6 text-center h-full">
                  {/* Step Number */}
                  <motion.div
                    className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.15 + 0.3 }}
                  >
                    {index + 1}
                  </motion.div>

                  {/* Icon */}
                  <motion.div
                    className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                      step.color === "primary"
                        ? "bg-primary/10"
                        : step.color === "accent"
                        ? "bg-accent/10"
                        : "bg-sky/10"
                    }`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <step.icon
                      className={`w-8 h-8 ${
                        step.color === "primary"
                          ? "text-primary"
                          : step.color === "accent"
                          ? "text-accent"
                          : "text-sky"
                      }`}
                    />
                  </motion.div>

                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(step.descKey)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
