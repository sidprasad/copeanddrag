# Project Structure

This project has been refactored to provide clean separation of concerns with the following structure:

## Directory Structure

```
src/
├── lib/                    # Core reusable TypeScript library
│   ├── alloy-instance/     # Alloy XML parsing and data structures
│   ├── alloy-graph/        # Graph-related functionality
│   ├── forge-util/         # Forge-specific utilities
│   ├── layout/             # Layout algorithms and constraints
│   ├── logging/            # Logging infrastructure
│   ├── webcola-gen/        # WebCola integration
│   ├── renderer/           # Renderer types and server-side helpers
│   └── index.ts            # Library exports
├── client/                 # Client-side application
│   ├── public/             # Static assets (CSS, JS, images)
│   └── index.ts            # Client-side entry point
├── server/                 # Express server and views
│   ├── views/              # EJS templates
│   └── index.ts            # Server entry point
└── index.ts                # Main application entry point
```

## Architecture

### Core Library (`src/lib/`)
Contains all the core business logic, algorithms, and data structures that can be reused across different contexts. This includes:
- Alloy instance parsing and manipulation
- Layout algorithms and constraint solving
- Graph processing utilities
- Type definitions and interfaces

### Client (`src/client/`)
Contains the client-side application code and static assets:
- Bundled TypeScript entry point that imports the core library
- Static assets (CSS, JavaScript, images)
- Client-side specific functionality

### Server (`src/server/`)
Contains the Express server and server-side templates:
- RESTful API endpoints
- EJS view templates
- Server-specific middleware and configuration

## Build Process

The build process creates separate bundles:

- `npm run build:server` - Bundles the server with embedded dependencies
- `npm run build:client` - Bundles the client-side code
- `npm run build:lib` - Compiles the TypeScript library with type definitions
- `npm run build` - Builds all components

## Development

- `npm run dev` - Starts the development server with hot reload
- `npm run dev:server` - Starts only the server in development mode

## Benefits

1. **Separation of Concerns**: Core logic, client code, and server code are clearly separated
2. **Reusability**: The core library can be imported and used in different contexts
3. **Type Safety**: Full TypeScript support with proper type definitions
4. **Maintainability**: Clear module boundaries make the codebase easier to maintain
5. **Scalability**: Each component can be developed and deployed independently

## Migration Notes

- All core functionality has been moved to `src/lib/`
- Client assets moved from `src/public/` to `src/client/public/`
- Server views moved from `src/views/` to `src/server/views/`
- Import paths updated throughout the codebase
- Build scripts updated to handle the new structure
