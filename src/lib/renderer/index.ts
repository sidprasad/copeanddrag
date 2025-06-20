/**
 * Renderer Module - Main Entry Point
 * 
 * This module serves as the main entry point for the renderer functionality,
 * providing a clean interface to all renderer components with dependency injection support.
 * 
 * The renderer has been refactored to:
 * - Use dependency injection for better testability
 * - Support both server-side and client-side usage
 * - Provide type-safe interfaces
 * - Include comprehensive validation
 * 
 * @example
 * ```typescript
 * import { setupLayoutWithConfig, createRendererConfig } from './renderer';
 * 
 * const config = createRendererConfig(5);
 * setupLayoutWithConfig(svgElement, nodes, edges, constraints, groups, 800, 600, config);
 * ```
 */

// Export types
export * from './types';

// Export core utilities (server-safe)
export * from './utils';
export * from './geometry';

// Export DOM-dependent utilities (client-side only)
export * from './dom-utils';

// Export main layout function with dependency injection
export * from './layout';

// Export convenient API wrappers
export * from './api';

// Export validation utilities
export * from './validation';

// Re-export constants for backward compatibility
export {
    initialUnconstrainedIterations,
    initialUserConstraintIterations,
    initialAllConstraintsIterations,
    gridSnapIterations,
    margin,
    dy_for_linespacing
} from './utils';
