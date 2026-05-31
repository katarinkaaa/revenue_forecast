import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { api } from '../../api';
import { baseOptions, chartDataset, colors, fmt, horizontalOptions } from '../../libCharts';

const shortRoute = (route = '') => route
  .replaceAll('станция', '')
  .replaceAll('  ', ' ')
  .split(' -> ')
  .map((part) => part.trim().split(' ').slice(0, 2).join(' '))
  .join(' → ');

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } } },
    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${fmt(ctx.parsed, 1)} млрд ₽` } },
  },
};

export default function DashboardMainPage() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.dashboard()
      .then((payload) => { if (!cancelled) { setData(payload); setStatus('connected'); } })
      .catch((err) => { if (!cancelled) { setStatus('error'); setError(err.message); } });
    return () => { cancelled = true; };
  }, []);

  const rows = data?.years || [];
  const cargoAll = data?.cargo2036 || [];
  const topRoutes = data?.topRoutes2036 || [];
  const first = rows[0] || {};
  const last = rows.at(-1) || {};
  const current = rows.find((r) => Number(r.year) === 2026) || first;
  const routeTotal = topRoutes.reduce((s, x) => s + Number(x.revenue_base_bln_rub || 0), 0);
  const topRoute = topRoutes[0] || {};
  const cargoWithoutOther = cargoAll.filter((r) => r.cargo !== 'Остальные грузы' && Number(r.revenue_bln_rub || 0) > 0);

  const revenueChart = useMemo(() => ({
    labels: rows.map((r) => r.year),
    datasets: [chartDataset('Доход Base', rows.map((r) => Number(r.Base || 0)), 0, { borderWidth: 3, backgroundColor: 'rgba(37,99,235,.10)' })],
  }), [rows]);

  const topRoutesChart = useMemo(() => {
    const ordered = [...topRoutes].slice(0, 15).reverse();
    return {
      labels: ordered.map((r) => shortRoute(r.route)),
      datasets: [{
        label: 'Доход 2036',
        data: ordered.map((r) => Number(r.revenue_base_bln_rub || 0)),
        backgroundColor: ordered.map((_, i) => colors[i % colors.length]),
        borderRadius: 8,
      }],
    };
  }, [topRoutes]);

  const cargoDonut = useMemo(() => ({
    labels: cargoWithoutOther.map((r) => r.cargo),
    datasets: [{
      label: 'Доход 2036',
      data: cargoWithoutOther.map((r) => Number(r.revenue_bln_rub || 0)),
      backgroundColor: colors,
      borderWidth: 0,
    }],
  }), [cargoWithoutOther]);

  const volumeChart = useMemo(() => ({
    labels: rows.map((r) => r.year),
    datasets: [chartDataset('Объем перевозок', rows.map((r) => Number(r.network_volume_mln_t || 0)), 2, { borderWidth: 3, backgroundColor: 'rgba(22,163,74,.10)' })],
  }), [rows]);

  if (status === 'loading') return <div className="analytics-card"><h2>Загружаю данные из backend...</h2></div>;
  if (status === 'error' || !data) return <div className="analytics-card"><h2>Backend не отвечает</h2><p>Запусти backend: `cd backend` → `python run.py`.</p><small>{error}</small></div>;

  return (
    <div className="analytics-page compact-page">
      <section className="dash-kpis">
        <article className="dash-card dash-kpi"><span>Объем перевозок 2036</span><strong>{fmt(last.network_volume_mln_t)} млн т</strong><small>Base-прогноз общего объема</small></article>
        <article className="dash-card dash-kpi"><span>Прогноз на текущий год</span><strong>{fmt(current.Base)} млрд ₽</strong><small>{current.year}: доход Base</small></article>
        <article className="dash-card dash-kpi"><span>Доходы до 2036</span><strong>{fmt(last.Base)} млрд ₽</strong><small>итоговый Base-сценарий</small></article>
        <article className="dash-card dash-kpi"><span>Топ-15 маршрутов</span><strong>{fmt(routeTotal)} млрд ₽</strong><small>{fmt(topRoute.revenue_base_bln_rub)} млрд ₽ — крупнейший</small></article>
      </section>

      <section className="analytics-grid two">
        <article className="analytics-card chart-card large">
          <div className="analytics-card-head"><div><span>Доходы до 2036</span><h2>Динамика доходов Base</h2></div></div>
          <div className="chart-box"><Line data={revenueChart} options={baseOptions('млрд ₽')} /></div>
        </article>
        <article className="analytics-card chart-card">
          <div className="analytics-card-head"><div><span>Структура</span><h2>Доходы по грузам в 2036</h2></div></div>
          <div className="chart-box donut-box"><Doughnut data={cargoDonut} options={doughnutOptions} /></div>
        </article>
      </section>

      <section className="analytics-grid two">
        <article className="analytics-card chart-card xl">
          <div className="analytics-card-head"><div><span>Маршруты</span><h2>Топ-15 маршрутов по доходу в 2036</h2></div></div>
          <div className="chart-box tall"><Bar data={topRoutesChart} options={horizontalOptions('млрд ₽')} /></div>
        </article>
        <article className="analytics-card chart-card">
          <div className="analytics-card-head"><div><span>Объем перевозок</span><h2>Общий объем 2026–2036</h2></div></div>
          <div className="chart-box"><Line data={volumeChart} options={baseOptions('млн т')} /></div>
        </article>
      </section>
    </div>
  );
}
