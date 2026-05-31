from pathlib import Path
from typing import Optional

import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

app = FastAPI(title="RZD Revenue Forecast API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/assets", StaticFiles(directory=DATA_DIR), name="assets")

_cache: dict[str, pd.DataFrame] = {}

def read_csv(name: str) -> pd.DataFrame:
    if name not in _cache:
        path = DATA_DIR / name
        if not path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {name}")
        _cache[name] = pd.read_csv(path)
    return _cache[name].copy()

def records(df: pd.DataFrame):
    df = df.replace([np.inf, -np.inf], np.nan)
    clean = df.astype(object).where(pd.notna(df), None)
    return clean.to_dict(orient="records")

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/dashboard")
def dashboard():
    year = read_csv("year_summary.csv").sort_values("year")
    cargo = read_csv("cargo_year.csv")
    routes = read_csv("top_routes_2036.csv")
    last_year = int(year["year"].max())
    first_year = int(year["year"].min())
    cargo_last = cargo[cargo["year"] == last_year].sort_values("revenue_bln_rub", ascending=False)
    top_routes = routes.sort_values("revenue_base_bln_rub", ascending=False).head(15)
    latest = year[year["year"] == last_year].iloc[0]
    first = year[year["year"] == first_year].iloc[0]
    return {
        "years": records(year),
        "cargo2036": records(cargo_last),
        "topRoutes2036": records(top_routes),
        "kpi": {
            "firstYear": first_year,
            "lastYear": last_year,
            "baseFirst": float(first["Base"]),
            "baseLast": float(latest["Base"]),
            "baseDelta": float(latest["Base"] - first["Base"]),
            "volumeLast": float(latest["network_volume_mln_t"]),
            "volumeDelta": float(latest["network_volume_mln_t"] - first["network_volume_mln_t"]),
            "conservativeLast": float(latest["Conservative"]),
            "upsideLast": float(latest["Upside"]),
            "topCargo": str(cargo_last.iloc[0]["cargo"]),
            "topCargoRevenue": float(cargo_last.iloc[0]["revenue_bln_rub"]),
            "topRoute": str(top_routes.iloc[0]["route"]) if not top_routes.empty else None,
            "topRouteRevenue": float(top_routes.iloc[0]["revenue_base_bln_rub"]) if not top_routes.empty else 0,
        },
    }

