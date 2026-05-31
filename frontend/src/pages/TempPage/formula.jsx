import React, { useState } from 'react';

const RailwayTariffCalculator = () => {
  // Базовые ставки для схемы И1 (крытый вагон общего парка)
  const BASE_RATES = {
    aInitial: 18169,
    bPerTon: 0.2880,
    bConst: 69.165,
    aWagon: 8991,
    bWagon: 8.803,
    emptyRunRate: 7.1881
  };

  // Состояния для входных параметров
  const [distance, setDistance] = useState(1000);
  const [weight, setWeight] = useState(60);
  const [tariffClass, setTariffClass] = useState(2);
  const [routeCoeff, setRouteCoeff] = useState(1.0);
  const [specialCoeff, setSpecialCoeff] = useState(1.0);
  const [trainTypeCoeff, setTrainTypeCoeff] = useState(1.0);
  const [axles, setAxles] = useState(4);
  const [inflationCoeff, setInflationCoeff] = useState(1.0);

  // Состояния для отображения секций
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Коэффициент KL
  const calculateKL = (L) => {
    if (L <= 160) return 1.23;
    if (L >= 3000) return 0.87;
    return 1.041 - 0.00006 * L + 31 / L;
  };

  // Коэффициент тарифного класса K2
  const getClassCoeff = (classNum, L) => {
    if (classNum === 1) {
      if (L <= 1200) return 0.75;
      if (L <= 1400) return 0.74;
      if (L <= 1600) return 0.73;
      if (L <= 1800) return 0.72;
      if (L <= 2000) return 0.71;
      if (L <= 2200) return 0.70;
      if (L <= 2400) return 0.69;
      if (L <= 2600) return 0.68;
      if (L <= 2800) return 0.67;
      if (L <= 3000) return 0.66;
      if (L <= 3200) return 0.65;
      if (L <= 3400) return 0.64;
      if (L <= 3600) return 0.63;
      if (L <= 3800) return 0.62;
      if (L <= 4000) return 0.61;
      if (L <= 4200) return 0.60;
      if (L <= 4400) return 0.59;
      if (L <= 4600) return 0.58;
      if (L <= 4800) return 0.57;
      if (L <= 5000) return 0.56;
      return 0.55;
    }
    if (classNum === 2) return 1.0;
    if (classNum === 3) return 1.54;
    return 1.0;
  };

  const KL = calculateKL(distance);
  const classCoeff = getClassCoeff(tariffClass, distance);

  // Расчёты
  const tariffInfra = BASE_RATES.aInitial + 
    (BASE_RATES.bConst + BASE_RATES.bPerTon * weight) * KL * distance;
  const totalTariffInfra = tariffInfra * classCoeff * routeCoeff * specialCoeff * trainTypeCoeff;
  const tariffWagon = BASE_RATES.aWagon + BASE_RATES.bWagon * KL * distance;
  const emptyRunDistance = distance * 0.6;
  const tariffEmptyRun = BASE_RATES.emptyRunRate * axles * emptyRunDistance * routeCoeff * trainTypeCoeff;
  
  const totalTariffBase = totalTariffInfra + tariffWagon + tariffEmptyRun;
  const totalTariff = totalTariffBase * inflationCoeff;

  // Форматирование
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  // Иконка стрелки
  const ChevronIcon = ({ expanded }) => (
    <svg 
      style={{ 
        width: '16px', 
        height: '16px', 
        transition: 'transform 0.2s',
        transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
        display: 'inline-block'
      }} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );

  const styles = {
    page: {
      minHeight: '100%',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      color: '#1e293b',
      lineHeight: '1.6'
    },
    container: {
      width: '100%',
      maxWidth: '1180px',
      margin: '0 auto',
      padding: '48px 24px 72px'
    },
    header: {
      marginBottom: '48px',
      textAlign: 'left'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '12px',
      letterSpacing: '-0.02em'
    },
    subtitle: {
      fontSize: '1rem',
      color: '#64748b',
      fontWeight: '400',
      maxWidth: '600px'
    },
    formulaCard: {
      background: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
      marginBottom: '32px'
    },
    formulaHeader: {
      padding: '20px 32px',
      background: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer'
    },
    formulaTitle: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#475569',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    toggleBtn: {
      fontSize: '0.8125rem',
      fontWeight: '600',
      color: '#1e3a8a',
      background: 'none',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background 0.15s'
    },
    formulaBody: {
      padding: '24px 32px',
      background: '#ffffff'
    },
    formulaBlock: {
      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
      fontSize: '0.875rem',
      color: '#334155',
      lineHeight: '2',
      background: '#f8fafc',
      padding: '20px',
      borderRadius: '10px',
      border: '1px solid #e2e8f0'
    },
    controlPanel: {
      background: '#ffffff',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '32px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)'
    },
    sectionTitle: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#475569',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: '1px solid #f1f5f9',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '32px'
    },
    formGroup: {
      marginBottom: '24px'
    },
    label: {
      display: 'block',
      fontSize: '0.8125rem',
      fontWeight: '600',
      color: '#334155',
      marginBottom: '10px',
      letterSpacing: '0.02em'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '0.9375rem',
      border: '1px solid #cbd5e1',
      borderRadius: '10px',
      background: '#ffffff',
      color: '#0f172a',
      outline: 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '0.9375rem',
      border: '1px solid #cbd5e1',
      borderRadius: '10px',
      background: '#ffffff',
      color: '#0f172a',
      outline: 'none',
      cursor: 'pointer',
      boxSizing: 'border-box'
    },
    helper: {
      fontSize: '0.75rem',
      color: '#94a3b8',
      marginTop: '6px',
      lineHeight: '1.4'
    },
    infoCard: {
      background: '#f8fafc',
      borderRadius: '12px',
      padding: '16px',
      marginTop: '12px',
      border: '1px solid #e2e8f0'
    },
    infoLabel: {
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#475569',
      marginBottom: '6px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    infoValue: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: '#1e3a8a'
    },
    infoFormula: {
      fontSize: '0.7rem',
      color: '#64748b',
      marginTop: '4px',
      fontFamily: 'ui-monospace, SFMono-Regular, monospace'
    },
    inflationHighlight: {
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      border: '1px solid #f59e0b',
      borderRadius: '10px',
      padding: '12px 16px',
      marginTop: '12px'
    },
    inflationLabel: {
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#92400e',
      marginBottom: '6px'
    },
    inflationValue: {
      fontSize: '1rem',
      fontWeight: '700',
      color: '#b45309'
    },
    resultCard: {
      background: '#ffffff',
      borderRadius: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
      marginBottom: '32px'
    },
    resultHeader: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '24px 32px'
    },
    resultTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    resultBody: {
      padding: '32px'
    },
    kpiGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
      marginBottom: '32px'
    },
    kpiCard: {
      background: '#f8fafc',
      borderRadius: '14px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      textAlign: 'center'
    },
    kpiLabel: {
      fontSize: '0.75rem',
      color: '#475569',
      fontWeight: '600',
      marginBottom: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    kpiValue: {
      fontSize: '1.5rem',
      fontWeight: '800',
      color: '#0f172a',
      lineHeight: '1.2',
      marginBottom: '6px'
    },
    kpiNote: {
      fontSize: '0.7rem',
      color: '#94a3b8',
      marginTop: '8px'
    },
    totalCard: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderRadius: '14px',
      padding: '24px',
      textAlign: 'center'
    },
    totalLabel: {
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#94a3b8',
      marginBottom: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    totalValue: {
      fontSize: '1.75rem',
      fontWeight: '800',
      color: '#ffffff',
      lineHeight: '1.2'
    },
    totalNote: {
      fontSize: '0.7rem',
      color: '#cbd5e1',
      marginTop: '8px'
    },
    detailsBtn: {
      fontSize: '0.875rem',
      color: '#1e3a8a',
      fontWeight: '600',
      background: 'none',
      border: 'none',
      padding: '0',
      cursor: 'pointer',
      textAlign: 'left',
      marginBottom: '16px',
      transition: 'color 0.15s'
    },
    detailsContent: {
      background: '#f8fafc',
      borderRadius: '10px',
      padding: '20px',
      fontSize: '0.75rem',
      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
      color: '#334155',
      lineHeight: '1.8',
      overflowX: 'auto'
    },
    footer: {
      marginTop: '24px',
      paddingTop: '20px',
      borderTop: '1px solid #e2e8f0',
      fontSize: '0.75rem',
      color: '#64748b',
      lineHeight: '1.6'
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        
        {/* Заголовок */}
        <header style={styles.header}>
          <h1 style={styles.title}>Калькулятор дохода РЖД от грузовых перевозок</h1>
          <p style={styles.subtitle}>
            Расчёт на основе Приказа ФАС России № 894/25 (Тарифное руководство № 1). 
            Учитывает инфляционную корректировку.
          </p>
        </header>

        {/* Сворачиваемый блок с формулой */}
        <div style={styles.formulaCard}>
          <div 
            style={styles.formulaHeader}
            onClick={() => setIsFormulaOpen(!isFormulaOpen)}
          >
            <div style={styles.formulaTitle}>
              Формула расчёта
              <ChevronIcon expanded={isFormulaOpen} />
            </div>
            <button 
              style={styles.toggleBtn}
              onClick={(e) => { e.stopPropagation(); setIsFormulaOpen(!isFormulaOpen); }}
              onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              {isFormulaOpen ? 'Свернуть' : 'Развернуть'}
            </button>
          </div>
          
          {isFormulaOpen && (
            <div style={styles.formulaBody}>
              <div style={styles.formulaBlock}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Доход РЖД = (Тариф_И + Тариф_В + Тариф_порожний) × K_инфляция</strong>
                </div>
                <div style={{ marginBottom: '4px' }}>
                  Тариф_И = [A + (B_const + B_т × P) × KL × L] × K_класс × K_напр × K_спец × K_марш
                </div>
                <div style={{ marginBottom: '4px' }}>
                  Тариф_В = (A_в + B_в × KL × L)
                </div>
                <div>
                  Тариф_порожний = Ставка_ось × N_осей × (L × 0,6) × K_напр × K_марш
                </div>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b' }}>
                  <div>Параметры: A=18 169 ₽/ваг, B_const=69,165, B_т=0,2880, A_в=8 991 ₽/ваг, B_в=8,803 ₽/вагоно-км</div>
                  <div style={{ marginTop: '4px' }}>KL — коэффициент дальности, K_инфляция — пользовательский коэффициент индексации</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Панель управления */}
        <div style={styles.controlPanel}>
          <div style={styles.sectionTitle}>Параметры расчёта</div>
          
          <div style={styles.grid}>
            {/* Левая колонка */}
            <div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Расстояние перевозки (L), км</label>
                <input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  style={styles.input}
                  onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
                <p style={styles.helper}>Расстояние от станции отправления до станции назначения</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Масса груза (P), тонн</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  style={styles.input}
                  onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
                <p style={styles.helper}>Общая масса груза, размещённого в вагоне</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Тарифный класс груза</label>
                <select
                  value={tariffClass}
                  onChange={(e) => setTariffClass(Number(e.target.value))}
                  style={styles.select}
                >
                  <option value={1}>1-й класс: уголь, руда, стройматериалы (коэф. 0,55–0,75)</option>
                  <option value={2}>2-й класс: нефть, зерно, лес (коэф. 1,0)</option>
                  <option value={3}>3-й класс: химия, автомобили, металлы (коэф. 1,54–1,74)</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Количество осей вагона</label>
                <select
                  value={axles}
                  onChange={(e) => setAxles(Number(e.target.value))}
                  style={styles.select}
                >
                  <option value={4}>4-осный (стандартный)</option>
                  <option value={6}>6-осный</option>
                  <option value={8}>8-осный</option>
                </select>
                <p style={styles.helper}>Влияет на расчёт стоимости порожнего пробега</p>
              </div>
            </div>

            {/* Правая колонка */}
            <div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Коэффициент направления (K_напр)</label>
                <input
                  type="number"
                  step="0.01"
                  value={routeCoeff}
                  onChange={(e) => setRouteCoeff(Number(e.target.value))}
                  style={styles.input}
                  onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
                <p style={styles.helper}>Таблица №3. Калининградская ж/д: 0,27–0,93. Стандарт: 1,0</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Коэффициент для отдельных грузов (K_спец)</label>
                <input
                  type="number"
                  step="0.01"
                  value={specialCoeff}
                  onChange={(e) => setSpecialCoeff(Number(e.target.value))}
                  style={styles.input}
                  onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
                <p style={styles.helper}>Таблица №4. Удобрения: 0,357, уголь: 0,4–0,895. Стандарт: 1,0</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Коэффициент технологии перевозки (K_марш)</label>
                <select
                  value={trainTypeCoeff}
                  onChange={(e) => setTrainTypeCoeff(Number(e.target.value))}
                  style={styles.select}
                >
                  <option value={1.0}>Повагонная отправка (1 вагон) — 1,0</option>
                  <option value={0.97}>Групповая отправка (6–20 вагонов) — 0,97</option>
                  <option value={0.95}>Отправительский маршрут — 0,85–0,95</option>
                  <option value={1.08}>Повагонная (до 510 км) — 1,08</option>
                </select>
                <p style={styles.helper}>Таблица №5. Скидка до 15% для маршрутных отправок</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Коэффициент инфляции (индексация)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inflationCoeff}
                  onChange={(e) => setInflationCoeff(Number(e.target.value))}
                  style={styles.input}
                  onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
                <p style={styles.helper}>Коэффициент для индексации тарифа (1,0 — без индексации, 1,12 — +12%)</p>
                
                <div style={styles.inflationHighlight}>
                  <div style={styles.inflationLabel}>Применяемая индексация</div>
                  <div style={styles.inflationValue}>
                    {inflationCoeff === 1.0 ? 'Без индексации' : 
                     inflationCoeff > 1 ? `+${((inflationCoeff - 1) * 100).toFixed(1)}%` : 
                     `${((1 - inflationCoeff) * 100).toFixed(1)}% снижение`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KL коэффициент */}
          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Коэффициент дальности (KL)</div>
            <div style={styles.infoValue}>{KL.toFixed(4)}</div>
            <div style={styles.infoFormula}>
              KL = 1,041 − 0,00006×L + 31/L (при 160 &lt; L &lt; 3000 км)
            </div>
          </div>
        </div>

        {/* Результаты */}
        <div style={styles.resultCard}>
          <div style={styles.resultHeader}>
            <div style={styles.resultTitle}>Результат расчёта</div>
          </div>
          
          <div style={styles.resultBody}>
            <div style={styles.kpiGrid}>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>Тариф за инфраструктуру</div>
                <div style={styles.kpiValue}>{formatNumber(totalTariffInfra)} ₽</div>
                <div style={styles.kpiNote}>С учётом всех корректирующих коэффициентов</div>
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>Тариф за пользование вагоном</div>
                <div style={styles.kpiValue}>{formatNumber(tariffWagon)} ₽</div>
                <div style={styles.kpiNote}>Базовая ставка для крытого вагона</div>
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>Тариф за порожний пробег</div>
                <div style={styles.kpiValue}>{formatNumber(tariffEmptyRun)} ₽</div>
                <div style={styles.kpiNote}>60% от расстояния, стимулирование обратной загрузки</div>
              </div>
              <div style={styles.totalCard}>
                <div style={styles.totalLabel}>Итоговый доход РЖД с одного вагона</div>
                <div style={styles.totalValue}>{formatNumber(totalTariff)} ₽</div>
                <div style={styles.totalNote}>
                  Базовая сумма: {formatNumber(totalTariffBase)} ₽ × K_инфл: {inflationCoeff.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Детализация */}
            <button 
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              style={styles.detailsBtn}
              onMouseEnter={(e) => e.target.style.color = '#1e40af'}
              onMouseLeave={(e) => e.target.style.color = '#1e3a8a'}
            >
              {isDetailsOpen ? 'Скрыть детальный расчёт' : 'Показать детальный расчёт'}
            </button>
            
            {isDetailsOpen && (
              <div style={styles.detailsContent}>
                <div>KL = {KL.toFixed(4)} (расстояние: {distance} км)</div>
                <div>K_класс = {classCoeff} ({tariffClass}-й класс груза)</div>
                <div style={{ margin: '8px 0', borderTop: '1px dashed #cbd5e1' }} />
                <div>Тариф_И (базовый) = {BASE_RATES.aInitial.toLocaleString('ru-RU')} + ({BASE_RATES.bConst} + {BASE_RATES.bPerTon} × {weight}) × {KL.toFixed(4)} × {distance} = {tariffInfra.toFixed(2)}</div>
                <div>Тариф_И (итоговый) = {tariffInfra.toFixed(2)} × {classCoeff} × {routeCoeff} × {specialCoeff} × {trainTypeCoeff} = {totalTariffInfra.toFixed(2)} ₽</div>
                <div style={{ margin: '8px 0', borderTop: '1px dashed #cbd5e1' }} />
                <div>Тариф_В = {BASE_RATES.aWagon} + {BASE_RATES.bWagon} × {KL.toFixed(4)} × {distance} = {tariffWagon.toFixed(2)} ₽</div>
                <div style={{ margin: '8px 0', borderTop: '1px dashed #cbd5e1' }} />
                <div>Порожний пробег = {BASE_RATES.emptyRunRate} × {axles} × ({distance} × 0,6) × {routeCoeff} × {trainTypeCoeff} = {tariffEmptyRun.toFixed(2)} ₽</div>
                <div style={{ margin: '8px 0', borderTop: '1px dashed #cbd5e1' }} />
                <div>Базовая сумма = {totalTariffInfra.toFixed(2)} + {tariffWagon.toFixed(2)} + {tariffEmptyRun.toFixed(2)} = {totalTariffBase.toFixed(2)} ₽</div>
                <div><strong>Итого с индексацией = {totalTariffBase.toFixed(2)} × {inflationCoeff.toFixed(2)} = {totalTariff.toFixed(2)} ₽</strong></div>
              </div>
            )}

            {/* Дисклеймер */}
            <div style={styles.footer}>
              <div>Расчёт выполнен на основании Приказа ФАС России № 894/25 от 06.11.2025 г.</div>
              <div>Применена тарифная схема И1 и В3 для универсального крытого вагона общего парка.</div>
              <div>Фактическая стоимость перевозки может отличаться с учётом типа подвижного состава, габаритов груза, класса опасности и иных условий договора.</div>
              <div style={{ marginTop: '6px', fontStyle: 'italic' }}>Коэффициент инфляции применяется пользователем самостоятельно для прогнозирования тарифов в будущих периодах.</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RailwayTariffCalculator;