import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { api } from '../../api';
import { baseOptions, chartDataset, colors, fmt } from '../../libCharts';

const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

export default function VolumesPage() {
  const [cargoAnnual, setCargoAnnual] = useState([]);
  const [totalAnnual, setTotalAnnual] = useState([]);
  const [totalMonthly, setTotalMonthly] = useState([]);
  const [year, setYear] = useState(2036);
  const [monthYear, setMonthYear] = useState(2036);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.volumesAnnual(), api.totalAnnualExtended(), api.totalMonthly()])
      .then(([cargo, total, monthly]) => {
        if (cancelled) return;
        setCargoAnnual(cargo || []);
        setTotalAnnual(total || []);
        setTotalMonthly(monthly || []);
        if (cargo?.length) {
          const maxYear = Math.max(...cargo.map((r) => Number(r.year)));
          setYear(maxYear);
          setMonthYear(maxYear);
        }
        setStatus('connected');
      })
      .catch((err) => { setStatus('error'); setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  const years = useMemo(() => [...new Set(cargoAnnual.map((r) => Number(r.year)))].sort((a, b) => a - b), [cargoAnnual]);
  const cargos = useMemo(() => [...new Set(cargoAnnual.map((r) => r.cargo))], [cargoAnnual]);
  const selected = cargoAnnual.filter((r) => Number(r.year) === Number(year)).sort((a,b) => Number(b.forecast_mln_t || 0) - Number(a.forecast_mln_t || 0));
  const totalVolume2036 = cargoAnnual.filter((r) => Number(r.year) === 2036).reduce((s, r) => s + Number(r.forecast_mln_t || 0), 0);
  const largestCargo = selected[0] || {};

  const totalTrend = useMemo(() => ({
    labels: totalAnnual.map((r) => r.year),
    datasets: [
      chartDataset('Общий объем', totalAnnual.map((r) => Number(r.volume_mln_t || 0)), 0, { borderWidth: 3, backgroundColor: 'rgba(37,99,235,.10)' }),
    ],
  }), [totalAnnual]);

  const cargoTrend = useMemo(() => ({
    labels: years,
    datasets: cargos.slice(0, 9).map((cargo, i) => chartDataset(cargo, years.map((y) => Number(cargoAnnual.find((r) => r.cargo === cargo && Number(r.year) === y)?.forecast_mln_t || 0)), i, { pointRadius: 2 })),
  }), [years, cargos, cargoAnnual]);

  const monthlyRows = useMemo(() => totalMonthly
    .filter((r) => Number(String(r.ds).slice(0, 4)) === Number(monthYear))
    .sort((a, b) => String(a.ds).localeCompare(String(b.ds))), [totalMonthly, monthYear]);

  const monthlyChart = useMemo(() => ({
    labels: monthlyRows.map((r) => monthNames[Number(String(r.ds).slice(5, 7)) - 1] || String(r.ds).slice(5, 7)),
    datasets: [{
      label: `Объем ${monthYear}`,
      data: monthlyRows.map((r) => Number(r.forecast_kt || 0) / 1000),
      backgroundColor: colors[0],
      borderRadius: 8,
    }],
  }), [monthlyRows, monthYear]);

  if (status === 'loading') return <div className="analytics-card"><h2>Загружаю данные из backend...</h2></div>;
  if (status === 'error') return <div className="analytics-card"><h2>Backend не отвечает</h2><p>Запусти backend: `cd backend` → `python run.py`.</p><small>{error}</small></div>;

  return (
    <div className="analytics-page compact-page">
      <section className="analytics-kpis three-kpis">
        <article className="analytics-kpi"><span>Объем в 2036</span><strong>{fmt(totalVolume2036)} млн т</strong><small>сумма по грузовым категориям</small></article>
        <article className="analytics-kpi"><span>Крупнейший груз</span><strong>{largestCargo.cargo || '—'}</strong><small>{fmt(largestCargo.forecast_mln_t)} млн т в {year}</small></article>
        <article className="analytics-kpi"><span>Период прогноза</span><strong>2026–2036</strong><small>помесячная детализация</small></article>
      </section>

      <section className="analytics-grid one">
        <article className="analytics-card chart-card xl">
          <div className="analytics-card-head"><div><span>Общий объем</span><h2>Динамика общего объема 2018–2036</h2></div></div>
          <div className="chart-box tall"><Line data={totalTrend} options={baseOptions('млн т')} /></div>
        </article>
      </section>

      <section className="analytics-grid one">
        <article className="analytics-card chart-card xl">
          <div className="analytics-card-head"><div><span>По родам грузов</span><h2>Прогноз объемов по грузам</h2></div></div>
          <div className="chart-box tall"><Line data={cargoTrend} options={baseOptions('млн т')} /></div>
        </article>
      </section>

      <section className="analytics-grid one">
        <article className="analytics-card chart-card">
          <div className="analytics-card-head compact"><div><span>Сезонность</span><h2>Месячный прогноз общего объема</h2></div><select value={monthYear} onChange={(e) => setMonthYear(Number(e.target.value))}>{years.map((y) => <option key={y}>{y}</option>)}</select></div>
          <div className="chart-box"><Bar data={monthlyChart} options={baseOptions('млн т')} /></div>
        </article>
      </section>
    </div>
  );
}
