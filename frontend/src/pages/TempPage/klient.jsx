import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { api } from '../../api';
import { baseOptions, chartDataset, colors, fmt, horizontalOptions } from '../../libCharts';

export default function RevenuePage() {
  const [cargoAnnual, setCargoAnnual] = useState([]);
  const [traffic, setTraffic] = useState([]);
  const [delta, setDelta] = useState([]);
  const [year, setYear] = useState(2036);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.revenueCargo(), api.traffic(), api.deltaCargo()])
      .then(([cargo, trafficRows, deltaRows]) => {
        if (cancelled) return;
        setCargoAnnual(cargo || []);
        setTraffic(trafficRows || []);
        setDelta(deltaRows || []);
        if (cargo?.length) setYear(Math.max(...cargo.map((r) => Number(r.year))));
        setStatus('connected');
      })
      .catch((err) => { setStatus('error'); setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  const years = useMemo(() => [...new Set(cargoAnnual.map((r) => Number(r.year)))].sort((a, b) => a - b), [cargoAnnual]);
  const cargos = useMemo(() => [...new Set(cargoAnnual.map((r) => r.cargo))], [cargoAnnual]);
  const selected = cargoAnnual.filter((r) => Number(r.year) === Number(year)).sort((a,b) => Number(b.revenue_bln_rub) - Number(a.revenue_bln_rub));
  const totalRevenue = selected.reduce((s,r)=>s+Number(r.revenue_bln_rub||0),0);
  const topCargo = selected.find((r) => r.cargo !== 'Остальные грузы') || selected[0] || {};

  const stackedRevenue = useMemo(() => ({
    labels: years,
    datasets: cargos.map((cargo, i) => ({
      label: cargo,
      data: years.map((y) => Number(cargoAnnual.find((r) => r.cargo === cargo && Number(r.year) === y)?.revenue_bln_rub || 0)),
      backgroundColor: colors[i % colors.length],
      borderWidth: 0,
      borderRadius: 3,
    })),
  }), [years, cargos, cargoAnnual]);

  const stackedOptions = useMemo(() => ({
    ...baseOptions('млрд ₽'),
    plugins: { ...baseOptions('млрд ₽').plugins, legend: { position: 'top', labels: { boxWidth: 12, font: { size: 12 } } } },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(148, 163, 184, .22)' }, title: { display: true, text: 'млрд ₽' } },
    },
  }), []);

  const revenueTrend = useMemo(() => ({
    labels: years,
    datasets: cargos.slice(0, 9).map((cargo, i) => chartDataset(cargo, years.map((y) => Number(cargoAnnual.find((r) => r.cargo === cargo && Number(r.year) === y)?.revenue_bln_rub || 0)), i, { pointRadius: 2 })),
  }), [years, cargos, cargoAnnual]);

  const selectedRevenue = useMemo(() => ({
    labels: selected.map((r)=>r.cargo),
    datasets: [{ label: 'Доход', data: selected.map((r)=>Number(r.revenue_bln_rub||0)), backgroundColor: selected.map((_, i) => colors[i % colors.length]), borderRadius: 8 }],
  }), [selected]);

  const deltaRows = useMemo(() => {
    if (delta.length) return [...delta].sort((a,b)=>Number(a.delta_2036_2026)-Number(b.delta_2036_2026));
    const byCargo = cargos.map((cargo) => {
      const first = cargoAnnual.find((r)=>r.cargo===cargo && Number(r.year)===years[0]);
      const last = cargoAnnual.find((r)=>r.cargo===cargo && Number(r.year)===years.at(-1));
      return { cargo, delta_2036_2026: Number(last?.revenue_bln_rub||0)-Number(first?.revenue_bln_rub||0) };
    });
    return byCargo.sort((a,b)=>Number(a.delta_2036_2026)-Number(b.delta_2036_2026));
  }, [delta, cargoAnnual, cargos, years]);

  const deltaChart = useMemo(() => ({
    labels: deltaRows.map((r)=>r.cargo),
    datasets: [{ label: 'Изменение 2036 к 2026', data: deltaRows.map((r)=>Number(r.delta_2036_2026||0)), backgroundColor: deltaRows.map((r)=>Number(r.delta_2036_2026)>=0 ? '#16a34a' : '#dc2626'), borderRadius: 8 }],
  }), [deltaRows]);

  const trafficRows = traffic.filter((r)=>Number(r.year)===Number(year)).sort((a,b)=>Number(b.revenue_bln_rub)-Number(a.revenue_bln_rub));
  const trafficChart = useMemo(() => ({
    labels: trafficRows.map((r)=>r.traffic_type),
    datasets: [{ label: 'Доход', data: trafficRows.map((r)=>Number(r.revenue_bln_rub||0)), backgroundColor: trafficRows.map((_, i) => colors[i % colors.length]), borderRadius: 8 }],
  }), [trafficRows]);

  if (status === 'loading') return <div className="analytics-card"><h2>Загружаю данные из backend...</h2></div>;
  if (status === 'error') return <div className="analytics-card"><h2>Backend не отвечает</h2><p>Запусти backend: `cd backend` → `python run.py`.</p><small>{error}</small></div>;

  return (
    <div className="analytics-page compact-page">
      <section className="analytics-kpis three-kpis">
        <article className="analytics-kpi"><span>Доход Base в {year}</span><strong>{fmt(totalRevenue)} млрд ₽</strong><small>по грузовым категориям</small></article>
        <article className="analytics-kpi"><span>Главный источник</span><strong>{topCargo.cargo || '—'}</strong><small>{fmt(topCargo.revenue_bln_rub)} млрд ₽</small></article>
        <article className="analytics-kpi"><span>Период</span><strong>2026–2036</strong><small>Base-сценарий</small></article>
      </section>

      <section className="analytics-grid one">
        <article className="analytics-card chart-card xl">
          <div className="analytics-card-head"><div><span>Структура</span><h2>Структура доходов по грузам (Base)</h2></div></div>
          <div className="chart-box tall"><Bar data={stackedRevenue} options={stackedOptions} /></div>
        </article>
      </section>

      <section className="analytics-grid one">
        <article className="analytics-card chart-card xl"><div className="analytics-card-head"><div><span>Динамика</span><h2>Доходы по грузам, 2026–2036</h2></div></div><div className="chart-box tall"><Line data={revenueTrend} options={baseOptions('млрд ₽')} /></div></article>
      </section>

      <section className="analytics-grid two equal">
        <article className="analytics-card chart-card"><div className="analytics-card-head"><div><span>Изменение</span><h2>Вклад грузов в изменение дохода</h2></div></div><div className="chart-box"><Bar data={deltaChart} options={horizontalOptions('млрд ₽')} /></div></article>
        <article className="analytics-card chart-card"><div className="analytics-card-head"><div><span>Вид перевозки</span><h2>Доходы по видам перевозки, {year}</h2></div></div><div className="chart-box"><Bar data={trafficChart} options={horizontalOptions('млрд ₽')} /></div></article>
      </section>
    </div>
  );
}
