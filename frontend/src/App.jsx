import { useState, useCallback, Component } from 'react';
import { ClerkProvider, SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import UploadSection from './components/UploadSection';
import ResultsPanel from './components/ResultsPanel';
import ModelPerformance from './components/ModelPerformance';
import About from './components/About';
import Footer from './components/Footer';
import ErrorToast from './components/ErrorToast';
import ScanHistory from './components/ScanHistory';

// ErrorBoundary catches any Clerk initialization or rendering crashes
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Clerk error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Fallback public landing page rendered when Clerk authentication is unavailable/unconfigured
function AppContentNoAuth() {
  const [result, setResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);

  const handleResult = useCallback((parsed, preview) => {
    setResult(parsed);
    setImagePreview(preview);
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }, []);

  const handleError = useCallback((message) => {
    setError(message);
    setTimeout(() => setError(null), 8000);
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setImagePreview(null);
    document.getElementById('screen')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleUploadReset = useCallback(() => {
    setResult(null);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary/30 selection:text-white">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[20%] right-[10%] h-[350px] w-[350px] rounded-full glow-orb-primary opacity-60" />
        <div className="absolute bottom-[20%] left-[5%] h-[400px] w-[400px] rounded-full glow-orb-healthy opacity-40" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Public navigation header */}
        <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md transition-all duration-300">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <svg className="h-8 w-8 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="font-display text-lg font-bold tracking-tight sm:text-xl bg-gradient-to-r from-white to-muted bg-clip-text text-transparent">
                OraLens AI
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#home" className="text-sm font-medium text-muted hover:text-primary transition-colors">Home</a>
              <a href="#screen" className="text-sm font-medium text-muted hover:text-primary transition-colors">Screening</a>
              <a href="#performance" className="text-sm font-medium text-muted hover:text-primary transition-colors">Technology</a>
              <a href="#about" className="text-sm font-medium text-muted hover:text-primary transition-colors">About AI</a>
            </div>
          </div>
        </nav>

        <main className="flex-grow pt-20">
          <Hero />
          <UploadSection
            onResult={handleResult}
            onError={handleError}
            onReset={handleUploadReset}
          />
          <ResultsPanel
            result={result}
            imagePreview={imagePreview}
            onReset={handleReset}
          />
          <ModelPerformance />
          <About />
        </main>

        <Footer />
        <ErrorToast message={error} onClose={() => setError(null)} />
      </div>
    </div>
  );
}

// Standard authenticated app layout
function AppContent() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('screening');
  const [result, setResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);

  const handleResult = useCallback((parsed, preview) => {
    setResult(parsed);
    setImagePreview(preview);
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }, []);

  const handleError = useCallback((message) => {
    setError(message);
    setTimeout(() => setError(null), 8000);
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setImagePreview(null);
    document.getElementById('screen')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleUploadReset = useCallback(() => {
    setResult(null);
  }, []);

  const selectTab = useCallback((tab) => {
    setActiveTab(tab);
    setResult(null);
    setImagePreview(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary/30 selection:text-white">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[20%] right-[10%] h-[350px] w-[350px] rounded-full glow-orb-primary opacity-60" />
        <div className="absolute bottom-[20%] left-[5%] h-[400px] w-[400px] rounded-full glow-orb-healthy opacity-40" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar activeTab={activeTab} onTabChange={selectTab} />

        <SignedIn>
          <main className="flex-grow pt-20">
            {activeTab === 'screening' && (
              <>
                <UploadSection
                  onResult={handleResult}
                  onError={handleError}
                  onReset={handleUploadReset}
                  userId={user?.id}
                />
                <ResultsPanel
                  result={result}
                  imagePreview={imagePreview}
                  onReset={handleReset}
                  patientDetails={result?.patientDetails}
                />
              </>
            )}

            {activeTab === 'history' && (
              <ScanHistory userId={user?.id} />
            )}

            {activeTab === 'research' && (
              <>
                <ModelPerformance />
                <About />
              </>
            )}
          </main>
        </SignedIn>

        <SignedOut>
          <main className="flex-grow">
            <Hero />
            <UploadSection
              onResult={handleResult}
              onError={handleError}
              onReset={handleUploadReset}
            />
            <ResultsPanel
              result={result}
              imagePreview={imagePreview}
              onReset={handleReset}
            />
            <ModelPerformance />
            <About />
          </main>
        </SignedOut>

        <Footer />
        <ErrorToast message={error} onClose={() => setError(null)} />
      </div>
    </div>
  );
}

export default function App() {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

  return (
    <ErrorBoundary fallback={<AppContentNoAuth />}>
      <ClerkProvider publishableKey={clerkKey}>
        <AppContent />
      </ClerkProvider>
    </ErrorBoundary>
  );
}
