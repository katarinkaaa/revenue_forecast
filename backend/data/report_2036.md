# РЖД: прогноз объема и расчет доходов до 2036

## Что сделано

- Прогноз выполнен по месяцам до декабря 2036, с валидацией 5 walk-forward сплитами.
- Модели сравнивались: GradBoost, RandomForest, Ridge, SARIMA, ETS.
- Доходы считаются по маршрутам из `Грузовая база - пример.xlsx` с масштабированием под прогнозные объемы по грузам.
- Тарифные коэффициенты собраны из `расчет тарифа.docx` (Тарифное руководство N1, приказ ФАС N 894/25).

## Ключевые выводы

- Base-доход в 2026: **881.8 млрд руб.**, в 2036: **545.5 млрд руб.**.
- Изменение 2036 к 2026: **-336.3 млрд руб.**.
- Лидер по доходу в 2036: **Остальные грузы** (175.9 млрд руб.).

## Годовой прогноз общего объема и доходов

| Год | Объем, млн т | Conservative | Base | Upside |
|---:|---:|---:|---:|---:|
| 2026 | 1086.0 | 821.2 | 881.8 | 972.1 |
| 2027 | 1042.6 | 788.3 | 846.5 | 933.2 |
| 2028 | 996.5 | 753.0 | 808.7 | 891.5 |
| 2029 | 945.3 | 714.2 | 767.0 | 845.5 |
| 2030 | 889.5 | 672.6 | 722.3 | 796.3 |
| 2031 | 829.1 | 628.4 | 674.8 | 743.9 |
| 2032 | 764.1 | 628.6 | 675.1 | 744.2 |
| 2033 | 694.5 | 572.4 | 614.7 | 677.7 |
| 2034 | 636.6 | 525.9 | 564.8 | 622.6 |
| 2035 | 623.4 | 515.5 | 553.6 | 610.2 |
| 2036 | 614.0 | 508.0 | 545.5 | 601.4 |

## Графики

![01_decomposition_total](charts/01_decomposition_total.png)

![02_walk_forward_total](charts/02_walk_forward_total.png)

![03_metrics_total](charts/03_metrics_total.png)

![04_residuals_total_best](charts/04_residuals_total_best.png)

![05_final_total_forecast_2026_2036](charts/05_final_total_forecast_2026_2036.png)

![06_volume_by_cargo_2026_2036](charts/06_volume_by_cargo_2026_2036.png)

![07_revenue_scenarios_2026_2036](charts/07_revenue_scenarios_2026_2036.png)

![08_revenue_structure_cargo](charts/08_revenue_structure_cargo.png)

![09_revenue_waterfall_2036_vs_2026](charts/09_revenue_waterfall_2036_vs_2026.png)

![10_revenue_pareto_2036](charts/10_revenue_pareto_2036.png)

![11_revenue_top_routes_2036](charts/11_revenue_top_routes_2036.png)

![12_revenue_traffic_mix](charts/12_revenue_traffic_mix.png)
