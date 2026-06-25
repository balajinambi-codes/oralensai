import { motion } from 'framer-motion';
import { ArrowRight, Shield, Activity, Cpu, Sparkles } from 'lucide-react';
import { useUser, SignInButton } from '../utils/clerkHelper';

const PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  left: `${(i * 21 + 7) % 95}%`,
  top: `${(i * 17 + 12) % 75}%`,
  delay: `${(i * 0.5) % 5}s`,
  duration: `${6 + (i % 4)}s`,
}));

export default function Hero() {
  const { isSignedIn } = useUser();

  const handleCTA = () => {
    document.getElementById('screen')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-24 overflow-hidden bg-bg">
      {/* Background Grid and Particles */}
      <div className="hero-grid" />
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}

      {/* Floating blurred glowing blobs */}
      <div className="absolute top-[10%] left-[-10%] h-[300px] w-[300px] rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-healthy/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 w-full">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Text Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm">
              <Shield className="h-4 w-4 animate-pulse" />
              <span>AI-Powered Oral Cancer & Lesion Screening</span>
            </div>

            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl text-white">
              Check Your Oral{' '}
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-healthy bg-clip-text text-transparent">
                Health Instantly.
              </span>
            </h1>

            <p className="max-w-xl text-base text-muted sm:text-lg leading-relaxed">
              Check sores, spots, or red/white patches in your mouth from home. Get a real-time risk evaluation using our deep learning visual screening assistant.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={handleCTA}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/95 hover:shadow-primary/45 transition-all hover:scale-102 cursor-pointer"
                >
                  <span>Start Oral Checkup</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/95 hover:shadow-primary/45 transition-all hover:scale-102 cursor-pointer"
                  >
                    <span>Check My Health Now</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </SignInButton>
              )}

              <button
                type="button"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/40 px-6 py-4 text-base font-semibold text-text hover:bg-card/85 transition-colors"
              >
                Learn More
              </button>
            </div>

            {/* Quick stats / trust signals */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50 max-w-lg">
              <div>
                <p className="font-display text-2xl font-bold text-white">95.6%</p>
                <p className="text-xs text-muted font-medium mt-1">Screening Accuracy</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-white">0.99</p>
                <p className="text-xs text-muted font-medium mt-1">Healthy Class AUC</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-white">&lt; 3.5s</p>
                <p className="text-xs text-muted font-medium mt-1">Analysis Latency</p>
              </div>
            </div>
          </motion.div>

          {/* Right Showcase Card Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            {/* Soft background glow */}
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-75 pointer-events-none" />

            <div className="glass-panel rounded-3xl p-6 shadow-2xl relative border border-border">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">OraLens Scan Screen</span>
                </div>
                <div className="flex h-2.5 w-2.5 items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-healthy animate-ping absolute" />
                  <span className="h-2 w-2 rounded-full bg-healthy" />
                </div>
              </div>

              {/* Scanning visual placeholder */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-[#0d1323] flex items-center justify-center scan-container">
                {/* Simulated mouth structure wireframe */}
                <svg className="w-2/3 h-2/3 text-[#1e3a5f]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10,50 Q50,90 90,50 Q50,10 10,50 Z" strokeDasharray="3 3" />
                  <circle cx="50" cy="50" r="22" className="text-primary/30" strokeWidth="2" strokeDasharray="4" />
                  <path d="M30,50 Q50,70 70,50" className="text-cancer/40" strokeWidth="2" />
                  <rect x="42" y="42" width="16" height="16" className="text-cancer/60 animate-pulse" strokeWidth="1.5" />
                  <line x1="50" y1="20" x2="50" y2="80" strokeDasharray="2" />
                  <line x1="20" y1="50" x2="80" y2="50" strokeDasharray="2" />
                </svg>
                {/* Animated scan beam */}
                <div className="scan-beam" />
                
                {/* Real-time confidence tag */}
                <div className="absolute bottom-4 right-4 bg-healthy/10 border border-healthy/40 px-3 py-1 rounded-lg text-xs font-bold text-healthy flex items-center gap-1.5 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-healthy animate-pulse" />
                  Healthy — 98.2%
                </div>

                <div className="absolute top-4 left-4 bg-primary/10 border border-primary/40 px-3 py-1 rounded-lg text-xs font-bold text-primary flex items-center gap-1.5 backdrop-blur-md">
                  <Cpu className="h-3 w-3" />
                  Image Enhanced
                </div>
              </div>

              {/* Simulation metrics */}
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="bg-[#0c1221] border border-border/60 rounded-xl p-3.5">
                  <p className="text-[10px] uppercase font-bold text-muted tracking-wide">Analysis Status</p>
                  <p className="text-sm font-bold text-healthy mt-1">Healthy / Low Risk</p>
                </div>
                <div className="bg-[#0c1221] border border-border/60 rounded-xl p-3.5">
                  <p className="text-[10px] uppercase font-bold text-muted tracking-wide">Scan Time</p>
                  <p className="text-sm font-bold text-white mt-1">810 ms</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
