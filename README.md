# 💎 SMS Lottery Secretariat Suite - Next-Gen Gaming Platform

An enterprise-grade, high-fidelity lottery management and play platform built for absolute speed, bank-grade security, and complete financial transparency. Engineered with a reactive Firebase NoSQL architecture and a premium glassmorphic UI, it provides a flawless end-to-end bridge between administrative result declarations, automated player payouts, strict financial auditing, and real-time intake monitoring.

---

## 🚀 Key Features

### 🎮 For Players
- **Triple-Balance Wallet Architecture**: Advanced financial segregation tracking **Deposited Balance** (for ticket purchases), **Winning Balance** (fully withdrawable winnings), and **Bonus Chips** (promotional, non-withdrawable chips for ticket purchases).
- **Dynamic Betting Matrix**: Comprehensive support for 1D (Single Digit boards A, B, C), 2D (Double Digit combos AB, BC, AC), 3D (ABC), and 4D (XABC) combination patterns across multiple lottery markets.
- **Automated Payout Engine**: Real-time winner detection and instant balance credit using atomic database transactions.
- **Mandatory Payout Verification**: Secure onboarding workflow requiring verified banking details (Account Holder Name, Account Number, IFSC Code, UPI ID) before ticket purchases or withdrawal requests are permitted.
- **High-Fidelity Ledger & History**: Professional, receipt-style ticket history and a dedicated **Transaction History** hub with live status tracking (Pending, Approved, Rejected, Won, Active).
- **Mobile-Optimized UX**: Platform-wide implementation of native mobile numeric keypads (`inputMode="numeric"`, `inputMode="decimal"`, `pattern="[0-9]*"`) for all amount, phone number, and ticket entry fields. Features ultra-compact, scroll-free responsive modal designs for optimal single-screen mobile interactions.
- **Flexible Multi-ID Login**: Unified authentication field allowing users to securely log in using their registered Username, Mobile Number, or Email Address with case-insensitive robust matching.
- **Referral Engine**: Integrated referral system rewarding users with instant bonus chips upon successful friend registration.
- **Pull-To-Refresh Reactivity**: Custom-built mobile touch gesture system for instant, on-demand data synchronization without requiring page reloads.

### 🛡️ For Administrators
- **Unified Financial Command Center**: Real-time management boards for deposit approvals and withdrawal requests, featuring tabbed interfaces separating **Pending Verification** from **Permanent Audit History**.
- **Advanced Audit Trail & Oversight**: Comprehensive administrative logging capturing transaction IDs, exact timestamps, banking metadata, and custom rejection reasons for full accountability.
- **Time-Locked Announcements & Market Control**: Secure result declaration engine with built-in validation for market-specific slots, including automated **Kerala Lottery Early Closure (02:00 PM)** rules and a master switch for global ticket sales.
- **Live Intake Monitor & High-Frequency Analytics**: Real-time analysis of number frequency mapping and combination volume tracking across active draw sessions. Features top-15 high-frequency combination rankings, board-specific filtering (A, B, C, AB, BC, AC), and price-tier breakdowns (e.g., ₹12, ₹28, ₹30, ₹55, ₹60 for 3D; ₹20, ₹50, ₹100 for 4D).
- **Official PDF Export**: Built-in automated PDF generation (`jspdf`, `jspdf-autotable`) producing official lottery audit and result reports with professional formatting.
- **Deep-Dive User Management & Metadata**: Detailed player profiles allowing administrators to monitor individual liquidity, adjust triple-balance allocations, update security parameters, review transaction histories, and track exact Account Registration timestamps (with automated legacy user migration mapping).
- **Version & Build Transparency**: Global `APP_VERSION` and `BUILD_VERSION` config constants displayed seamlessly across user profile settings and admin dashboards for clear deployment tracking.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite) with highly optimized Context API (`AuthContext`, `CartContext`, `PaymentContext`) for modular state management.
- **Backend / Database**: Google Firebase Firestore (NoSQL) for real-time synchronization and live query listeners (`onSnapshot`).
- **Authentication**: Firebase Auth with role-based access control (Admin vs. Verified Member) and dynamic multi-identifier resolution.
- **Styling**: Tailwind CSS combined with custom glassmorphic aesthetics, vibrant gradients, and fluid micro-animations.
- **Icons**: Lucide-React for clean, scalable vector iconography.
- **Export & Reporting**: jsPDF and jsPDF-AutoTable for client-side official document generation.

---

## 📦 Architecture Highlights

```mermaid
graph TD
    A[Client Action / Purchase] --> B{Cutoff Buffer Validation}
    B -->|Valid| C[Firestore WriteBatch / Atomic Increment]
    B -->|Cutoff Reached| D[Reject Purchase]
    C --> E[Live Intake Monitor Feed]
    E --> F[Admin Result Declaration]
    F --> G[Catch-Up Audit Engine]
    G --> H[Automated Winning Balance Credit]
```

- **Catch-Up Audit Engine**: A resilient automated auditing system that ensures winning tickets are accurately processed and credited even if a user logs in days after a result is declared.
- **Standardized Market Cutoff Logic**: Precise draw schedules (DEAR at 01:00 PM, 06:00 PM, 08:00 PM; KERALA at 03:00 PM) enforced with automated 5-minute pre-draw cutoff buffers (`getCutoffTime`) and dynamic administrative overrides.
- **Secure Withdrawal Escrow Protocol**: Implements an instant escrow deduction methodology. When a user requests a withdrawal, funds are instantly secured/deducted to prevent double-spending vulnerabilities or negative balances. If an admin rejects the request, an automated live refund is instantly credited back to the user's active wallet.
- **Fuzzy Sync & Data Normalization**: Built-in whitespace trimming, case normalization, and strict data-type parsing to guarantee flawless synchronization between administrative data entry and client-side evaluation.
- **Atomic Reliability**: Utilizes Firestore `increment`, `updateDoc`, and `writeBatch` to ensure zero race conditions or financial discrepancies during multi-ticket purchases and balance adjustments.
- **Live Ecosystem Subscriptions**: Built on top of Firestore `onSnapshot` listeners to immediately push data across the platform, eliminating stale data in admin and user interfaces.

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Firebase Account & Project Configuration (Firestore, Auth)

### Installation
1. Clone the repository:
   ```bash
   git clone [repository-url]
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment:
   Update `src/firebase.js` with your active Firebase project credentials and configuration object.

4. Launch Development Server:
   ```bash
   npm run dev
   ```
5. Production Web Build:
   ```bash
   npm run build
   ```

### 📱 Android APK Build (Capacitor)
This project uses Ionic Capacitor to compile the web application into a native Android APK.

1. Ensure your production build is fresh:
   ```bash
   npm run build
   ```
2. Sync the web assets to the Android project:
   ```bash
   npx cap sync android
   ```
3. Open Android Studio to build the APK, or run it directly on a connected device:
   ```bash
   npx cap open android
   # OR
   npx cap run android
   ```
*Note: To update the app version, bump the version code in `android/app/build.gradle` and the `APP_VERSION` in `src/config.js` before syncing.*

---

## 📜 Maintenance & Diagnostic Logging

The platform includes a robust **Diagnostic Logger** for real-time monitoring and debugging. Open the browser developer console (F12) to inspect live operational feeds:
- `[AUDIT]`: Live ticket scanning and catch-up payout logs.
- `[CHECK]`: Real-time match verification between active user tickets and newly declared results.
- `[SYNC]`: Administrative Monitor data intake feed status and live ledger updates.
- `[Identity Dispatch]`: Authentication and recovery link routing logs.

---

*Engineered with precision for secure, transparent, and high-performance digital gaming.*
