import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const hasClerk = Boolean(PUBLISHABLE_KEY);

if (!hasClerk) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY in your .env file; continuing in guest mode.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {hasClerk ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>
);