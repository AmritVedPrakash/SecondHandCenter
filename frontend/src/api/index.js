// ─────────────────────────────────────────────────────────────────────────────
//  BazaarBuddy — API Barrel Export
//
//  Import from here anywhere in the app:
//    import { login, register } from '@/api'
//    import { getNearbyItems, getItemById } from '@/api'
//
//  Or import individual files for explicit clarity:
//    import { login } from '@/api/auth.api'
// ─────────────────────────────────────────────────────────────────────────────

export * from './auth.api';
export * from './user.api';
export * from './item.api';
export * from './search.api';
export * from './chat.api';
export * from './rating.api';
export * from './report.api';

// Default export of base axios instance (for one-off calls if needed)
export { default as api } from './axios';