def normalize_cargo_year(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    # cargo_year.csv хранит физический объем в volume_mln_t, а страница объемов
    # ожидает forecast_mln_t. Даем оба имени, чтобы API был единым для фронта.
    if "forecast_mln_t" not in df.columns and "volume_mln_t" in df.columns:
        df["forecast_mln_t"] = df["volume_mln_t"]
    if "volume_mln_t" not in df.columns and "forecast_mln_t" in df.columns:
        df["volume_mln_t"] = df["forecast_mln_t"]
    if "revenue_bln_rub" not in df.columns:
        df["revenue_bln_rub"] = 0.0
    return df

@app.get("/api/cargo")
def cargo(year: Optional[int] = None):
    df = normalize_cargo_year(read_csv("cargo_year.csv"))
    if year is not None:
        df = df[df["year"] == year]
    return records(df.sort_values(["year", "revenue_bln_rub"], ascending=[True, False]))

@app.get("/api/volumes/annual")
def volumes_annual(year: Optional[int] = None):
    df = read_csv("forecast_cargo_annual_2026_2036.csv")
    if year is not None:
        df = df[df["year"] == year]
    return records(df.sort_values(["year", "forecast_mln_t"], ascending=[True, False]))


# Исторический общий объем нужен для страницы прогноза: 2018–2025 — факт,
# 2026–2036 — прогноз из модели. Значения факта приведены в млн тонн.
HISTORICAL_TOTAL_VOLUME = [
    {"year": 2018, "volume_mln_t": 1290.5, "type": "Факт"},
    {"year": 2019, "volume_mln_t": 1278.1, "type": "Факт"},
    {"year": 2020, "volume_mln_t": 1243.0, "type": "Факт"},
    {"year": 2021, "volume_mln_t": 1285.2, "type": "Факт"},
    {"year": 2022, "volume_mln_t": 1234.3, "type": "Факт"},
    {"year": 2023, "volume_mln_t": 1232.3, "type": "Факт"},
    {"year": 2024, "volume_mln_t": 1181.0, "type": "Факт"},
    {"year": 2025, "volume_mln_t": 1132.0, "type": "Факт"},
]

@app.get("/api/volumes/total-annual-extended")
def total_annual_extended():
    forecast = read_csv("forecast_total_annual_2026_2036.csv")
    rows = HISTORICAL_TOTAL_VOLUME + [
        {"year": int(r.year), "volume_mln_t": float(r.forecast_mln_t), "type": "Прогноз"}
        for r in forecast.sort_values("year").itertuples(index=False)
    ]
    return rows

@app.get("/api/revenue/cargo")
def revenue_cargo(year: Optional[int] = None):
    df = normalize_cargo_year(read_csv("cargo_year.csv"))
    if year is not None:
        df = df[df["year"] == year]
    return records(df.sort_values(["year", "revenue_bln_rub"], ascending=[True, False]))

@app.get("/api/traffic")
def traffic(year: Optional[int] = None):
    df = read_csv("traffic_year.csv")
    if year is not None:
        df = df[df["year"] == year]
    return records(df.sort_values(["year", "revenue_bln_rub"], ascending=[True, False]))


@app.get("/api/delta-cargo")
def delta_cargo():
    return records(read_csv("delta_cargo.csv"))

@app.get("/api/routes/top")
def top_routes(limit: int = 20):
    df = read_csv("top_routes_2036.csv").head(max(1, min(limit, 100)))
    return records(df)

@app.get("/api/routes/detail")
def route_detail(year: Optional[int] = None, cargo: Optional[str] = None, limit: int = 500):
    df = read_csv("route_detail_base.csv")
    if year is not None:
        df = df[df["year"] == year]
    if cargo:
        df = df[df["cargo"] == cargo]
    return records(df.head(max(1, min(limit, 5000))))

@app.get("/api/scenarios")
def scenarios(year: Optional[int] = None):
    df = read_csv("revenue_scenarios_all.csv")
    if year is not None:
        df = df[df["year"] == year]
    return records(df)


@app.get("/api/year-summary")
def year_summary():
    return records(read_csv("year_summary.csv").sort_values("year"))

@app.get("/api/forecast/total-monthly")
def total_monthly():
    return records(read_csv("forecast_total_monthly_2026_2036.csv").sort_values("ds"))

@app.get("/api/forecast/cargo-monthly")
def cargo_monthly(cargo: Optional[str] = None):
    df = read_csv("forecast_cargo_monthly_2026_2036.csv")
    if cargo:
        df = df[df["cargo"] == cargo]
    return records(df.sort_values(["ds", "cargo"]))

@app.get("/api/metrics")
def metrics():
    return records(read_csv("metrics_by_cargo_model.csv"))

@app.get("/api/report")
def report():
    path = DATA_DIR / "report_2036.md"
    return {"markdown": path.read_text(encoding="utf-8")}


MAP_CARGO_TYPES = {
    "coal": "Уголь",
    "oil": "Нефтяные грузы",
    "containers": "Контейнеры",
    "grain": "Зерно",
    "metals": "Металлы",
    "timber": "Лесные грузы",
    "fertilizers": "Удобрения",
}

MAP_STATIONS = [
    {"id": "spb", "name": "Санкт-Петербург", "region": "Северо-Запад", "lat": 59.94, "lon": 30.31, "cargo": ["containers", "oil", "timber"], "volume": 42},
    {"id": "moscow", "name": "Москва", "region": "Центр", "lat": 55.75, "lon": 37.62, "cargo": ["containers", "metals", "grain"], "volume": 86},
    {"id": "nn", "name": "Нижний Новгород", "region": "Поволжье", "lat": 56.33, "lon": 44.00, "cargo": ["metals", "oil"], "volume": 38},
    {"id": "kazan", "name": "Казань", "region": "Поволжье", "lat": 55.79, "lon": 49.12, "cargo": ["oil", "containers", "fertilizers"], "volume": 51},
    {"id": "samara", "name": "Самара", "region": "Поволжье", "lat": 53.20, "lon": 50.15, "cargo": ["oil", "grain"], "volume": 57},
    {"id": "ufa", "name": "Уфа", "region": "Урал", "lat": 54.74, "lon": 55.97, "cargo": ["oil", "fertilizers"], "volume": 49},
    {"id": "perm", "name": "Пермь", "region": "Урал", "lat": 58.01, "lon": 56.25, "cargo": ["oil", "timber"], "volume": 36},
    {"id": "ekb", "name": "Екатеринбург", "region": "Урал", "lat": 56.84, "lon": 60.61, "cargo": ["metals", "containers"], "volume": 74},
    {"id": "chelyabinsk", "name": "Челябинск", "region": "Урал", "lat": 55.16, "lon": 61.40, "cargo": ["metals", "coal"], "volume": 61},
    {"id": "omsk", "name": "Омск", "region": "Сибирь", "lat": 54.99, "lon": 73.37, "cargo": ["grain", "oil"], "volume": 45},
    {"id": "novosibirsk", "name": "Новосибирск", "region": "Сибирь", "lat": 55.03, "lon": 82.92, "cargo": ["containers", "coal", "grain"], "volume": 83},
    {"id": "krasnoyarsk", "name": "Красноярск", "region": "Сибирь", "lat": 56.01, "lon": 92.87, "cargo": ["coal", "metals", "timber"], "volume": 67},
    {"id": "irkutsk", "name": "Иркутск", "region": "Сибирь", "lat": 52.29, "lon": 104.28, "cargo": ["coal", "timber"], "volume": 48},
    {"id": "chita", "name": "Чита", "region": "Забайкалье", "lat": 52.03, "lon": 113.50, "cargo": ["coal", "containers"], "volume": 32},
    {"id": "khabarovsk", "name": "Хабаровск", "region": "Дальний Восток", "lat": 48.48, "lon": 135.07, "cargo": ["containers", "timber"], "volume": 41},
    {"id": "vladivostok", "name": "Владивосток", "region": "Дальний Восток", "lat": 43.12, "lon": 131.89, "cargo": ["containers", "oil"], "volume": 53},
    {"id": "rostov", "name": "Ростов-на-Дону", "region": "Юг", "lat": 47.23, "lon": 39.70, "cargo": ["grain", "oil"], "volume": 44},
    {"id": "novorossiysk", "name": "Новороссийск", "region": "Юг", "lat": 44.72, "lon": 37.77, "cargo": ["grain", "oil", "containers"], "volume": 58},
]

MAP_ROUTES_RAW = [
    ("spb", "moscow", 650, 78, "main"), ("moscow", "nn", 440, 82, "main"), ("nn", "kazan", 390, 72, "main"),
    ("kazan", "samara", 350, 64, "main"), ("samara", "ufa", 460, 66, "main"), ("ufa", "chelyabinsk", 420, 71, "main"),
    ("chelyabinsk", "ekb", 210, 88, "main"), ("ekb", "omsk", 950, 96, "main"), ("omsk", "novosibirsk", 660, 103, "main"),
    ("novosibirsk", "krasnoyarsk", 790, 91, "main"), ("krasnoyarsk", "irkutsk", 1060, 80, "main"), ("irkutsk", "chita", 1100, 67, "main"),
    ("chita", "khabarovsk", 2200, 58, "main"), ("khabarovsk", "vladivostok", 760, 62, "main"),
    ("moscow", "rostov", 1070, 61, "regional"), ("rostov", "novorossiysk", 410, 54, "regional"), ("perm", "ekb", 360, 48, "regional"),
    ("kazan", "perm", 600, 44, "regional"), ("samara", "rostov", 950, 37, "regional"),
]
MAP_ROUTES = [
    {"id": f"r{i}", "from": src, "to": dst, "distance": distance, "capacity": capacity, "type": rtype}
    for i, (src, dst, distance, capacity, rtype) in enumerate(MAP_ROUTES_RAW)
]

CARGO_PROFILE_ALIASES = {
    "all": "Вся грузовая база",
    "coal": "Уголь каменный",
    "oil": "Нефтяные грузы",
    "metals": "Черные металлы",
    "fertilizer": "Удобрения",
    "other": "Остальные грузы",
}

@app.get("/api/routes/network")
def route_network():
    return {"cargoTypes": MAP_CARGO_TYPES, "stations": MAP_STATIONS, "routes": MAP_ROUTES}

@app.get("/api/scenario/cargo-profiles")
def scenario_cargo_profiles():
    year_summary_df = read_csv("year_summary.csv")
    cargo_df = read_csv("cargo_year.csv")
    last_year = int(year_summary_df["year"].max())
    base_total = float(year_summary_df[year_summary_df["year"] == last_year].iloc[0]["Base"])
    rows = [{"key": "all", "label": "Вся грузовая база", "baseRevenue": base_total, "share": 1.0}]
    last_cargo = cargo_df[cargo_df["year"] == last_year]
    for key, label in CARGO_PROFILE_ALIASES.items():
        if key == "all":
            continue
        match = last_cargo[last_cargo["cargo"] == label]
        if not match.empty:
            revenue = float(match.iloc[0]["revenue_bln_rub"])
            rows.append({"key": key, "label": label, "baseRevenue": revenue, "share": revenue / base_total if base_total else 0})
    return {"year": last_year, "baseTotalRevenue": base_total, "profiles": rows}

@app.get("/api/scenario/calculate")
def scenario_calculate(
    cargo: str = "all",
    tariff_change: float = 5,
    volume_change: float = 0,
    export_share: float = 35,
    container_share: float = 12,
    distance_change: float = 0,
):
    profiles_payload = scenario_cargo_profiles()
    profiles = {p["key"]: p for p in profiles_payload["profiles"]}
    if cargo not in profiles:
        raise HTTPException(status_code=400, detail=f"Unknown cargo profile: {cargo}")
    profile = profiles[cargo]
    base_revenue = float(profile["baseRevenue"])
    base_total = float(profiles_payload["baseTotalRevenue"])

    factors = {
        "tariff": 1 + tariff_change / 100,
        "volume": 1 + volume_change / 100,
        "distance": 1 + distance_change / 100,
        "export": 1 + (export_share - 35) * 0.0009,
        "container": 1 + (container_share - 12) * 0.0016,
    }
    final_revenue = base_revenue
    factor_steps = [{"name": "База", "value": base_revenue}]
    names = {"tariff": "Тариф", "volume": "Объем", "distance": "Дальность", "export": "Экспорт", "container": "Контейнеризация"}
    for key in ["tariff", "volume", "distance", "export", "container"]:
        final_revenue *= factors[key]
        factor_steps.append({"name": names[key], "value": final_revenue})
    factor_steps.append({"name": "Итог", "value": final_revenue})
    network_effect = final_revenue if cargo == "all" else base_total - base_revenue + final_revenue
    return {
        "year": profiles_payload["year"],
        "cargo": cargo,
        "label": profile["label"],
        "baseRevenue": base_revenue,
        "finalRevenue": final_revenue,
        "delta": final_revenue - base_revenue,
        "multiplier": final_revenue / base_revenue if base_revenue else None,
        "networkEffect": network_effect,
        "factors": factors,
        "steps": factor_steps,
    }
