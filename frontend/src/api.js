const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`Backend API error ${response.status}: ${path}${message ? ` — ${message}` : ''}`);
  }
  return response.json();
}

const withParams = (path, params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
};

export const api = {
  health: () => request('/api/health'),
  dashboard: () => request('/api/dashboard'),
  cargo: (year) => request(withParams('/api/cargo', { year })),
  volumesAnnual: (year) => request(withParams('/api/volumes/annual', { year })),
  totalAnnualExtended: () => request('/api/volumes/total-annual-extended'),
  revenueCargo: (year) => request(withParams('/api/revenue/cargo', { year })),
  traffic: (year) => request(withParams('/api/traffic', { year })),
  deltaCargo: () => request('/api/delta-cargo'),
  topRoutes: (limit = 20) => request(withParams('/api/routes/top', { limit })),
  routeDetail: ({ year, cargo, limit = 500 } = {}) => request(withParams('/api/routes/detail', { year, cargo, limit })),
  routeNetwork: () => request('/api/routes/network'),
  scenarios: (year) => request(withParams('/api/scenarios', { year })),
  metrics: () => request('/api/metrics'),
  yearSummary: () => request('/api/year-summary'),
  totalMonthly: () => request('/api/forecast/total-monthly'),
  cargoMonthly: (cargo) => request(withParams('/api/forecast/cargo-monthly', { cargo })),
  cargoProfiles: () => request('/api/scenario/cargo-profiles'),
  scenarioCalculate: (params) => request(withParams('/api/scenario/calculate', params)),
  report: () => request('/api/report'),
};
