import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, ImageIcon, ScanLine, Lock, UserPlus, Info, CheckCircle2 } from 'lucide-react';
import { predictImage } from '../api/api';
import { parsePredictionResponse, getApiErrorMessage } from '../utils/parseResponse';
import LoadingSteps from './LoadingSteps';
import { saveScanToHistory } from '../utils/historyDb';
import { SignedIn, SignedOut, SignInButton, useUser } from '../utils/clerkHelper';

const MAX_SIZE = 10 * 1024 * 1024;
const STEP_DELAY = 700;

export default function UploadSection({ onResult, onError, onReset, userId }) {
  const { user } = useUser();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

  // Form States
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Auto-populate user name from Clerk profile
  useEffect(() => {
    const fullName = user?.fullName || user?.firstName;
    if (fullName && !patientName) {
      setPatientName(fullName);
    }
  }, [user, patientName]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const selected = acceptedFiles[0];
      if (!selected) return;
      if (preview) URL.revokeObjectURL(preview);
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      onReset?.();
    },
    [preview, onReset],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: loading,
  });

  const runStepAnimation = () =>
    new Promise((resolve) => {
      let step = 0;
      setActiveStep(0);
      const interval = setInterval(() => {
        step += 1;
        if (step >= 4) {
          clearInterval(interval);
          resolve();
        } else {
          setActiveStep(step);
        }
      }, STEP_DELAY);
    });

  const handleAnalyze = async () => {
    if (!file || loading) return;
    if (!patientName.trim()) {
      onError('Please enter your name to run screening.');
      return;
    }

    setLoading(true);
    setActiveStep(-1);
    onReset?.();

    const animationPromise = runStepAnimation();

    try {
      const [data] = await Promise.all([predictImage(file), animationPromise]);
      const parsed = parsePredictionResponse(data);
      setActiveStep(3);

      const patientDetails = {
        name: patientName,
        age: patientAge || 'N/A',
        gender: patientGender,
        notes: clinicalNotes || 'No symptoms specified',
      };

      // Save to localStorage history linked to this logged-in user
      if (userId) {
        await saveScanToHistory(userId, patientDetails, parsed, preview);
      }

      onResult({ ...parsed, patientDetails }, preview);

      // Reset file and symptoms but keep name pre-filled
      setFile(null);
      setPreview(null);
      setClinicalNotes('');
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
      setActiveStep(-1);
    }
  };

  const rejectionMessage = fileRejections[0]?.errors[0]?.message;

  return (
    <section id="screen" className="py-16 sm:py-24 relative overflow-hidden bg-bg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Signed Out Lock Screen UI */}
        <SignedOut>
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-panel rounded-3xl p-8 sm:p-12 text-center relative border border-border overflow-hidden"
            >
              {/* Decorative radial glows */}
              <div className="absolute top-0 right-0 h-48 w-48 rounded-full glow-orb-primary opacity-30 pointer-events-none" />
              
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
                <Lock className="h-8 w-8 animate-pulse" />
              </div>

              <h2 className="font-display text-2xl font-extrabold sm:text-3xl text-white">
                Personal Screening Portal
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm text-muted leading-relaxed">
                Check mouth sores, spots, or patches and track changes over time. Sign in securely to run a checkup and save your oral health history.
              </p>

              <div className="mx-auto mt-8 grid gap-4 sm:grid-cols-3 max-w-xl text-left">
                <div className="bg-[#0b101f] border border-border/40 rounded-2xl p-4 flex gap-3">
                  <UserPlus className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Health Journal</h3>
                    <p className="text-[11px] text-muted mt-1">Track spots over time with logs and dates.</p>
                  </div>
                </div>
                <div className="bg-[#0b101f] border border-border/40 rounded-2xl p-4 flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-healthy shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Fast AI Scan</h3>
                    <p className="text-[11px] text-muted mt-1">Instant probability analysis and risk levels.</p>
                  </div>
                </div>
                <div className="bg-[#0b101f] border border-border/40 rounded-2xl p-4 flex gap-3">
                  <Info className="h-5 w-5 text-opmd shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Share Reports</h3>
                    <p className="text-[11px] text-muted mt-1">Download diagnostic report sheets to show your dentist.</p>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-xl shadow-primary/20 hover:bg-primary/95 transition-all hover:scale-102 cursor-pointer"
                  >
                    <Lock className="h-4 w-4" />
                    <span>Sign In & Start Checkup</span>
                  </button>
                </SignInButton>
              </div>
            </motion.div>
          </div>
        </SignedOut>

        {/* Signed In Operational Screening UI */}
        <SignedIn>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl text-white">Oral Health Screening</h2>
            <p className="mt-3 text-muted">
              Add details of your symptoms and upload an image of the area you want to check.
            </p>
          </motion.div>

          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 md:grid-cols-12">
              {/* Left Column: Form Details */}
              <div className="md:col-span-5 bg-card/45 border border-border rounded-2xl p-6 flex flex-col gap-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Your Profile & Symptoms
                </h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="p-name" className="block text-xs font-bold uppercase tracking-wider text-muted">
                      Your Name <span className="text-cancer">*</span>
                    </label>
                    <input
                      id="p-name"
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="p-age" className="block text-xs font-bold uppercase tracking-wider text-muted">
                        Age
                      </label>
                      <input
                        id="p-age"
                        type="number"
                        placeholder="Age"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label htmlFor="p-gender" className="block text-xs font-bold uppercase tracking-wider text-muted">
                        Gender
                      </label>
                      <select
                        id="p-gender"
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        disabled={loading}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="p-notes" className="block text-xs font-bold uppercase tracking-wider text-muted">
                      Symptoms & Location
                    </label>
                    <textarea
                      id="p-notes"
                      rows={3}
                      placeholder="e.g. Painless white patch on side of tongue, active for about 10 days."
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Image Dropzone */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div
                  {...getRootProps()}
                  className={`cursor-pointer flex-grow rounded-2xl border-2 border-dashed p-8 text-center transition-all flex flex-col items-center justify-center min-h-[260px] scan-container ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card/30 hover:border-primary/50 hover:bg-card/65'
                  } ${loading ? 'pointer-events-none opacity-60' : ''}`}
                >
                  <input {...getInputProps()} />

                  {/* Scanning beam overlay during processing */}
                  {loading && <div className="scan-beam" />}

                  {preview ? (
                    <div className="flex flex-col items-center gap-4">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-48 rounded-xl border border-border object-contain shadow-lg"
                      />
                      <p className="text-sm text-muted">{file?.name}</p>
                      <p className="text-xs text-muted">Click or drag to replace image</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="rounded-full bg-surface p-4">
                        {isDragActive ? (
                          <ImageIcon className="h-10 w-10 text-primary" />
                        ) : (
                          <Upload className="h-10 w-10 text-muted" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-text">
                          {isDragActive ? 'Drop your image here' : 'Drag & drop image of the sore/lesion'}
                        </p>
                        <p className="mt-1 text-sm text-muted">or click to choose photo</p>
                      </div>
                      <p className="text-xs text-muted font-medium">JPEG or PNG · Max 10 MB</p>
                    </div>
                  )}
                </div>

                {rejectionMessage && (
                  <p className="mt-2 text-center text-sm text-cancer">{rejectionMessage}</p>
                )}

                <motion.button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!file || !patientName.trim() || loading}
                  whileHover={!loading && file && patientName.trim() ? { scale: 1.01 } : {}}
                  whileTap={!loading && file && patientName.trim() ? { scale: 0.99 } : {}}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-white shadow-lg shadow-primary/10 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ScanLine className="h-5 w-5" />
                  {loading ? 'Analyzing Photo...' : 'Analyze My Photo'}
                </motion.button>
              </div>
            </div>

            {loading && <LoadingSteps activeStep={activeStep} />}
          </div>
        </SignedIn>

      </div>
    </section>
  );
}
