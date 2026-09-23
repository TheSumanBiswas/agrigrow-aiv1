import { motion } from "framer-motion";
import { Leaf, Heart, Shield, Users, Target, Sprout } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";

const values: { icon: typeof Heart; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: Heart, titleKey: "about.v1t", descKey: "about.v1d" },
  { icon: Leaf, titleKey: "about.v2t", descKey: "about.v2d" },
  { icon: Shield, titleKey: "about.v3t", descKey: "about.v3d" },
];

const AboutSection = () => {
  const { t } = useLanguage();

  const stats: { value: string; labelKey: TranslationKey }[] = [
    { value: "1000+", labelKey: "about.stat1" },
    { value: "50+", labelKey: "about.stat2" },
    { value: t("about.stat3v"), labelKey: "about.stat3" },
    { value: "95%", labelKey: "about.stat4" },
  ];

  return (
    <section id="about" className="py-20 md:py-32 bg-scan-gradient">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t("about.badge")}</span>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("about.title1")}{" "}
            <span className="text-gradient-primary">{t("about.title2")}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("about.intro")}
          </p>
        </motion.div>

        {/* Mission Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <div className="nature-card p-8 md:p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Target className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-foreground">
                    {t("about.missionTitle")}
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t("about.missionText")}
                </p>
                <div className="flex items-center gap-3 text-primary font-medium">
                  <Sprout className="w-5 h-5" />
                  <span>{t("about.missionTag")}</span>
                </div>
              </div>

              {/* Decorative Element */}
              <motion.div
                className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-2xl -z-10"
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {values.map((value, index) => (
              <motion.div
                key={value.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="nature-card-hover p-6 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-lg text-foreground mb-1">
                    {t(value.titleKey)}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t(value.descKey)}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="nature-card p-8 md:p-10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.labelKey}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="font-heading text-3xl md:text-4xl font-bold text-gradient-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{t(stat.labelKey)}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
