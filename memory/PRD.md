# Y-Store Marketplace - PRD

## Original Problem Statement
Поднять фронт, бэк, базу данных MongoDB, клонировать репозиторий, изучить текущий код, изучить последние обновления + админка

## Architecture

### Backend (FastAPI + MongoDB)
- `/app/backend/server.py` - Main legacy server
- `/app/backend/app.py` - Modular app v2
- `/app/backend/modules/` - Feature modules:
  - `auth` - JWT authentication
  - `products` - Products & categories
  - `orders` - Order management with state machine
  - `payments` - Fondy integration (checkout, webhooks, reconciliation)
  - `delivery` - Nova Poshta API (TTN automation)
  - `risk` - Risk Score Engine (0-100)
  - `returns` - Returns management
  - `guard` - Fraud/KPI monitoring
  - `bot` - Telegram Admin Bot
  - `crm` - Customer relationship management
  - `analytics_intel` - Analytics engine

### Frontend (React + Tailwind + shadcn/ui)
- `/app/frontend/src/App.js` - Main app
- `/app/frontend/src/pages/AdminPanel.js` - Admin dashboard
- `/app/frontend/src/components/admin/` - Admin components:
  - AnalyticsDashboard, ProductManagement, OrdersAnalytics
  - PolicyDashboard, ReturnsDashboard, CRMDashboard
  - GuardIncidents, PickupControl

### Payment Policy (D-Mode)
- FULL_PREPAID - online payment only
- SHIP_DEPOSIT - deposit required for COD
- COD_ALLOWED - standard COD

## What's Been Implemented

### 2026-02-20
- ✅ Repository cloned and configured
- ✅ Backend running (FastAPI on port 8001)
- ✅ Frontend running (React on port 3000)
- ✅ MongoDB connected
- ✅ Telegram Bot @YStore_a_bot running
- ✅ Fondy payment integration configured
- ✅ Nova Poshta API configured

## Prioritized Backlog

### P0 - Critical (Current Sprint)
1. Payment Health Dashboard - backend endpoint + Admin UI
2. Prepaid Discount system - FULL_PREPAID incentive
3. Risk Engine UI - Risk Center in admin panel

### P1 - Important
- A/B testing for Prepaid Discount
- Dynamic COD Limit
- City Risk Heatmap

### P2 - Nice to Have
- Advanced fraud detection
- Automated customer segmentation
- Push notifications

## API Keys Configured
- TELEGRAM_BOT_TOKEN: ✅
- NOVAPOSHTA_API_KEY: ✅
- FONDY_MERCHANT_ID/PASSWORD: ✅
- EMERGENT_LLM_KEY: ✅
