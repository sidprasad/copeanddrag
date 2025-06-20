# Refactored Renderer Usage Guide

The renderer has been refactored to use dependency injection, making it more testable, reusable, and easier to reason about.

## Key Improvements

1. **Dependency Injection**: The renderer no longer directly accesses DOM elements or global state
2. **Configurable**: Scale factor and other settings are passed as configuration
3. **Testable**: Can be tested with mock dependencies
4. **Type-Safe**: Full TypeScript support with proper type definitions

## Usage Examples

### Basic Usage (Backwards Compatible)

For existing code that expects the old API:

```typescript
import { setupLayoutFromDOM } from '../lib/renderer';

// This finds #svg in the DOM and uses default configuration
setupLayoutFromDOM(nodes, edges, constraints, groups, width, height);
```

### Modern Usage (Recommended)

For new code, use the dependency injection approach:

```typescript
import { setupLayoutWithConfig, createRendererConfig } from '../lib/renderer';
import * as d3 from 'd3';

// Get your SVG element
const svgElement = d3.select("#my-svg");

// Create configuration
const config = createRendererConfig(
    5, // initial scale factor
    (newScaleFactor) => {
        console.log('Scale factor changed to:', newScaleFactor);
        // Handle scale factor changes
    },
    {
        performanceLogging: true,
        enableGridSnap: true
    }
);

// Optional: get scale factor input element
const scaleFactorInput = document.getElementById("scaleFactor") as HTMLInputElement;

// Setup the layout
setupLayoutWithConfig(
    svgElement,
    nodes, 
    edges, 
    constraints, 
    groups, 
    width, 
    height,
    config,
    scaleFactorInput
);
```

### Advanced Usage with Custom Dependencies

For maximum control:

```typescript
import { setupLayout, RendererConfig, LayoutDependencies } from '../lib/renderer';

const dependencies: LayoutDependencies = {
    svgElement: d3.select("#custom-svg"),
    scaleFactorInput: document.getElementById("my-scale-input") as HTMLInputElement,
    config: {
        scaleFactor: 3,
        onScaleFactorChange: (factor) => {
            // Custom scale factor handling
            updateUI(factor);
        },
        performanceLogging: true,
        enableGridSnap: false,
        enableOverlapMinimization: true
    }
};

setupLayout(nodes, edges, constraints, groups, width, height, dependencies);
```

## Configuration Options

The `RendererConfig` interface allows you to customize:

```typescript
interface RendererConfig {
    scaleFactor: number;                           // Initial scale factor
    onScaleFactorChange?: (scaleFactor: number) => void;  // Scale change callback
    performanceLogging?: boolean;                  // Enable performance logging
    enableGridSnap?: boolean;                      // Enable grid snapping
    enableOverlapMinimization?: boolean;           // Enable overlap minimization
}
```

## Testing

The refactored renderer can be easily tested:

```typescript
import { setupLayout } from '../lib/renderer';

// Mock dependencies for testing
const mockSvgElement = {
    select: jest.fn(),
    call: jest.fn(),
    // ... other D3 selection methods
};

const mockDependencies = {
    svgElement: mockSvgElement,
    config: {
        scaleFactor: 1,
        performanceLogging: false
    }
};

setupLayout(mockNodes, mockEdges, [], [], 800, 600, mockDependencies);
```

## Migration Guide

To migrate from the old renderer:

1. **Old Code:**
   ```javascript
   setupLayout(d3, nodes, edges, constraints, groups, width, height);
   ```

2. **New Code (Quick Migration):**
   ```typescript
   import { setupLayoutFromDOM } from '../lib/renderer';
   setupLayoutFromDOM(nodes, edges, constraints, groups, width, height);
   ```

3. **New Code (Recommended):**
   ```typescript
   import { setupLayoutWithConfig, createRendererConfig } from '../lib/renderer';
   
   const config = createRendererConfig(5);
   const svgElement = d3.select("#svg");
   
   setupLayoutWithConfig(svgElement, nodes, edges, constraints, groups, width, height, config);
   ```

## Benefits

- **Better Separation of Concerns**: Layout logic is separate from DOM access
- **Easier Testing**: Mock dependencies instead of DOM elements
- **More Flexible**: Can work with any SVG element, not just #svg
- **Type Safety**: Full TypeScript support with proper error checking
- **Configuration**: Centralized configuration instead of global state
- **Reusability**: Can create multiple renderers with different configurations
