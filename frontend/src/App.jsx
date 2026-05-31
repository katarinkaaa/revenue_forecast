import { NavLink, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import RouteVisualization from './components/RouteVisualization';
import CalculationPage from './components/CalculationPage';
import './App.css';
import RevenuePage from './pages/TempPage/klient';
import Dash from './pages/TempPage/dash';
import VolumesPage from './pages/TempPage/alya';

const navItems = [
  { to: '/', label: 'Дашборд', description: 'Общая сводка' },
  { to: '/volumes', label: 'Прогноз объемов', description: 'Грузы и динамика' },
  { to: '/revenue', label: 'Доходы по грузам', description: 'Детализация прибыли' },
  { to: '/map', label: 'Карта маршрутов', description: 'Сеть и направления' },
  { to: '/what-if', label: 'Что если', description: 'Изменение тарифов' },
];

const pageMeta = {
  '/': ['Дашборд', 'Главная сводка прогноза объемов и доходов РЖД от грузоперевозок до 2036 года'],
  '/volumes': ['Прогноз объемов грузов', 'Динамика общего объема, структура по родам грузов и качество прогноза'],
  '/revenue': ['Детализированная прибыль от грузов', 'Структура доходов, вклад грузов в изменение выручки и концентрация по категориям'],
  '/map': ['Карта маршрутов', 'Ключевые узлы и направления грузовой сети на OpenStreetMap'],
  '/what-if': ['Сценарий «что если»', 'Интерактивный расчет влияния тарифов, объема и коэффициентов на доход'],
};

function AppShell({ children }) {
  const location = useLocation();
  const [title, subtitle] = pageMeta[location.pathname] || pageMeta['/'];

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <NavLink to="/" className="app-logo" aria-label="На главную">
          <span className="app-logo-mark">РЖД</span>
          <span>
            <strong>Прогноз доходов</strong>
            <small>грузоперевозки 2026–2036</small>
          </span>
        </NavLink>

        <nav className="app-nav" aria-label="Основная навигация">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
            >
              <span className="app-nav-text">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <span>Base-сценарий 2036</span>
          <strong>545,5 млрд ₽</strong>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div>
            <p className="app-eyebrow">РЖД · прогнозная модель</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </header>
        <section className="app-content">{children}</section>
      </main>
    </div>
  );
}

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dash />} />
        <Route path="/volumes" element={<VolumesPage />} />
        <Route path="/revenue" element={<RevenuePage />} />
        <Route path="/map" element={<RouteVisualization />} />
        <Route path="/what-if" element={<CalculationPage />} />
        <Route path="/cl" element={<Navigate to="/revenue" replace />} />
        <Route path="/aleksandra" element={<Navigate to="/volumes" replace />} />
        <Route path="/formula" element={<Navigate to="/what-if" replace />} />
        <Route path="/calculation" element={<Navigate to="/what-if" replace />} />
      </Routes>
    </AppShell>
  );
}

export default App;
