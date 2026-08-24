# Neon Air Draw — React port

A React + TypeScript + Tailwind rebuild of the original single-file HTML app.
Hand-tracking (MediaPipe), stroke rendering, gestures, zoom/pan, gallery,
Firebase auth/Firestore sync — all ported with the same constants and math as
the original, so drawing accuracy/feel is unchanged. The login screen was
redesigned from scratch.

## Run it

```bash
npm install
npm run dev
```

## Razorpay payments

The browser uses only `VITE_RAZORPAY_KEY_ID`. Keep the secret values in a
server environment, never in React code or variables prefixed with `VITE_`:

```env
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

The payment API is implemented in `api/create-order.js` and
`api/verify-payment.js`. To test the frontend and API functions together,
install the Vercel CLI and run:

```bash
npm install -g vercel
vercel dev
```

Use Razorpay test credentials locally. Add the same variables to Vercel
Project Settings for deployment, and switch to live credentials only when the
Razorpay account is ready to accept real payments.

Needs a webcam and (for login/sync) the Firebase project already wired up in
`src/lib/firebase.ts` — it's the same project the original file used.

## What's new

- **Login screen** (`src/components/LoginScreen.tsx`): an asymmetric hero —
  the wordmark "Neon Air" draws itself in on load (letters resolve out of a
  blur, echoing the app's own light-trail mechanic), a thin animated stroke
  visually connects the brand to the sign-in card, and the card itself is a
  glass panel with a sliding tab pill and a cyan→magenta gradient submit
  button. Same auth flow/validation/errors as the original (login, sign up,
  forgot password, show/hide password).

## Structure

- `src/lib/engine.ts` — the drawing/hand-tracking engine (canvas, MediaPipe,
  gesture state machine, stroke cache) as a plain class. Same thresholds,
  smoothing, and neon-glow rendering as the original vanilla script.
- `src/hooks/useAuth.ts`, `src/hooks/useProfile.ts` — Firebase auth + the
  gallery/drawings/favorites/version-history persistence logic.
- `src/components/` — Login, onboarding (nickname/welcome), loading overlay,
  the tools panel, the gallery panel, and the stats/history/profile modals.
- `src/App.tsx` — wires it all together and owns the app's stage machine
  (login → nickname → welcome → app), mirroring the original's flow.
