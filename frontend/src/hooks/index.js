// ─────────────────────────────────────────────────────────────────────────────
//  BazaarBuddy — Hooks Barrel Export
//
//  Import from here:
//    import { useAuth, useLocation, useNearbyItems } from '@/hooks'
//
//  Note: Do NOT re-export useLocation from react-router-dom here.
//        Always be explicit about which useLocation you mean.
// ─────────────────────────────────────────────────────────────────────────────

export { useDebounce }       from './useDebounce';
export { useAuth }           from './useAuth';
export { useLocation }       from './useLocation';
export { useSocket }         from './useSocket';
export { useNearbyItems }    from './useNearbyItems';
export { useSearch }         from './useSearch';
export { useItem }           from './useItem';
export { useChat }           from './useChat';
export { useConversations }  from './useConversations';
export { useProfile }        from './useProfile';
