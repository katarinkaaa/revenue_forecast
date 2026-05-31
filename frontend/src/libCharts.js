import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const palette = ['#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#7c3aed', '#0891b2', '#be123c', '#64748b', '#0f766e', '#9333ea', '#475569'];

export const colors = palette;

export const fmt = (value, digits = 1) => new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
}).format(Number(value || 0));

export const baseOptions = (unit = '') => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } } },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label || ctx.label}: ${fmt(ctx.parsed.y ?? ctx.parsed, 1)}${unit ? ` ${unit}` : ''}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
    y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, .22)' }, ticks: { callback: (v) => fmt(v, 0) } },
  },
});

export const horizontalOptions = (unit = '') => ({
  ...baseOptions(unit),
  indexAxis: 'y',
  plugins: {
    ...baseOptions(unit).plugins,
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label || ctx.label}: ${fmt(ctx.parsed.x ?? ctx.parsed, 1)}${unit ? ` ${unit}` : ''}`,
      },
    },
  },
  scales: {
    x: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, .22)' }, title: { display: Boolean(unit), text: unit }, ticks: { callback: (v) => fmt(v, 0) } },
    y: { grid: { display: false }, ticks: { autoSkip: false } },
  },
});

export const chartDataset = (label, data, index = 0, extra = {}) => ({
  label,
  data,
  borderColor: palette[index % palette.length],
  backgroundColor: palette[index % palette.length] + '33',
  pointRadius: 3,
  tension: .32,
  borderWidth: 2,
  ...extra,
});

export const valueLabelsPlugin = {
  id: 'valueLabels',
  afterDatasetsDraw(chart, _args, opts = {}) {
    const { ctx } = chart;
    ctx.save();
    ctx.font = opts.font || '700 11px Inter, system-ui, sans-serif';
    ctx.fillStyle = opts.color || '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const suffix = opts.suffix || '';
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar, index) => {
        const raw = dataset.data[index];
        if (raw === null || raw === undefined || Number.isNaN(Number(raw))) return;
        const text = `${fmt(raw, opts.digits ?? 1)}${suffix}`;
        ctx.fillText(text, bar.x, bar.y - 6);
      });
    });
    ctx.restore();
  },
};
