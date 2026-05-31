import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import './RouteVisualization.css';

const cargoColor = {
  coal: '#334155', oil: '#7c3aed', containers: '#dc2626', grain: '#ca8a04', metals: '#64748b', timber: '#16a34a', fertilizers: '#0891b2',
};

const zoom = 4;
const tileSize = 256;
const tileUrl = (x, y) => `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;

function project(lon, lat) {
  const sin = Math.sin((lat * Math.PI) / 180);
  const x = ((lon + 180) / 360) * 2 ** zoom * tileSize;
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * 2 ** zoom * tileSize;
  return { x, y };
}

const mapBounds = {
  left: project(20, 70).x,
  top: project(20, 70).y,
  right: project(147, 41).x,
  bottom: project(147, 41).y,
};
mapBounds.width = mapBounds.right - mapBounds.left;
mapBounds.height = mapBounds.bottom - mapBounds.top;

function screenPoint(station) {
  const p = project(station.lon, station.lat);
  return { x: p.x - mapBounds.left, y: p.y - mapBounds.top };
}

const fmt = (v) => Number(v || 0).toLocaleString('ru-RU', { maximumFractionDigits: 1 });

export default function RouteVisualization() {
  const [filters, setFilters] = useState({ region: 'all', cargo: 'all', capacity: 0 });
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [network, setNetwork] = useState(null);
  const [topRoutes, setTopRoutes] = useState([]);
  const [apiStatus, setApiStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.routeNetwork(), api.topRoutes(5)])
      .then(([networkPayload, rows]) => {
        if (!cancelled) {
          setNetwork(networkPayload);
          setTopRoutes(rows || []);
          setApiStatus('connected');
        }
      })
      .catch((err) => { if (!cancelled) { setApiStatus('error'); setError(err.message); } });
    return () => { cancelled = true; };
  }, []);

  const stations = network?.stations || [];
  const routes = network?.routes || [];
  const cargoTypes = network?.cargoTypes || {};
  const regions = useMemo(() => [...new Set(stations.map((s) => s.region))], [stations]);
  const stationById = useMemo(() => Object.fromEntries(stations.map((s) => [s.id, s])), [stations]);

  const filteredStations = stations.filter((station) => {
    if (filters.region !== 'all' && station.region !== filters.region) return false;
    if (filters.cargo !== 'all' && !station.cargo.includes(filters.cargo)) return false;
    return true;
  });
  const visibleIds = new Set(filteredStations.map((s) => s.id));
  const filteredRoutes = routes.filter((route) => visibleIds.has(route.from) && visibleIds.has(route.to) && route.capacity >= filters.capacity);
  const totalVolume = filteredStations.reduce((sum, station) => sum + station.volume, 0);

  const tiles = [];
  const minTileX = Math.floor(mapBounds.left / tileSize);
  const maxTileX = Math.ceil(mapBounds.right / tileSize);
  const minTileY = Math.floor(mapBounds.top / tileSize);
  const maxTileY = Math.ceil(mapBounds.bottom / tileSize);
  for (let x = minTileX; x <= maxTileX; x += 1) {
    for (let y = minTileY; y <= maxTileY; y += 1) tiles.push({ x, y, px: x * tileSize - mapBounds.left, py: y * tileSize - mapBounds.top });
  }

  const activeRouteStations = selectedRoute ? [stationById[selectedRoute.from], stationById[selectedRoute.to]] : [];
  const activeObject = selectedRoute || selectedStation;

  if (apiStatus === 'loading') return <div className="map-panel"><h2>Загружаю карту из backend...</h2></div>;
  if (apiStatus === 'error' || !network) return <div className="map-panel"><h2>Backend не отвечает</h2><p>Запусти backend: `cd backend` → `python run.py`.</p><small>{error}</small></div>;

  return (
    <div className="route-map-page">
      <section className="map-toolbar">
        <label>Регион<select value={filters.region} onChange={(e) => setFilters({ ...filters, region: e.target.value })}><option value="all">Все регионы</option>{regions.map((region) => <option key={region} value={region}>{region}</option>)}</select></label>
        <label>Груз<select value={filters.cargo} onChange={(e) => setFilters({ ...filters, cargo: e.target.value })}><option value="all">Все грузы</option>{Object.entries(cargoTypes).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
        <label className="capacity-filter">Мин. пропускная способность: {filters.capacity} млн т/год<input type="range" min="0" max="100" step="10" value={filters.capacity} onChange={(e) => setFilters({ ...filters, capacity: Number(e.target.value) })} /></label>
        <button onClick={() => { setSelectedStation(null); setSelectedRoute(null); }}>Сбросить</button>
      </section>

      <section className="map-summary-row">
        <div><span>Узлы</span><strong>{filteredStations.length}</strong></div>
        <div><span>Маршруты</span><strong>{filteredRoutes.length}</strong></div>
        <div><span>Объем узлов</span><strong>{fmt(totalVolume)} млн т</strong></div>
        <div><span>Крупнейший маршрут</span><strong>{fmt(topRoutes[0]?.revenue_base_bln_rub)} млрд ₽</strong></div>
      </section>

      <section className="map-main-grid">
        <article className="real-map-card clean-map-card">
          <svg className="real-map" viewBox={`0 0 ${mapBounds.width} ${mapBounds.height}`} preserveAspectRatio="xMidYMid meet" aria-label="Карта маршрутов РЖД на OpenStreetMap">
            <g className="tile-layer">{tiles.map((tile) => <image key={`${tile.x}-${tile.y}`} href={tileUrl(tile.x, tile.y)} x={tile.px} y={tile.py} width={tileSize} height={tileSize} preserveAspectRatio="none" />)}</g>
            {filteredRoutes.map((route) => {
              const from = screenPoint(stationById[route.from]);
              const to = screenPoint(stationById[route.to]);
              const active = selectedRoute?.id === route.id;
              return <g key={route.id}><line className={`map-route ${route.type} ${active ? 'active' : ''}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} /><line className="map-route-hit" x1={from.x} y1={from.y} x2={to.x} y2={to.y} onClick={() => { setSelectedRoute(route); setSelectedStation(null); }} /></g>;
            })}
            {filteredStations.map((station) => {
              const point = screenPoint(station);
              const active = selectedStation?.id === station.id || activeRouteStations.some((s) => s?.id === station.id);
              return <g key={station.id} className={`map-station ${active ? 'active' : ''}`} transform={`translate(${point.x} ${point.y})`} onClick={() => { setSelectedStation(station); setSelectedRoute(null); }}><circle className="station-halo" r={Math.max(10, station.volume / 4)} /><circle className="station-dot" r={active ? 8 : 6} /><text x="10" y="-9">{station.name}</text></g>;
            })}
          </svg>
          <div className="map-legend-on-map"><strong>Линии</strong><span><i className="line-main" />Магистраль</span><span><i className="line-regional" />Региональная</span></div>
        </article>

        <aside className="map-details-card">
          <span>Детали</span>
          {selectedRoute ? (
            <>
              <h2>{stationById[selectedRoute.from].name} → {stationById[selectedRoute.to].name}</h2>
              <div className="map-detail-list"><div><small>Расстояние</small><strong>{selectedRoute.distance} км</strong></div><div><small>Пропускная способность</small><strong>{selectedRoute.capacity} млн т/год</strong></div><div><small>Тип</small><strong>{selectedRoute.type === 'main' ? 'Магистраль' : 'Региональная'}</strong></div></div>
            </>
          ) : selectedStation ? (
            <>
              <h2>{selectedStation.name}</h2>
              <p>{selectedStation.region} · {selectedStation.volume} млн т</p>
              <div className="map-tags">{selectedStation.cargo.map((cargo) => <i key={cargo} style={{ '--tag': cargoColor[cargo] }}>{cargoTypes[cargo]}</i>)}</div>
            </>
          ) : (
            <>
              <h2>Выберите станцию или линию</h2>
              <p>Все маршруты и точки отображаются на одной карте OpenStreetMap.</p>
            </>
          )}
          <div className="map-top-routes"><h3>Топ маршрутов</h3>{topRoutes.slice(0, 5).map((route) => <div key={`${route.route}-${route.cargo}`}><strong>{route.cargo}</strong><span>{route.route}</span><em>{fmt(route.revenue_base_bln_rub)} млрд ₽</em></div>)}</div>
        </aside>
      </section>
    </div>
  );
}
