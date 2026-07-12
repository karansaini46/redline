"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Shield, Zap } from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight flex items-center gap-2">
            <div className="size-6 rounded-md bg-accent flex items-center justify-center">
              <Shield className="size-4 text-white" />
            </div>
            Redline
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium hover:text-foreground">Log In</Link>
            <Button asChild className="rounded-full px-6">
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-24">
        {/* Hero Section */}
        <section className="px-6 max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border text-sm text-muted-foreground mb-8">
              <Zap className="size-4 text-accent" />
              <span>Introducing Redline AI 2.0</span>
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-bold tracking-tighter text-balance mb-6">
              Contract Intelligence for the Modern Enterprise.
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-muted-foreground max-w-2xl text-balance mb-10">
              Instantly extract insights, detect hidden risks, and compare complex legal documents with superhuman accuracy.
            </motion.p>
            <motion.div variants={fadeIn} className="flex gap-4">
              <Button asChild size="lg" className="rounded-full px-8 h-12 text-base shadow-xl shadow-accent/20">
                <Link href="/dashboard">
                  Start Free Trial <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8 h-12 text-base">
                <a href="#demo">View Demo</a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mt-20 relative mx-auto max-w-6xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-xl border border-white/10 bg-[#161B22] p-2 shadow-2xl overflow-hidden relative">
              <div className="h-6 border-b border-white/5 flex items-center px-4 gap-2 mb-2">
                <div className="size-2.5 rounded-full bg-red-500/80" />
                <div className="size-2.5 rounded-full bg-yellow-500/80" />
                <div className="size-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="grid grid-cols-4 gap-4 p-4 h-[400px]">
                <div className="col-span-1 rounded-lg bg-white/5 p-4 flex flex-col gap-3">
                  <div className="h-4 w-24 bg-white/10 rounded" />
                  <div className="h-4 w-full bg-white/10 rounded" />
                  <div className="h-4 w-3/4 bg-white/10 rounded" />
                  <div className="mt-auto h-24 rounded-lg bg-accent/20 border border-accent/30" />
                </div>
                <div className="col-span-3 grid grid-rows-3 gap-4">
                  <div className="row-span-1 rounded-lg bg-white/5 p-4 flex gap-4">
                    <div className="flex-1 rounded bg-white/10" />
                    <div className="flex-1 rounded bg-white/10" />
                    <div className="flex-1 rounded bg-white/10" />
                  </div>
                  <div className="row-span-2 rounded-lg bg-white/5 p-4">
                    <div className="h-full w-full rounded bg-white/5 flex items-end p-4 gap-2">
                      {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                        <div key={i} className="flex-1 bg-accent/50 rounded-t-sm" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating UI Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-8 top-32 rounded-xl border bg-card p-4 shadow-xl z-20 w-64"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Shield className="size-4 text-destructive" />
                </div>
                <div>
                  <div className="text-sm font-semibold">High Risk Detected</div>
                  <div className="text-xs text-muted-foreground">Indemnification Clause</div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-destructive" />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Enterprise Logos */}
        <section className="py-24 border-y mt-32 bg-muted/20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-8">TRUSTED BY INNOVATIVE LEGAL TEAMS WORLDWIDE</p>
            <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale">
              {['Acme Corp', 'GlobalBank', 'TechFlow', 'Stark Industries', 'Wayne Ent'].map((logo, i) => (
                <div key={i} className="text-xl font-bold tracking-widest">{logo}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Timeline */}
        <section id="features" className="py-32 px-6 max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need to scale your legal ops.</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">A unified platform to upload, parse, analyze, and negotiate contracts with AI assistance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="flex flex-col justify-center">
              <div className="size-12 rounded-xl bg-primary/5 border flex items-center justify-center mb-6">
                <CheckCircle2 className="size-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Semantic Clause Extraction</h3>
              <p className="text-muted-foreground leading-relaxed">
                Automatically tear down complex PDFs into semantic chunks. Redline understands the context of each clause, automatically categorizing and tagging obligations.
              </p>
            </div>
            <div className="rounded-2xl bg-muted p-8 shadow-inner border flex items-center justify-center min-h-[300px]">
              {/* Synthetic Mockup */}
              <div className="w-full space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 w-full bg-background rounded-lg shadow-sm border flex items-center px-4 gap-3">
                    <div className="size-4 rounded-full bg-muted-foreground/20" />
                    <div className="h-2 w-32 bg-muted-foreground/20 rounded" />
                    <div className="ml-auto h-4 w-16 bg-accent/10 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto rounded-3xl bg-primary text-primary-foreground p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Ready to upgrade your workflow?</h2>
              <p className="text-lg text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
                Join thousands of legal professionals saving hours every week with Redline's AI contract analysis.
              </p>
              <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg bg-background text-foreground hover:bg-background/90">
                <Link href="/dashboard">Get Started Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Shield className="size-5 text-accent" />
            Redline
          </div>
          <div className="text-sm text-muted-foreground">
            © 2026 Redline Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
