# Y-Store Marketplace - PRD

## Original Problem Statement
Реалізувати 3 компоненти:
1. Payment Health Dashboard - моніторинг платіжної системи
2. Prepaid Discount - знижка за онлайн оплату
3. Risk Center - UI для управління ризиками клієнтів

## Architecture

### Backend (FastAPI + MongoDB)
- `/app/backend/server.py` - Main server with all routes
- `/app/backend/modules/payments/` - Payment system
  - `payment_health_service.py` - Health metrics aggregation
  - `payment_health_routes.py` - API endpoint
  - `prepaid_discount.py` - Discount calculator
- `/app/backend/modules/risk/` - Risk Engine
  - `risk_service.py` - Risk score calculation (0-100)
  - `risk_routes.py` - API endpoints

### Frontend (React + Tailwind)
- `/app/frontend/src/pages/AdminPanel.js` - Admin with new tabs
- `/app/frontend/src/components/admin/`
  - `PaymentHealthDashboard.js` - KPI cards + charts
  - `RiskCenter.js` - Customer risk management

## What's Been Implemented

### 2026-02-21
- ✅ Payment Health Dashboard backend (`/api/v2/admin/payments/health`)
  - Webhook success rate, reconciliation fixes
  - Retry recovery rate, deposit conversion
  - Prepaid conversion, discount analytics
  - Daily trend data
- ✅ Prepaid Discount system (env configurable)
  - PREPAID_DISCOUNT_ENABLED=true
  - PREPAID_DISCOUNT_VALUE=1%
  - PREPAID_DISCOUNT_MAX_UAH=300
- ✅ Risk Center backend APIs
  - `/api/v2/admin/risk/summary`
  - `/api/v2/admin/risk/customers`
  - `/api/v2/admin/risk/recalc/{user_id}`
  - `/api/v2/admin/risk/override/{user_id}`
- ✅ Frontend components created
  - PaymentHealthDashboard.js
  - RiskCenter.js
- ✅ Admin Panel tabs added

## API Testing Results
- Payment Health API: ✅ Working (returns metrics)
- Risk Summary API: ✅ Working (returns distribution)
- Risk Customers API: ✅ Working (returns list)
- All require admin JWT authentication

## Test Credentials
- Email: admin@ystore.com
- Password: admin123
- Role: admin

## Environment Variables
```
PREPAID_DISCOUNT_ENABLED=true
PREPAID_DISCOUNT_MODE=PERCENT
PREPAID_DISCOUNT_VALUE=1
PREPAID_DISCOUNT_APPLY_TO=FULL_PREPAID
PREPAID_DISCOUNT_MAX_UAH=300
PREPAID_DISCOUNT_MIN_ORDER=500
```

## Next Action Items
1. Test frontend after preview activation
2. Add seed data for better testing
3. Integrate prepaid discount into order flow

## Future Backlog
- Dynamic discount (1% → 2% if decline grows)
- A/B test discount
- City Risk Heatmap
- Risk Actions Engine (auto-tag, SMS template)
