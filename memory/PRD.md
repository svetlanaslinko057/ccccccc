# Y-Store Marketplace - PRD

## Original Problem Statement
Реалізувати A/B Simulator та Monte Carlo симуляцію для аналізу оптимальної знижки до реального трафіку

## What's Been Implemented

### 2026-02-21 (Session 2)

**A/B Simulator** (`/app/backend/modules/ab/ab_simulator.py`)
- Детерміністична симуляція без реального трафіку
- Розрахунок: revenue, discount_cost, gross_margin, return_losses, net_profit
- Break-even analysis для кожного варіанту

**Monte Carlo Simulation** (`/app/backend/modules/ab/ab_monte_carlo.py`)
- 2000-5000 прогонів з випадковим шумом (±2% конверсія, ±5% чек)
- Статистика: mean_profit, std_dev, p10/p50/p90
- Winner probability distribution
- Risk-adjusted profit (Sharpe-like metric)
- Автоматичні рекомендації українською

**API Endpoints:**
- `POST /api/v2/admin/ab/simulate` - базова симуляція
- `POST /api/v2/admin/ab/monte-carlo` - Monte Carlo
- `POST /api/v2/admin/ab/quick-estimate` - швидкий break-even

## Simulation Results

### Scenario 1: Normal conditions
- margin_rate: 41%
- base_paid_rate: 68%
- elasticity: 0.6
- **Winner: Control (0%)** - знижка не потрібна

### Scenario 2: High margin + Low conversion
- margin_rate: 60%
- base_paid_rate: 40%
- elasticity: 2.0
- **Winner: C (1.5%)** з ймовірністю 100%
- Додатковий прибуток: +12,080 грн

## Key Insights

1. При марже 41% і хорошій конверсії (68%) - знижка "з'їдає" маржу
2. Знижка працює коли:
   - Маржа висока (>50%)
   - Base paid_rate низький (<50%)
   - Elasticity висока (>1.5)
3. Рекомендовані варіанти для тестування: 0%, 1%, 1.5% (без 2%)

## Test Results
- Backend: 100% passed
- All simulation endpoints working
- Recommendation logic verified

## Experiment Configuration
```json
{
  "id": "prepaid_discount_v1",
  "variants": [
    {"key": "A", "discount_pct": 0.0, "weight": 34},
    {"key": "B", "discount_pct": 1.0, "weight": 33},
    {"key": "C", "discount_pct": 1.5, "weight": 33}
  ]
}
```

## Architecture Summary

### Modules Created
- `/app/backend/modules/revenue/` - ROE (Semi-Auto, Rollback, Impact Estimator)
- `/app/backend/modules/ab/` - A/B Testing + Simulator + Monte Carlo

### Frontend Components
- `RevenueControl.js` - ROE dashboard
- `ABTests.js` - A/B testing UI
- AdminPanel tabs: Revenue, A/B Tests

## Next Action Items
1. Інтегрувати A/B assignment в order creation flow
2. Зібрати реальні дані 10-14 днів
3. Порівняти симуляцію з реальними результатами
4. Multi-armed bandit auto-weights (опціонально)

## Future Backlog
- Frontend UI для симуляторів
- Visualization графіків Monte Carlo distribution
- Sensitivity analysis (вплив зміни параметрів)
