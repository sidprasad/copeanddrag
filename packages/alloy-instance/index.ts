// The Alloy instance / XML model is owned by spytial-core (the single source of truth).
// This package re-exports it so existing `@/alloy-instance` imports keep working unchanged,
// plus a few Cope and Drag-specific helpers that don't belong in the canonical parser,
// and the Alloy projection core stopped shipping in 6.0.0.
export * from 'spytial-core/alloy-instance';
export * from './local';
export * from './projection';
