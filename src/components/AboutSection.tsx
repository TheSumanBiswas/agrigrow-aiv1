import { motion } from "framer-motion";
import { Leaf, Heart, Shield, Users, Target, Sprout } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Farmer First",
    description: "Every feature is designed with farmers in mind. Simple, accessible, and practical.",
  },
  {
    icon: Leaf,
    title: "Sustainable Farming",
    description: "We prioritize eco-friendly solutions that protect both crops and the environment.",
  },
  {
    icon: Shield,
    title: "Safe Solutions",
    description: "Our recommendations follow safe practices to protect human health and nature.",
  },
];

const stats = [
  { value: "10,000+", label: "Diseases Identified" },
  { value: "50+", label: "Crop Types Supported" },
  { value: "1M+", label: "Scans Performed" },
  { value: "95%", label: "Accuracy Rate" },
];

const AboutSection = () => {
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
            <span className="text-sm font-medium text-primary">About AgriScan AI</span>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Empowering Farmers with{" "}
            <span className="text-gradient-primary">AI Technology</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            AgriScan AI is on a mission to make plant disease diagnosis accessible to every farmer. 
            Using cutting-edge artificial intelligence, we help protect crops, increase yields, 
            and promote sustainable farming practices worldwide.
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
                    Our Mission
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  We believe that every farmer deserves access to expert-level plant health diagnostics. 
                  Traditional agricultural support is often expensive, slow, or unavailable in rural areas. 
                  AgriScan AI bridges this gap by putting the power of AI directly in farmers' hands.
                </p>
                <div className="flex items-center gap-3 text-primary font-medium">
                  <Sprout className="w-5 h-5" />
                  <span>Growing a healthier future, one scan at a time</span>
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
                key={value.title}
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
                    {value.title}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {value.description}
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
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="font-heading text-3xl md:text-4xl font-bold text-gradient-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
