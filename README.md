# Smart Expense — Mobile (Expo)

React Native (Expo SDK 54) client for Smart Expense Tracker. Mirrors the admin
FE's Redux Toolkit patterns and talks to the same .NET API.

## Stack
- **Expo Router** (file-based navigation) + **native iOS tab bar** (`expo-router/unstable-native-tabs` → real Liquid Glass on iOS 26)
- **Redux Toolkit** (`createAsyncThunk`) with the same `Action` / `Slice` / `Facade` pattern as the web FE
- **NativeWind v4** (Tailwind) for styling
- **Liquid Glass** via `expo-glass-effect` (Apple `UIGlassEffect`, iOS 26+) with an `expo-blur` fallback
- **expo-secure-store** for the JWT (replaces the web's cookies)
- **react-native-gifted-charts** for the dashboard donut

## Configure the API URL
Edit `.env`:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:5200/api/v1
```
- Physical device: use your machine's LAN IP, e.g. `http://192.168.1.10:5200/api/v1`
- Android emulator: `http://10.0.2.2:5200/api/v1`

## Run
Dev scripts pin Metro to **port 19000** (the API/IIS occupies 8081, and 8082 is
also reserved by http.sys on this machine).
```bash
npm run ios      # iOS simulator (best — Liquid Glass shows on iOS 26)
npm run start    # dev server on :19000 (scan QR with Expo Go / dev client)
npm run typecheck
```
After changing `.env` or `babel.config.js`, add `--clear` (or `npx expo start --port 19000 --clear`).

Two Hermes/Expo Go compatibility shims are in place: `babel.config.js` transforms
`#private` fields, and `polyfills.js` (injected via `metro.config.js`
`getPolyfills`) defines `global.DOMException` in the prelude, before any module.

> Note: `babel.config.js` force-transforms `#private` class fields/methods.
> Without this, Hermes (Expo Go and `expo export`'s hermesc) throws
> "private properties are not supported" on RN's `DOMRect`. If you change babel
> config, restart with cache clear: `npx expo start --clear`.

## Layout
```
app/                 # routes (expo-router)
  (auth)/            # sign-in, sign-up, verify-email
  (tabs)/            # dashboard, transactions, categories, profile (native tabs)
  transaction-form   # modal
  category-form      # modal
store/               # Redux: action.ts, slice.ts, global(auth), category, transaction, statistic
lib/                 # api (fetch wrapper), secure-storage, router-links, format, notify
components/ui/        # GlassSurface, GlassCard, Button, Input, Screen, ToastHost
models/ · theme/     # types/enums · colors + gradients
```

## Notes / next steps
Current scope: Auth + Dashboard + Transactions + Categories. The store layer is
generic, so adding Budgets / Wallets / Debts / Savings Goals / Recurring is just
a new `store/<entity>` (Action + Slice + Facade) plus screens.
