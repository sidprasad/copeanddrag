// The Alloy instance / XML model is owned by spytial-core (the single source of truth).
// This package re-exports it so existing `@/alloy-instance` imports keep working unchanged,
// plus a few Cope and Drag-specific helpers that don't belong in the canonical parser.
export * from 'spytial-core/alloy-instance';
export * from './local';
