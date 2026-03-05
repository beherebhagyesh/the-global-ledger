# Development Log: Status, Bugs & Improvements

This document outlines the current technical state of "The Global Ledger," identifying "broken" (stubbed) features and opportunities for architectural improvement.

## 🛠️ Broken / Missing (Stubbed) Features

### 1. AI Service (Critical)
The `services/geminiService.ts` is currently a **facade**.
- **Issue**: Every AI-driven feature (Contract Negotiation, W-8BEN Validation, Scope Creep Generation, Mentor Feedback) returns hardcoded strings or objects.
- **Impact**: The "Real-Life RPG" experience is currently deterministic and lacks the nuances of LLM-driven interaction mentioned in the README.

### 2. Form Validation (Level 3)
- **Issue**: The `checkW8BEN` function always returns `valid: true`.
- **Impact**: There is no actual challenge in the tax compliance level; any input allows progression.

### 3. Sound Initialization
- **Issue**: The `playSound` utility initializes `AudioContext` without ensuring a user gesture occurred first.
- **Impact**: In some browsers, sounds may fail to play until the first button click, but the error handling is minimal.

### 4. Persistence Reliability
- **Issue**: State is saved to `localStorage` on every change to the `player` object.
- **Impact**: For complex objects (Inventory, Holdings), high-frequency updates might cause performance lag or write-contention in slower environments.

---

## 📈 Technical Improvements

### 1. State Management Migration (Zustand/Redux)
- **Current**: Thousands of lines of props are drilled from `App.tsx` to sub-levels. `App.tsx` is managing over 15 distinct state update functions.
- **Recommended**: Implement **Zustand**. This would decouple the game logic from the UI components and allow Level-6 (Commodities) to access PlayerState without `App.tsx` acting as a middleman.

### 2. Component Refactoring (De-bloating)
- **Current**: `Level4_Investing.tsx` is **1,484 lines long**.
- **Recommended**: Break Level 4 into a multi-file module:
    - `/components/Level4/StockMarket.tsx`
    - `/components/Level4/RealEstate.tsx`
    - `/components/Level4/CryptoFactory.tsx`
    - `/components/Level4/AngelInvesting.tsx`

### 3. AI Error Handling & UI States
- **Recommended**: Once the Gemini integration is "unsnubbed," add:
    - **Loading States**: Skeletons for AI-generated feedback.
    - **Retry Logic**: Handling for token limits or network failures.

### 4. Quality of Life (QoL)
- **Tooltips**: Many actions have `ActionTooltip` but descriptions are static. Contextual tooltips (e.g., showing *why* a bid was rejected) would improve educational value.
- **Mobile Optimization**: The complex dashboard layouts for Level 4 and 6 need a dedicated mobile "Compact View" to remain playable on phones.

### 5. Type Safety
- **Recommended**: Eliminate remaining `any` types in `services/geminiService.ts` and `Level4_Investing.tsx`.

---

## ✅ Summary of Current Stability
The app is **mechanically stable** but **systemically hollow** due to the hardcoded services. The UI/UX is premium and the RPG loop functions, but the "intelligence" of the game needs to be activated.
