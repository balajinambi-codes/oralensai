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
import { TrendingUp, Target } from 'lucide-react';

const MODEL_DATA = [
  { name: 'ResNet50', accuracy: 58.2, color: '#64748B' },
  { name: 'EfficientNet-B0', accuracy: 62.5, color: '#0EA5E9' },
  { name: 'EffNet-B0 + CBAM (Ours)', accuracy: 67.4, color: '#22C55E' },
];

const AUC_CARDS = [
  { label: 'Healthy AUC', value: 0.92, color: '#22C55E' },
  { label: 'OPMD AUC', value: 0.88, color: '#F59E0B' },
  { label: 'Oral Cancer AUC', value: 0.82, color: '#EF4444' },
];

const METRICS_ROWS = [
  { model: 'ResNet50', accuracy: '58.2%', precision: '57.1%', recall: '56.8%', f1: '56.9%' },
  { model: 'EfficientNet-B0', accuracy: '62.5%', precision: '61.8%', recall: '61.2%', f1: '61.0%' },
  { model: 'EfficientNet + CBAM (Ours)', accuracy: '67.4%', precision: '75.0%', recall: '67.4%', f1: '68.0%' },
];

export default function ModelPerformance() {
  return (
    <section id="performance" className="py-20 sm:py-28 bg-surface/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 text-primary">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Research Metrics</span>
          </div>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Model Performance</h2>
          <p className="mt-3 text-muted">Comparative evaluation on oral lesion dataset</p>
        </motion.div>

        {/* Model comparison chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 rounded-2xl border border-border bg-card p-6"
        >
          <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold">
            <Target className="h-5 w-5 text-primary" />
            Model Accuracy Comparison
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-[320px]">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={MODEL_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={{ stroke: '#1E3A5F' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[80, 100]}
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1E2A3A',
                      border: '1px solid #1E3A5F',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                    }}
                    formatter={(val) => [`${val}%`, 'Accuracy']}
                  />
                  <Bar dataKey="accuracy" radius={[8, 8, 0, 0]} barSize={60}>
                    {MODEL_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* AUC cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {AUC_CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 text-center"
            >
              <p className="text-sm font-medium text-muted">{card.label}</p>
              <p className="mt-2 font-display text-4xl font-bold" style={{ color: card.color }}>
                {card.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Metrics table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="px-6 py-4 font-semibold text-muted">Model</th>
                  <th className="px-6 py-4 font-semibold text-muted">Accuracy</th>
                  <th className="px-6 py-4 font-semibold text-muted">Precision</th>
                  <th className="px-6 py-4 font-semibold text-muted">Recall</th>
                  <th className="px-6 py-4 font-semibold text-muted">F1</th>
                </tr>
              </thead>
              <tbody>
                {METRICS_ROWS.map((row, i) => (
                  <tr
                    key={row.model}
                    className={`border-b border-border/50 ${i === METRICS_ROWS.length - 1 ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-6 py-4 font-medium">{row.model}</td>
                    <td className="px-6 py-4 text-primary">{row.accuracy}</td>
                    <td className="px-6 py-4">{row.precision}</td>
                    <td className="px-6 py-4">{row.recall}</td>
                    <td className="px-6 py-4">{row.f1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
