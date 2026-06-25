import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Clock, RotateCcw, AlertTriangle, Printer, User } from 'lucide-react';
import { getClassificationColor, getRiskColor } from '../utils/parseResponse';

function ConfidenceRing({ value, color }) {
  const [animated, setAnimated] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(value ?? 0, 0), 100);
  const offset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#1E3A5F"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold">{animated.toFixed(1)}%</span>
        <p className="text-xs text-muted">Confidence</p>
      </div>
    </div>
  );
}

const PROB_COLORS = {
  Healthy: '#22C55E',
  OPMD: '#F59E0B',
  'Oral Cancer': '#EF4444',
};

export default function ResultsPanel({ result, imagePreview, onReset }) {
  if (!result) return null;

  const patient = result.patientDetails;
  const badgeColor = getClassificationColor(result.classification);
  const riskColor = getRiskColor(result.riskLevel);

  const chartData = result.probabilities.map((p) => ({
    name: p.label,
    value: Number(p.value.toFixed(1)),
  }));

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const patientName = patient?.name || 'Anonymous User';
    const patientAge = patient?.age || 'N/A';
    const patientGender = patient?.gender || 'N/A';
    const patientNotes = patient?.notes || 'None';

    printWindow.document.write(`
      <html>
        <head>
          <title>OraLens AI Personal Screening Report - ${patientName}</title>
          <style>
            body { 
              font-family: 'Inter', system-ui, sans-serif; 
              color: #0f172a; 
              padding: 40px; 
              line-height: 1.6; 
              background-color: #ffffff;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0EA5E9;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .brand {
              font-size: 28px;
              font-weight: 800;
              color: #0ea5e9;
              letter-spacing: -0.05em;
            }
            .brand span {
              color: #475569;
            }
            .report-title {
              font-size: 14px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #64748b;
            }
            .grid {
              display: grid;
              grid-template-columns: 1.2fr 0.8fr;
              gap: 40px;
              margin-bottom: 35px;
            }
            .section-title {
              font-size: 13px;
              font-weight: 700;
              color: #0ea5e9;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
              margin-bottom: 16px;
              margin-top: 10px;
            }
            .info-row {
              display: flex;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .info-label {
              font-weight: 600;
              width: 130px;
              color: #475569;
            }
            .info-val {
              color: #0f172a;
            }
            .image-box {
              text-align: center;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 15px;
            }
            .image-box img {
              max-width: 100%;
              max-height: 240px;
              object-fit: contain;
              border-radius: 8px;
              border: 1px solid #cbd5e1;
            }
            .prob-list {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .prob-list th, .prob-list td {
              text-align: left;
              padding: 12px 16px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 14px;
            }
            .prob-list th {
              color: #475569;
              font-weight: 600;
              background-color: #f8fafc;
            }
            .recommendation-card {
              background-color: #f0f9ff;
              border-left: 4px solid #0ea5e9;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 40px;
            }
            .recommendation-title {
              font-weight: 700;
              color: #0369a1;
              font-size: 14px;
              margin-bottom: 8px;
            }
            .recommendation-body {
              font-size: 14px;
              color: #0c4a6e;
              margin: 0;
              font-style: italic;
            }
            .footer-disclaimer {
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
              font-size: 11.5px;
              color: #dc2626; /* Warning red color for disclaimer */
              font-weight: 600;
              text-align: center;
              line-height: 1.5;
            }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="brand">OraLens<span>AI</span></div>
            <div class="report-title">Health Scan Report</div>
          </div>
          
          <div class="grid">
            <div>
              <div class="section-title">Your Profile Details</div>
              <div class="info-row"><span class="info-label">Name:</span><span class="info-val">${patientName}</span></div>
              <div class="info-row"><span class="info-label">Age:</span><span class="info-val">${patientAge}</span></div>
              <div class="info-row"><span class="info-label">Gender:</span><span class="info-val">${patientGender}</span></div>
              <div class="info-row"><span class="info-label">Scan Date:</span><span class="info-val">${new Date().toLocaleString()}</span></div>
              
              <div class="section-title" style="margin-top: 30px;">AI Scan Results</div>
              <div class="info-row">
                <span class="info-label">Classification:</span>
                <span class="info-val" style="font-weight: 700; color: ${badgeColor};">${result.classification}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Confidence:</span>
                <span class="info-val">${result.confidence.toFixed(1)}%</span>
              </div>
              <div class="info-row">
                <span class="info-label">Risk Level:</span>
                <span class="info-val" style="font-weight: 700; color: ${riskColor};">${result.riskLevel}</span>
              </div>
            </div>
            
            <div>
              <div class="section-title">Uploaded Photo</div>
              <div class="image-box">
                <img src="${imagePreview}" alt="Oral Photo" />
              </div>
            </div>
          </div>

          <div>
            <div class="section-title">Reported Symptoms</div>
            <p style="font-size: 14px; color: #334155; margin-bottom: 30px; background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
              ${patientNotes}
            </p>
          </div>

          <div>
            <div class="section-title">Model Probabilities</div>
            <table class="prob-list">
              <thead>
                <tr>
                  <th>Lesion Target type</th>
                  <th>Model Confidence Score</th>
                </tr>
              </thead>
              <tbody>
                ${result.probabilities.map(p => `
                  <tr>
                    <td style="font-weight: 600;">${p.label}</td>
                    <td>${p.value.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="recommendation-card">
            <div class="recommendation-title">AI Recommendation</div>
            <p class="recommendation-body">"${result.recommendation}"</p>
          </div>

          <div class="footer-disclaimer">
            IMPORTANT WARNING: This screening report was generated by the OraLens AI deep-learning model for personal wellness support. It does NOT constitute a medical diagnosis. If you have a sore, spot, or patch in your mouth that does not heal within 14 days, please consult a dentist or qualified medical professional immediately for proper evaluation.
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <section id="results" className="py-12 sm:py-16 bg-bg">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-3xl border border-border bg-card/65 shadow-2xl backdrop-blur-md relative"
        >
          {/* Top banner detailing report metadata */}
          <div className="border-b border-border/80 bg-surface/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Oral Health Scan Report</h2>
              <p className="text-sm text-muted">Real-time AI probability scan details</p>
            </div>
            {patient && (
              <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/25 px-4 py-2 text-xs font-semibold text-primary">
                <User className="h-4 w-4" />
                <span>Profile: {patient.name} ({patient.gender}, {patient.age} yrs)</span>
              </div>
            )}
          </div>

          <div className="grid gap-8 p-6 lg:grid-cols-12">
            {/* Left Column - Visual Diagnostics (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center gap-6 border-b border-border/40 pb-6 lg:border-b-0 lg:border-r lg:border-border/40 lg:pb-0 lg:pr-8">
              {imagePreview && (
                <div className="relative rounded-2xl overflow-hidden border border-border bg-[#0d1323] p-1 shadow-lg aspect-square w-full max-w-[240px]">
                  <img
                    src={imagePreview}
                    alt="Analyzed Lesion"
                    className="w-full h-full rounded-xl object-cover"
                  />
                </div>
              )}

              <div
                className="rounded-2xl px-6 py-3.5 text-center w-full max-w-[240px]"
                style={{
                  backgroundColor: `${badgeColor}12`,
                  border: `2.5px solid ${badgeColor}`,
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  AI Output
                </p>
                <p
                  className="mt-0.5 font-display text-2xl font-black"
                  style={{ color: badgeColor }}
                >
                  {result.classification}
                </p>
              </div>

              <ConfidenceRing
                value={result.confidence}
                color={badgeColor}
              />

              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-sm"
                style={{
                  backgroundColor: `${riskColor}12`,
                  color: riskColor,
                  border: `1px solid ${riskColor}35`,
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: riskColor }} />
                Risk Level: {result.riskLevel}
              </div>
            </div>

            {/* Right Column - Stats, Notes & Export Actions (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-6">
              
              {/* Patient Notes Display */}
              {patient?.notes && (
                <div className="bg-[#0b101f] border border-border/40 rounded-2xl p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Your Symptoms</h3>
                  <p className="text-xs text-text leading-relaxed font-medium">{patient.notes}</p>
                </div>
              )}

              {/* Class Probability Charts */}
              <div>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">
                  AI Classification Probabilities
                </h3>
                <div className="overflow-x-auto">
                  <div className="min-w-[260px]">
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                      >
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={90}
                          tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#1E2A3A',
                            border: '1px solid #1E3A5F',
                            borderRadius: '8px',
                            color: '#F1F5F9',
                          }}
                          formatter={(val) => [`${val}%`, 'Probability']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22}>
                          {chartData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={PROB_COLORS[entry.name] || '#0EA5E9'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-2 flex flex-wrap gap-4">
                      {chartData.map((d) => (
                        <span key={d.name} className="text-[11px] font-semibold text-muted flex items-center gap-1">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: PROB_COLORS[d.name] }}
                          />
                          {d.name}: {d.value}%
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendation */}
              {result.recommendation && (
                <div className="rounded-2xl border border-border bg-surface/40 p-4.5">
                  <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-primary">AI Guidance</h3>
                  <p className="text-xs leading-relaxed text-muted font-medium">{result.recommendation}</p>
                </div>
              )}

              {/* Latency badge */}
              {result.inferenceTimeMs != null && (
                <div className="flex items-center gap-2 text-xs text-muted font-medium">
                  <Clock className="h-4 w-4 text-primary" />
                  Processed by Neural Network in {result.inferenceTimeMs} ms
                </div>
              )}

              {/* Disclaimer alert */}
              <div className="flex items-start gap-2 rounded-xl border border-cancer/10 bg-cancer/5 p-3.5 border-cancer/20">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-cancer" />
                <p className="text-[11px] leading-relaxed text-cancer font-bold">
                  IMPORTANT: This scan is for information support only. If you have mouth sores or patches that last more than 14 days, you must consult a dentist or doctor for a professional medical exam.
                </p>
              </div>

              {/* Action Buttons: PDF Export & Reset */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-border text-sm font-bold text-white hover:border-primary hover:text-primary transition-all py-3 cursor-pointer hover:scale-102"
                >
                  <Printer className="h-4 w-4" />
                  <span>Save Report / Print</span>
                </button>

                <button
                  type="button"
                  onClick={onReset}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary/95 transition-all py-3 cursor-pointer hover:scale-102"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>New Scan</span>
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
