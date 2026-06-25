import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dna, Menu, X, LogIn, Activity, Database, Sparkles } from 'lucide-react';
import { checkHealth } from '../api/api';
import { SignInButton, UserButton, SignedIn, SignedOut } from '../utils/clerkHelper';

export default function Navbar({ activeTab, onTabChange }) {
  const [isOnline, setIsOnline] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const ping = async () => {
      try {
        await checkHealth();
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    ping();
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <a 
          href="#home" 
          onClick={() => onTabChange?.('screening')}
          className="flex items-center gap-2"
        >
          <Dna className="h-8 w-8 text-primary animate-pulse" strokeWidth={2.5} />
          <span className="font-display text-lg font-bold tracking-tight sm:text-xl bg-gradient-to-r from-white to-muted bg-clip-text text-transparent">
            OraLens AI
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-6 md:flex">
          {/* Signed In Portal Links */}
          <SignedIn>
            <button
              onClick={() => onTabChange?.('screening')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'screening'
                  ? 'text-primary bg-primary/10'
                  : 'text-muted hover:text-primary hover:bg-card/50'
              }`}
            >
              <Activity className="h-4 w-4" />
              Oral Screening
            </button>
            <button
              onClick={() => onTabChange?.('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'text-primary bg-primary/10'
                  : 'text-muted hover:text-primary hover:bg-card/50'
              }`}
            >
              <Database className="h-4 w-4" />
              My Health Logs
            </button>
            <button
              onClick={() => onTabChange?.('research')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'research'
                  ? 'text-primary bg-primary/10'
                  : 'text-muted hover:text-primary hover:bg-card/50'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              How It Works
            </button>
          </SignedIn>

          {/* Signed Out Landing Links */}
          <SignedOut>
            <a href="#home" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              Home
            </a>
            <a href="#screen" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              Screening
            </a>
            <a href="#performance" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              Technology
            </a>
            <a href="#about" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              About AI
            </a>
          </SignedOut>
        </div>

        {/* Right side operations */}
        <div className="flex items-center gap-3.5">
          {/* Server status indicator */}
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isOnline === null
                  ? 'animate-pulse bg-muted'
                  : isOnline
                    ? 'bg-healthy shadow-lg shadow-healthy/40'
                    : 'bg-cancer shadow-lg shadow-cancer/40'
              }`}
            />
            <span className="text-xs font-semibold text-muted tracking-wide">
              {isOnline === null ? 'Checking...' : isOnline ? 'Scan Ready' : 'Scan Offline'}
            </span>
          </div>

          {/* Authentication buttons */}
          <div className="flex items-center">
            <SignedIn>
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'h-9 w-9 border border-primary/50 shadow-md hover:scale-105 transition-transform',
                  }
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/95 hover:shadow-primary/30 transition-all hover:scale-102 cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In / Join</span>
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          {/* Mobile menu trigger */}
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-card md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border bg-surface px-4 py-4 md:hidden flex flex-col gap-3 shadow-xl"
        >
          <SignedIn>
            <button
              onClick={() => {
                onTabChange?.('screening');
                setMobileOpen(false);
              }}
              className={`flex items-center gap-2 py-2 px-3 rounded-lg text-left text-sm font-semibold ${
                activeTab === 'screening' ? 'text-primary bg-primary/5' : 'text-muted'
              }`}
            >
              <Activity className="h-4 w-4" />
              Oral Screening
            </button>
            <button
              onClick={() => {
                onTabChange?.('history');
                setMobileOpen(false);
              }}
              className={`flex items-center gap-2 py-2 px-3 rounded-lg text-left text-sm font-semibold ${
                activeTab === 'history' ? 'text-primary bg-primary/5' : 'text-muted'
              }`}
            >
              <Database className="h-4 w-4" />
              My Health Logs
            </button>
            <button
              onClick={() => {
                onTabChange?.('research');
                setMobileOpen(false);
              }}
              className={`flex items-center gap-2 py-2 px-3 rounded-lg text-left text-sm font-semibold ${
                activeTab === 'research' ? 'text-primary bg-primary/5' : 'text-muted'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              How It Works
            </button>
          </SignedIn>

          <SignedOut>
            <a
              href="#home"
              className="block py-2.5 px-3 text-sm font-medium text-muted hover:text-primary rounded-lg hover:bg-card/50"
              onClick={() => setMobileOpen(false)}
            >
              Home
            </a>
            <a
              href="#screen"
              className="block py-2.5 px-3 text-sm font-medium text-muted hover:text-primary rounded-lg hover:bg-card/50"
              onClick={() => setMobileOpen(false)}
            >
              Screening
            </a>
            <a
              href="#performance"
              className="block py-2.5 px-3 text-sm font-medium text-muted hover:text-primary rounded-lg hover:bg-card/50"
              onClick={() => setMobileOpen(false)}
            >
              Technology
            </a>
            <a
              href="#about"
              className="block py-2.5 px-3 text-sm font-medium text-muted hover:text-primary rounded-lg hover:bg-card/50"
              onClick={() => setMobileOpen(false)}
            >
              About AI
            </a>
          </SignedOut>
        </motion.div>
      )}
    </nav>
  );
}
