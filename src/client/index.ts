// Client-side entry point
// This file imports the core library and sets up the client-side application

import * as CopeDragCore from '../lib';

// Make the core library available globally for backward compatibility
(window as any).CopeDragCore = CopeDragCore;

// Note: Client-side JavaScript files will be loaded via script tags in HTML
// since they're not modules and may depend on global variables

// Re-export for modules that want to import
export * from '../lib';
