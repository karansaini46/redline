"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
  },
};

const RealContractShowcase = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mt-24 relative mx-auto max-w-5xl"
    >
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-border/50 to-transparent pointer-events-none" />
      <div className="relative rounded-2xl border bg-surface/50 backdrop-blur-2xl p-1 shadow-premium-dark dark:shadow-premium-dark overflow-hidden">
        <div className="h-10 border-b flex items-center px-6 justify-between bg-surface/80">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Master Service Agreement — Acme Corp
          </div>
          <div className="flex gap-2">
            <div className="size-2 rounded-full bg-border" />
            <div className="size-2 rounded-full bg-border" />
            <div className="size-2 rounded-full bg-border" />
          </div>
        </div>

        <div className="p-8 md:p-16 grid grid-cols-1 lg:grid-cols-3 gap-12 bg-background min-h-[500px]">
          <div className="col-span-2 space-y-8 text-foreground/80 font-serif text-lg leading-relaxed">
            <p>
              4.1 <strong className="text-foreground">Indemnification.</strong>{" "}
              Provider shall indemnify, defend, and hold harmless Client and its
              officers, directors, employees, and agents from and against any
              and all claims, liabilities, damages, losses, and expenses
              (including reasonable attorneys&apos; fees) arising out of or
              related to:
            </p>
            <div className="relative">
              {/* Highlight Overlay */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 1,
                  delay: 1.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute inset-0 bg-destructive/10 border-l-2 border-destructive -ml-4 pl-4 mix-blend-multiply dark:mix-blend-lighten"
              />
              <p className="relative z-10 pl-4 border-l-2 border-transparent">
                (a) any breach of this Agreement by Provider; (b) any negligence
                or willful misconduct of Provider; or (c) any claim that the
                Services or Deliverables infringe upon any intellectual property
                rights of a third party.
              </p>
            </div>
            <p>
              4.2{" "}
              <strong className="text-foreground">
                Limitation of Liability.
              </strong>{" "}
              In no event shall either party be liable for any indirect,
              incidental, special, consequential, or punitive damages, or for
              any loss of profits or revenues, whether incurred directly or
              indirectly.
            </p>
          </div>

          <div className="col-span-1 border-l pl-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 2, ease: "easeOut" }}
              className="p-5 rounded-xl border bg-surface-elevated shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
              <div className="flex items-center gap-2 mb-3">
                <div className="size-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  Critical Risk Detected
                </span>
              </div>
              <h4 className="font-medium text-sm mb-2">
                Uncapped IP Indemnification
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Section 4.1(c) exposes the provider to uncapped liability for
                third-party intellectual property claims. Standard practice is
                to cap this liability or require the client to notify within 30
                days.
              </p>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground font-mono">
                  CONFIDENCE: 98%
                </span>
                <span className="text-xs font-medium cursor-pointer hover:text-foreground transition-colors">
                  View Playbook
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function LandingPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does Redline analyze contracts?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Redline uses advanced semantic parsing to extract structured clauses and track obligations securely.",
        },
      },
      {
        "@type": "Question",
        name: "Is my data secure?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, we implement row-level security and encrypt all sensitive document data at rest and in transit.",
        },
      },
      {
        "@type": "Question",
        name: "Can Redline detect deviations from standard playbooks?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely. Redline instantly flags subtle deviations from your playbook and highlights potential risks before negotiation.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden selection:bg-foreground selection:text-background">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Premium Top Navigation */}
      <header className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-serif font-bold text-xl tracking-tight text-foreground">
            Redline.
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log In
            </Link>
            <Button
              render={<Link href="/dashboard" />}
              className="rounded-xl px-6 bg-foreground text-background hover:bg-foreground/90 transition-all"
            >
              Access Platform
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-40 pb-32">
        {/* Cinematic Hero Section */}
        <section className="px-6 max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center max-w-4xl mx-auto text-center"
          >
            <motion.h1
              variants={fadeUp}
              className="font-serif text-5xl md:text-7xl font-medium tracking-tight text-balance mb-8 text-foreground leading-[1.1]"
            >
              Contract analysis, <br className="hidden md:block" /> elevated.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl text-balance mb-12 font-light"
            >
              Redline transforms complex legal documents into structured
              intelligence. Experience superhuman accuracy without sacrificing
              the nuance of human craft.
            </motion.p>
            <motion.div variants={fadeUp} className="flex gap-4">
              <Button
                render={<Link href="/dashboard" />}
                size="lg"
                className="rounded-xl px-8 h-14 text-base bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] transition-all duration-300"
              >
                Begin Trial
              </Button>
            </motion.div>
          </motion.div>

          {/* Realistic Dashboard Mockup */}
          <RealContractShowcase />
        </section>

        {/* Sophisticated Features Grid */}
        <section className="py-40 px-6 max-w-7xl mx-auto mt-20">
          <div className="mb-24 md:flex justify-between items-end border-b pb-8">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">
              Capabilities
            </h2>
            <p className="text-muted-foreground max-w-md mt-6 md:mt-0 text-sm">
              A meticulously engineered pipeline for legal operations. Every
              feature is designed with intention and executed with precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-20">
            {[
              {
                title: "Semantic Parsing",
                desc: "Documents are instantly torn down into structured clauses, maintaining the exact intent and context of the original author.",
              },
              {
                title: "Risk Detection",
                desc: "Subtle deviations from your standard playbooks are flagged immediately, calculating exposure before negotiations begin.",
              },
              {
                title: "Obligation Tracking",
                desc: "Hidden renewals and buried payment terms are extracted into actionable, forward-looking timelines.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-col group"
              >
                <div className="h-0.5 w-12 bg-foreground mb-6 transition-all duration-500 group-hover:w-full" />
                <h3 className="font-serif text-2xl mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-light">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-6 max-w-4xl mx-auto border-t">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground font-light text-sm">
              Common inquiries about our contract intelligence platform.
            </p>
          </div>
          <div className="space-y-8">
            <div className="group">
              <h3 className="font-serif text-xl mb-2 group-hover:text-foreground text-foreground/90 transition-colors">
                How does Redline analyze contracts?
              </h3>
              <p className="text-muted-foreground font-light text-sm leading-relaxed">
                Redline uses advanced semantic parsing to extract structured
                clauses and track obligations securely.
              </p>
            </div>
            <div className="h-px bg-border/50" />
            <div className="group">
              <h3 className="font-serif text-xl mb-2 group-hover:text-foreground text-foreground/90 transition-colors">
                Is my data secure?
              </h3>
              <p className="text-muted-foreground font-light text-sm leading-relaxed">
                Yes, we implement row-level security and encrypt all sensitive
                document data at rest and in transit.
              </p>
            </div>
            <div className="h-px bg-border/50" />
            <div className="group">
              <h3 className="font-serif text-xl mb-2 group-hover:text-foreground text-foreground/90 transition-colors">
                Can Redline detect deviations from standard playbooks?
              </h3>
              <p className="text-muted-foreground font-light text-sm leading-relaxed">
                Absolutely. Redline instantly flags subtle deviations from your
                playbook and highlights potential risks before negotiation.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border/50 py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-serif font-bold text-xl text-foreground">
            Redline.
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">
            © 2026 Redline Platform.
          </div>
        </div>
      </footer>
    </div>
  );
}
