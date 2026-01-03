# Sultan’s Tracker — Frontend

> A modern fintech dashboard built with React that combines financial tracking, behavioral analytics, AI‑driven insights, and real‑time security monitoring. Designed to reflect how real‑world financial applications operate at scale.

---

## Overview

Sultan’s Tracker focuses on **real frontend complexity**:

* Secure authentication flows
* Advanced state management
* Real‑time updates via WebSockets
* Data‑driven financial insights
* High‑quality UI/UX with performance in mind

This frontend is built to integrate seamlessly with a security‑focused fintech backend.

---

## Status & Stack

![React](https://img.shields.io/badge/React-18.3.1-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5.4.20-646CFF)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.18-06B6D4)
![Status](https://img.shields.io/badge/Status-Active-success)

---

## Demo & Screenshots

> Screenshots reflect real application states — not mockups.

### Dashboard Overview

* Financial health summary
* Income vs expense trends
* Key alerts and insights

![Dashboard Overview](./screenshots/dashboard.png)

### Cash Compass — Behavioral Finance

* Emotional vs impulsive spending detection
* Mood–spending correlation
* Personalized AI recommendations

![Cash Compass](./screenshots/cash-compass.png)

### Finance Health Score

* Multi‑factor scoring (budgeting, savings, debt, stability)
* Visual grading system (A–F)
* Actionable improvement insights

![Finance Health Score](./screenshots/finance-health.png)

### Real‑Time Monitoring & Alerts

* Live transaction updates
* Fraud & anomaly detection alerts

![Real‑Time Alerts](./screenshots/alerts.png)

---

## Key Features

### Core Financial Management

* Real‑time transaction tracking
* Smart budget management with rollovers
* Savings, investment, and debt tracking
* Goal progress visualization

### Intelligent Insights

* AI‑powered financial health scoring
* Behavioral finance analysis (planned vs impulsive spending)
* Spending forecasts and trend detection
* Emotion‑aware transaction tracking

### Security & Reliability

* Real‑time fraud and anomaly alerts
* JWT‑based authentication with refresh tokens
* Geo‑location login monitoring
* Automatic session expiry and refresh

### User Experience

* Responsive, webpage‑first design
* Smooth animations & micro‑interactions
* Real‑time notifications

---

## Tech Stack

### Core

* **React 18** with Vite
* **React Router 6** for routing
* **Context API** for state management

### Styling & UI

* Tailwind CSS
* Framer Motion (animations)
* Chart.js (data visualization)
* Lucide React (icons)

### Networking & Real‑Time

* Axios with interceptors
* Socket.IO client

### Tooling

* ESLint
* PostCSS + Autoprefixer
* TypeScript type definitions

---

## Quick Start

### Prerequisites

* Node.js **18+**
* npm / yarn / pnpm
* Backend running on `http://localhost:5000`

### Installation

```bash
git clone <repository-url>
cd sultans-tracker-frontend
npm install
npm run dev
```

Application runs at: **[http://localhost:5173](http://localhost:5173)**

---

## Production Build

```bash
npm run build
npm run preview
```

---

## Project Structure

```text
SULTANS-TRACKER-FRONTEND/
├── src/
│   ├── components/
│   │   ├── dashboard/          # Dashboard-specific components
│   │   │   ├── CashCompass.jsx
│   │   │   ├── FinanceHealthScore.jsx
│   │   │   ├── IncomeExpenseChart.jsx
│   │   │   ├── SmartSuggestions.jsx
│   │   │   └── ...
│   │   ├── debt/               # Debt management components
│   │   └── ui/                 # Reusable UI elements
│   ├── contexts/               # Global state providers
│   ├── hooks/                  # Custom React hooks
│   ├── pages/                  # Route-level pages
│   ├── services/               # API service layer
│   └── styles/                 # Global styles
├── public/                     # Static assets
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## State & Data Flow Architecture

```text
User Actions → Context Providers → API Services → Backend
       ↓              ↓               ↓           ↓
UI Updates ← State Updates ← Data Processing ← Response
```

### Context Provider Hierarchy

```jsx
<AuthProvider>
  <SocketProvider>
    <TransactionsProvider>
      <AccountsProvider>
        <BudgetsProvider>
          <GoalsProvider>
            <DebtProvider>
              <TransactionMoodProvider>
                <DashboardProvider>
                  <App />
```

---

## Core Dashboard Modules

### Cash Compass

* AI‑powered financial behavior analysis
* Emotional spending detection
* Personalized recommendations
* Mood vs spending visualization

### Finance Health Score

* Multi‑factor assessment (6+ categories)
* AI‑enhanced analytics
* Visual grading (A–F)
* Actionable improvement guidance

### Smart Analytics

* Income vs expense trends
* Category‑level breakdowns
* Cash‑flow stability tracking
* Predictive forecasting

---

## API Integration

### Backend Endpoints

* Authentication: `/api/auth/*`
* Transactions: `/api/transactions/*`
* Budgets: `/api/budgets/*`
* Goals: `/api/goals/*`
* Debts: `/api/debts/*`
* Analytics: `/api/analytics/*`
* Security: `/api/security/*`
* Transaction Moods: `/api/transaction-mood/*`

### Error Handling

* Automatic token refresh
* Request queueing during refresh
* Graceful fallback handling
* User‑friendly error messages

---

## Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

---

## Performance Optimization

* Route‑based code splitting
* Optimized asset handling via Vite
* Production bundle optimization
* Service‑worker ready caching strategy

---

## Security Considerations

* Secure JWT session handling
* Automatic token refresh
* Client‑side input validation
* React‑based XSS protection
* Encrypted data in transit

---

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Code Quality

* ESLint rules for React best practices
* Fast Refresh enabled
* Type definitions for improved DX

---

## Browser Support

* Chrome 90+
* Firefox 88+
* Safari 14+
* Edge 90+

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Ensure linting passes
5. Submit a pull request

---

## License

MIT License — see the `LICENSE` file for details.

---

## Support

For issues and feature requests, please use the issue tracker.

---

Built by **Khalfaan Khan**
