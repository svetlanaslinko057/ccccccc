# Y-Store Marketplace - PRD

## Original Problem Statement
Поднять фронтенд, бэкенд, MongoDB из двух GitHub репозиториев:
- https://github.com/svetlanaslinko057/fhfjfjgfjg (основной)
- https://github.com/svetlanaslinko057/ccccc1 (дополнительные модули)

## Architecture Summary

### Tech Stack
- **Backend**: FastAPI (Python 3.11)
- **Frontend**: React 19 + Tailwind CSS
- **Database**: MongoDB (motor async driver)
- **Bot**: Aiogram 3.x (Telegram Admin Bot)
- **Payments**: Fondy
- **Delivery**: Nova Poshta API

### Key Integrations
- **Telegram Bot**: @YStore_a_bot (8239151803:AAFBBuflCH5JPWUxwN9UfifCeHgS6cqxYTg)
- **Nova Poshta API**: 5cb1e3ebc23e75d737fd57c1e056ecc9
- **Fondy**: Merchant ID 1558123

### Backend Modules (25+)
- auth - JWT authentication
- orders - Order management & state machine
- payments - Fondy integration, webhooks, retry logic
- delivery - Nova Poshta TTN, tracking
- returns - Return engine, policies
- risk - Customer risk scoring
- guard - Fraud detection, KPI alerts
- ab - A/B testing, Monte Carlo simulation
- revenue - Revenue optimization engine
- crm - Customer management, timeline
- bot - Telegram admin bot
- automation - Automated workflows
- analytics_intel - Analytics intelligence
- notifications - SMS, Email providers
- pickup_control - Return prevention

### Frontend Pages
- Home, Products, ProductDetail
- Cart, Checkout, CheckoutSuccess
- UserProfile, Favorites, Comparison
- AdminPanel (18 tabs)
- DeliveryPayment, ExchangeReturn, ContactInfo

### Admin Panel Tabs
1. Аналітика
2. Користувачі
3. Категорії
4. Товари
5. Виплати
6. Замовлення
7. Розширена аналітика
8. Слайдер
9. CRM
10. Акції
11. Популярні категорії
12. Кастомні розділи
13. Відгуки
14. Повернення
15. Policy
16. Payment Health
17. Risk Center
18. A/B Tests

## What's Been Implemented

### 2026-02-21 - Content & Policy Updates COMPLETED
- [x] Адрес обновлен на: проспект Миколи Бажана, 24/1, Київ, 02149
- [x] Безкоштовна доставка від 2000 грн (было 1000)
- [x] Удален "Банківський переказ" из DeliveryPayment.js
- [x] Страница ExchangeReturn.js обновлена с полным контентом:
  - 7 робочих днів для повернення коштів
  - Адрес НП 23, просп. М. Бажана, 24/1
  - ФОП Тищенко Олександр Миколайович
- [x] Footer и ContactInfo.js содержат правильный адрес

**Тестирование:** 100% passed (8/8 tests)

### 2026-02-21 - Initial Setup
- Cloned both repositories
- Backend running on port 8001
- Frontend running on port 3000
- Telegram Bot @YStore_a_bot active
- MongoDB connected
- All keys configured

## Pending Tasks (from user)

### P0 - Content Updates
- [ ] Адрес: проспект Миколи Бажана, 24/1, Київ, 02149
- [ ] Доставка безкоштовна від 2000 грн
- [ ] Видалити "Банківський переказ"
- [ ] Сторінка "Обмін та повернення" - повний контент

### P1 - Product Page V2
- [ ] Галерея зображень (з превью)
- [ ] Вибір варіацій (колір/пам'ять/розмір)
- [ ] Sticky buy-блок
- [ ] Характеристики (таблиця)
- [ ] Блок "Купують разом"
- [ ] Відгуки
- [ ] SEO текст
- [ ] Trust block

### P2 - Checkout V2
- [ ] One Page checkout
- [ ] Nova Poshta live API
- [ ] Risk detection (Smart Payment Policy)
- [ ] Fondy redirect
- [ ] Resume flow

## Second Repository Modules (ccccc1)
Available for integration:
- `modules/checkout/` - V2 Checkout flow with DTOs
- `modules/pages/` - Page Builder admin
- `modules/security/` - Production hardening
  - Rate limiting (in-memory + Redis-ready)
  - 2FA (TOTP)
  - Anti-abuse (honeypot, timing, flood)
  - Webhook protection
  - Session management
  - Security alerts

## Future/Backlog
- Performance layer (CDN, Redis, indexes)
- Mobile App / PWA
- Multi-armed bandit A/B tests
