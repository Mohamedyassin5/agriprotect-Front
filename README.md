# 🌿 AgriProtect — Frontend

> **AgriProtect** is a premium agricultural micro-insurance and micro-finance  platform. This repository contains the **Angular 18 front-end application** that serves both farmers (front-office) and administrators (back-office) through a modern "Forest Glass" glassmorphism UI.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
  - [Authentication](#-authentication)
  - [Front-Office (Farmer Portal)](#-front-office-farmer-portal)
  - [Back-Office (Admin Panel)](#-back-office-admin-panel)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
  - [Building for Production](#building-for-production)
- [Environment Configuration](#environment-configuration)
- [Backend Services](#backend-services)
- [UI Design System](#ui-design-system)
- [Contributing](#contributing)

---

## Overview

AgriProtect is a full-stack agricultural insurance platform designed to help farmers manage crop insurance policies, assess risks using AI, declare incidents, track indemnisations, access microfinance credit, and participate in a solidarity fund — all from a single, beautifully designed interface.

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Angular 18 |
| **Language** | TypeScript 5.5 |
| **Styling** | Vanilla CSS (Forest Glass Design System) |
| **Icons** | Remix Icon |
| **Charts** | ApexCharts + ng-apexcharts |
| **Maps** | Leaflet.js |
| **Animations** | GSAP 3, Lenis (smooth scroll) |
| **3D / Visual** | Three.js, Simplex Noise |
| **Authentication** | JWT + Google OAuth (`@abacritt/angularx-social-login`) |
| **UI Components** | ng-bootstrap |
| **HTTP** | Angular HttpClient + Interceptors |
| **Testing** | Karma + Jasmine |

---

## Project Structure

```
src/
├── app/
│   ├── auth/                  # Authentication module
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── verify-code/
│   ├── front-office/          # Farmer-facing portal
│   │   ├── dashboard/
│   │   ├── crops/
│   │   ├── insurance/
│   │   ├── declare-sinistre/
│   │   ├── indemnisation/
│   │   ├── remboursement/
│   │   ├── marketplace/
│   │   ├── credit/
│   │   ├── savings/
│   │   ├── wallet/
│   │   ├── payment/
│   │   ├── solidarity-fund/
│   │   ├── decision-dashboard/
│   │   ├── assistant/
│   │   ├── accounting/
│   │   ├── qcm/
│   │   └── profile/
│   ├── back-office/           # Admin panel
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── crops/
│   │   ├── cropsref/
│   │   ├── insurances/
│   │   ├── incident-management/
│   │   ├── indemnisation/
│   │   ├── remboursements/
│   │   ├── credit-workflow/
│   │   ├── marketplace-admin/
│   │   ├── solidarity-funds/
│   │   ├── wallet-admin/
│   │   ├── financial-overview/
│   │   ├── investigations/
│   │   ├── qcm-management/
│   │   ├── scheduler-tests/
│   │   └── profile/
│   ├── core/                  # Core services & guards
│   ├── shared/                # Shared components
│   ├── landing/               # Public landing page
│   └── sections/              # Reusable page sections
├── assets/                    # Static assets
├── environments/              # Environment configs
├── styles.css                 # Global design system
└── index.html
```

---

## Features

### 🔐 Authentication

- **Login / Register** with email & password
- **Google OAuth 2.0** social login
- **Forgot Password** with email verification
- **OTP Verification** code flow
- **JWT** token management with HTTP interceptors
- **Route Guards** for protected pages

---

### 🌾 Front-Office (Farmer Portal)

| Module | Description |
|---|---|
| **Dashboard** | Overview of policies, weather data, crop stats, and AI insights |
| **Crops** | Register and manage crop declarations |
| **Insurance** | Subscribe to, view, and manage insurance policies |
| **Declare Sinistre** | Report agricultural incidents/disasters |
| **Indemnisation** | Track insurance claim payouts |
| **Remboursement** | View reimbursement status and history |
| **Marketplace** | Browse and list agricultural products/services |
| **Credit** | Apply for agricultural micro-credit |
| **Savings** | Manage savings accounts |
| **Wallet** | Digital wallet for transactions |
| **Payment** | Process payments and view history |
| **Solidarity Fund** | Contribute to and access mutual aid funds |
| **Decision Dashboard** | AI-powered risk analysis & crop valuation reports |
| **AI Assistant** | Chatbot assistant for agricultural guidance |
| **Accounting** | Financial records and accounting overview |
| **QCM** | Questionnaires for risk profiling |
| **Profile** | Manage personal information and Face ID |

---

### 🛠️ Back-Office (Admin Panel)

| Module | Description |
|---|---|
| **Dashboard** | Platform-wide KPIs and analytics |
| **Users** | Manage all registered users |
| **Crops & CropsRef** | Manage crop types and references |
| **Insurances** | Oversee all insurance subscriptions |
| **Incident Management** | Review and process incident reports |
| **Indemnisation** | Approve and manage claim payouts |
| **Remboursements** | Handle reimbursement workflows |
| **Credit Workflow** | Approve/reject credit applications |
| **Marketplace Admin** | Moderate marketplace listings |
| **Solidarity Funds** | Administer the solidarity fund pool |
| **Wallet Admin** | Monitor and manage user wallets |
| **Financial Overview** | Consolidated financial reporting |
| **Investigations** | Conduct and review fraud investigations |
| **QCM Management** | Create and manage risk questionnaires |
| **Scheduler Tests** | Test and monitor scheduled jobs |
| **Profile** | Admin profile settings |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **Angular CLI** 18.x

```bash
npm install -g @angular/cli@18
```

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd AgriProtectFront

# Install dependencies
npm install
```

### Running the App

```bash
npm start
# or
ng serve
```

The application will be available at **http://localhost:4200**.

> **Note:** The app proxies API requests to the backend. See [`proxy.conf.json`](proxy.conf.json) for the proxy configuration.

### Building for Production

```bash
npm run build
# Output will be in the /dist directory
```

---

## Environment Configuration

Configure your environment files under `src/environments/`:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  riskServiceUrl: 'http://localhost:8000',
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID',
  weatherApiKey: 'YOUR_WEATHER_API_KEY'
};
```

---

## Backend Services

AgriProtect communicates with the following backend services:

| Service | Technology | Default Port | Purpose |
|---|---|---|---|
| **Core API** | Java / Spring Boot | `8080` | Main business logic, auth, policies |
| **Risk Analysis Service** | Python / FastAPI | `8000` | AI-powered crop risk assessment |
| **AI Valuation Service** | Python / FastAPI | `8001` | Crop financial valuation using market data |

---

## UI Design System

This application uses the **"Forest Glass"** design system — a premium glassmorphism aesthetic built with CSS custom properties:

- 🎨 **Palette**: Deep forest greens, warm amber accents, translucent glass layers
- 🌟 **Style**: Glassmorphism with `backdrop-filter: blur`, frosted cards, soft shadows
- ✨ **Animations**: GSAP-powered micro-animations, smooth scroll via Lenis
- 🔡 **Typography**: Modern sans-serif fonts from Google Fonts
- 📊 **Charts**: ApexCharts for data visualization
- 🗺️ **Maps**: Leaflet.js for geographic data display
- 🖼️ **Icons**: Remix Icon icon set

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

<p align="center">
  Made with ❤️ for the agricultural community
</p>
