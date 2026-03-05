# Architecture: The Global Ledger

## Component Structure

The application follows a level-based progression system where the `App.tsx` component manages the current `GameLevel` and `PlayerState`.

### Level Management
Each level is encapsulated in its own component (e.g., `Level1_Foundations.tsx`) and receives callbacks to update the global `PlayerState`.

### State Management
- **PlayerState**: Centralized interface in `types.ts` containing:
    - XP, Bank Balance, Reputation, Credit Score, Stress.
    - Inventory, Skills, Achievements, and active loans.
- **Persistence**: State is intended to be synced with LocalStorage for session persistence.

## AI Integration (Google Gemini)

The project leverages Google Gemini Pro via `services/geminiService.ts` for:
- **W-8BEN Validation**: Analyzing tax form inputs.
- **Contract Negotiation**: Simulating client interactions in Level 2.
- **Scenario Generation**: Creating dynamic scope creep and upsell events.
- **Mentor Feedback**: Providing personality-driven advice based on current game state.

## Design System

- **Vanilla CSS + Tailwind**: Modern, high-contrast dark theme with emerald/emerald-dark accents.
- **Lucide Icons**: Consistent iconography for financial and RPG actions.
- **Recharts**: Data-driven visualizations for cashflow, tax projections, and market trends.
