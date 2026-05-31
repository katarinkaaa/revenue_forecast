import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { api } from '../api';
import { baseOptions, chartDataset, colors, fmt, valueLabelsPlugin } from '../libCharts';
import './CalculationPage.css';

function Slider({ label, value, setValue, min, max, suffix }) {
  return <label className="whatif-field slider-field"><span>{label}<b>{value > 0 && suffix === '%' ? '+' : ''}{value}{suffix}</b></span><input type="range" min={min} max={max} value={value} onChange={(e) => setValue(Number(e.target.value))} /></label>;
}

export default function CalculationPage() {
  const [scenarioRows, setScenarioRows] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [cargo, setCargo] = useState('all');
  const [tariffChange, setTariffChange] = useState(5);
  const [volumeChange, setVolumeChange] = useState(0);
  const [exportShare, setExportShare] = useState(35);
  const [containerShare, setContainerShare] = useState(12);
  const [distanceChange, setDistanceChange] = useState(0);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.yearSummary(), api.cargoProfiles()])
      .then(([years, profilePayload]) => {
        if (cancelled) return;
        setScenarioRows(years || []);
        setProfiles(profilePayload?.profiles || []);
      })
      .catch((err) => { if (!cancelled) { setStatus('error'); setError(err.message); } });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api.scenarioCalculate({ cargo, tariff_change: tariffChange, volume_change: volumeChange, export_share: exportShare, container_share: containerShare, distance_change: distanceChange })
      .then((payload) => { if (!cancelled) { setResult(payload); setStatus('connected'); } })
      .catch((err) => { if (!cancelled) { setStatus('error'); setError(err.message); } });
    return () => { cancelled = true; };
  }, [cargo, tariffChange, volumeChange, exportShare, containerShare, distanceChange]);

  const stepRows = result?.steps || [];
  const factorChart = useMemo(() => ({
    labels: stepRows.map((r) => r.name),
    datasets: [{
      label: 'Доход сценария',
      data: stepRows.map((r) => Number(r.value || 0)),
      backgroundColor: stepRows.map((_, i) => colors[i % colors.length]),
      borderRadius: 8,
    }],
  }), [stepRows]);

  const factorOptions = useMemo(() => ({
    ...baseOptions('млрд ₽'),
    layout: { padding: { top: 22 } },
    plugins: { ...baseOptions('млрд ₽').plugins, legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 0 } },
      y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, .22)' }, title: { display: true, text: 'млрд ₽' } },
    },
  }), []);

  const scenarioChart = useMemo(() => ({
    labels: scenarioRows.map((r) => r.year),
    datasets: [
      chartDataset('Conservative', scenarioRows.map((r) => r.Conservative), 7),
      chartDataset('Base', scenarioRows.map((r) => r.Base), 0),
      chartDataset('Upside', scenarioRows.map((r) => r.Upside), 2),
    ],
  }), [scenarioRows]);

  if (status === 'error' && !result) return <div className="whatif-card"><h2>Backend не отвечает</h2><p>Запусти backend: `cd backend` → `python run.py`.</p><small>{error}</small></div>;

  return (
    <div className="whatif-page compact-page">
      <section className="whatif-grid">
        <article className="whatif-card controls-card">
          <div className="whatif-card-head"><span>Параметры</span><h2>Изменение тарифов</h2></div>
          <label className="whatif-field">Род груза<select value={cargo} onChange={(e) => setCargo(e.target.value)}>{profiles.map((profile) => <option key={profile.key} value={profile.key}>{profile.label}</option>)}</select></label>
          <Slider label="Изменение тарифа" value={tariffChange} setValue={setTariffChange} min={-20} max={30} suffix="%" />
          <Slider label="Изменение объема" value={volumeChange} setValue={setVolumeChange} min={-25} max={25} suffix="%" />
          <Slider label="Изменение средней дальности" value={distanceChange} setValue={setDistanceChange} min={-15} max={20} suffix="%" />
          <Slider label="Доля экспортных перевозок" value={exportShare} setValue={setExportShare} min={0} max={70} suffix="%" />
          <Slider label="Доля контейнеризации" value={containerShare} setValue={setContainerShare} min={0} max={45} suffix="%" />
        </article>

        <article className="whatif-card result-card">
          <div className="whatif-result-top"><span>Результат</span><strong>{result ? fmt(result.finalRevenue) : '—'} млрд ₽</strong><em className={Number(result?.delta || 0) >= 0 ? 'positive' : 'negative'}>{Number(result?.delta || 0) >= 0 ? '+' : ''}{fmt(result?.delta)} млрд ₽ к базе</em></div>
          <div className="whatif-metrics"><div><span>База</span><strong>{fmt(result?.baseRevenue)}</strong><small>млрд ₽</small></div><div><span>Множитель</span><strong>x{fmt(result?.multiplier, 2)}</strong><small>к Base</small></div><div><span>Эффект на сеть</span><strong>{fmt(result?.networkEffect)}</strong><small>млрд ₽</small></div><div><span>Год</span><strong>{result?.year || '—'}</strong><small>Base</small></div></div>
          <div className="chart-box"><Bar data={factorChart} options={factorOptions} plugins={[valueLabelsPlugin]} /></div>
        </article>
      </section>

      <section className="whatif-card chart-card"><div className="whatif-card-head"><span>Сценарии</span><h2>Исходный диапазон доходов</h2></div><div className="chart-box"><Line data={scenarioChart} options={baseOptions('млрд ₽')} /></div></section>
    </div>
  );
}
