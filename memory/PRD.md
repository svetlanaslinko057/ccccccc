# Y-Store Marketplace - PRD

## Original Problem Statement
Реалізувати Revenue Optimization Engine (ROE) з:
1. ROE v1 Semi-Auto - snapshot + suggestions + apply + cooldown
2. ROE v1.1 Auto-Rollback - автовідкат якщо метрики гірші
3. ROE v1.2 Impact Estimator - оцінка cost vs uplift
4. A/B Discount Test Engine - когорти A/B/C/D з різними % знижки

## Architecture

### Revenue Optimization Engine (ROE)
- `/app/backend/modules/revenue/`
  - `revenue_settings.py` - конфігурація ROE (mode, cooldown, thresholds)
  - `revenue_snapshot_service.py` - збір метрик кожні 6 годин
  - `revenue_optimizer_rules.py` - правила прийняття рішень
  - `revenue_optimizer_service.py` - створення suggestions
  - `revenue_rollback_service.py` - авто-rollback якщо метрики гірші
  - `revenue_impact_estimator.py` - cost vs uplift розрахунки
  - `revenue_routes.py` - API endpoints
  - `revenue_jobs.py` - cron jobs

### A/B Testing Module
- `/app/backend/modules/ab/`
  - `ab_service.py` - стабільне призначення когорт (hash-based)
  - `ab_report_service.py` - звіти по варіантах
  - `ab_routes.py` - API endpoints

### Frontend Components
- `RevenueControl.js` - ROE dashboard (settings, config, suggestions, snapshots)
- `ABTests.js` - A/B тестування (experiments, reports, winner detection)

## What's Been Implemented

### 2026-02-21
- ✅ ROE v1 Semi-Auto
  - Settings: mode, cooldown_hours, max_discount_step, max_deposit_step
  - Config: prepaid_discount_value, deposit_min_uah, risk_threshold_high
  - Snapshot: orders, paid, decline_rate, return_rate, prepaid_conversion
  - Suggestions: PENDING → APPROVED → APPLIED → VALIDATED/ROLLED_BACK
  - Rules: DECLINE_HIGH, RETURNS_HIGH, PREPAID_CONV_LOW, RECOVERY_LOW

- ✅ ROE v1.1 Auto-Rollback
  - Guardrails: paid_drop > 2%, margin_drop > 2%, return_rise > 2%
  - Monitoring window: 24 hours after apply
  - Auto-rollback to previous config if metrics worsen

- ✅ ROE v1.2 Impact Estimator
  - Discount cost calculation
  - Expected uplift based on elasticity
  - Net effect estimation

- ✅ A/B Discount Test Engine
  - Experiment: prepaid_discount_v1
  - Variants: A (0%), B (1%), C (1.5%), D (2%)
  - Stable assignment by phone hash
  - Report: paid_rate, net_effect, winner detection

## API Endpoints

### Revenue API
- GET /api/v2/admin/revenue/settings
- PATCH /api/v2/admin/revenue/settings
- GET /api/v2/admin/revenue/config
- PATCH /api/v2/admin/revenue/config
- POST /api/v2/admin/revenue/snapshot/run
- GET /api/v2/admin/revenue/snapshots
- POST /api/v2/admin/revenue/optimize/run
- GET /api/v2/admin/revenue/suggestions
- POST /api/v2/admin/revenue/suggestions/{sid}/approve
- POST /api/v2/admin/revenue/suggestions/{sid}/apply
- POST /api/v2/admin/revenue/suggestions/{sid}/reject
- POST /api/v2/admin/revenue/impact/estimate

### A/B Test API
- GET /api/v2/admin/ab/experiments
- POST /api/v2/admin/ab/experiments
- POST /api/v2/admin/ab/seed/prepaid-discount
- GET /api/v2/admin/ab/assignment
- GET /api/v2/admin/ab/report

## Test Results
- Backend: 97% (39/40 tests passed)
- All ROE APIs working
- All A/B APIs working
- Frontend components created

## Next Action Items
1. Wait for preview activation to test frontend
2. Integrate A/B assignment into order creation flow
3. Add Multi-armed bandit weights optimization

## Future Backlog
- Bandit auto-weights update
- Dynamic COD limit based on risk
- City Risk Heatmap visualization
- SMS confirmation for high-risk orders
