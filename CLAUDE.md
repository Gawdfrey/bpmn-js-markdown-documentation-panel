# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **monorepo** for the "BPMN Documentation Panel" project - a comprehensive documentation management plugin for Camunda Modeler and bpmn-js applications. The plugin provides markdown documentation with element linking and coverage tracking for BPMN diagrams.

### Repository Structure

```
bpmn-js-markdown-documentation-panel/
├── packages/
│   └── bpmn-js-markdown-documentation-panel/  # Main plugin package
│       ├── src/                                # Plugin source code
│       ├── dist/                               # Built distribution files
│       └── webpack.config.js                   # Build configuration
├── examples/
│   └── bpmn-viewer-example/                    # React TypeScript example app
│       ├── src/                                # Example app source
│       └── public/                             # Static assets and sample BPMN
├── turbo.json                                  # Turborepo configuration
├── pnpm-workspace.yaml                         # pnpm workspace configuration
└── biome.json                                  # Biome linting and formatting config
```

## Development Commands

### Root Level (Monorepo Commands)

```bash
# Build all packages
pnpm run build

# Start development mode for all packages
pnpm run dev

# Format all code with Biome
pnpm run format

# Lint all packages
pnpm run lint

# Fix auto-fixable linting issues
pnpm run lint:fix

# Type check all packages
pnpm run type-check

# Check for unused dependencies and exports
pnpm run knip

# Clean all build artifacts
pnpm run clean
```

### Package-Specific Commands

#### Main Plugin (`packages/bpmn-js-markdown-documentation-panel/`)

```bash
# Development mode with file watching (primary development command)
pnpm --filter bpmn-js-markdown-documentation-panel run dev

# Build production bundle
pnpm --filter bpmn-js-markdown-documentation-panel run bundle

# Full build pipeline (bundle + types)
pnpm --filter bpmn-js-markdown-documentation-panel run all

# TypeScript type checking only
pnpm --filter bpmn-js-markdown-documentation-panel run type-check
```

#### Example App (`examples/bpmn-viewer-example/`)

```bash
# Start Vite development server
pnpm --filter bpmn-viewer-example run dev

# Build for production
pnpm --filter bpmn-viewer-example run build

# Preview production build
pnpm --filter bpmn-viewer-example run preview
```

## Architecture Overview

### Main Plugin Package

The core plugin is located in `packages/bpmn-js-markdown-documentation-panel/` and follows this structure:

- **Plugin Entry Points**:
  - `src/bpmn-js-entry.ts` - For direct bpmn-js integration
  - `src/camunda-modeler-entry.ts` - For Camunda Modeler plugin
- **Main Extension**: `src/extension/index.ts` - Core functionality (968 lines)
- **Export Service**: `src/extension/export-service.ts` - Documentation export functionality
- **Styling**: `src/style.css` - Complete UI styling for the documentation panel
- **Build Output**: `dist/` - Webpack-bundled JavaScript and TypeScript declarations

### Plugin Architecture Pattern

The plugin follows both Camunda Modeler and bpmn-js integration patterns:

1. **Camunda Modeler Plugin** (`src/camunda-modeler-entry.ts`): Uses `registerBpmnJSPlugin` helper
2. **Direct bpmn-js Integration** (`src/bpmn-js-entry.ts`): Exports extension module directly
3. **Extension Implementation** (`src/extension/index.ts`): Main class that handles:
   - Event-driven UI updates (element.click, selection.changed)
   - DOM manipulation for sidebar and tabs
   - Markdown parsing and rendering
   - Element linking and autocomplete
   - Documentation persistence in BPMN model
   - Viewer/Modeler compatibility via optional dependency injection

### Example Application

The example app (`examples/bpmn-viewer-example/`) demonstrates:

- **React TypeScript integration** with bpmn-js and the documentation plugin
- **Vite development server** with hot module reloading
- **Sample BPMN diagram** with rich documentation for testing
- **Plugin compatibility testing** in a real application environment

### Key Dependencies & Integration Points

- **bpmn-js**: Core BPMN diagram library - provides element registry, event bus, modeling API
- **camunda-modeler-plugin-helpers**: Plugin registration utilities (Camunda Modeler only)
- **marked**: Markdown parser for documentation rendering
- **TypeScript**: Primary development language with strict typing
- **React**: Used in example application for demonstration
- **Vite**: Build tool for example application

### UI Architecture

- **Sidebar Panel**: Right-side documentation interface that appears on element selection
- **Dual-Tab Interface**:
  - Element tab: Markdown editor with live preview
  - Overview tab: Coverage tracking and element management
- **Smart Autocomplete**: Context-aware element suggestions when typing `#` in markdown links
- **Element Linking**: Clickable cross-references using `[text](#elementId)` syntax
- **Viewer/Modeler Detection**: Adapts UI based on whether modeling capabilities are available

### Data Persistence

- Documentation is stored directly in BPMN element properties
- No external database required - documentation travels with the .bpmn file
- Uses BPMN moddle API for property manipulation
- Real-time synchronization between UI and model data

### Build System

#### Main Plugin

- **Webpack** bundles TypeScript into ES modules
- **TypeScript compiler** generates declaration files (.d.ts)
- **Babel** transpilation with React presets (configured but not actively used)
- **Source maps** enabled for debugging
- **Node.js fallbacks** for browser compatibility (path, fs, os, electron)
- **Entry points**: Multiple entries for different integration scenarios

#### Monorepo Build Orchestration

- **Turborepo** coordinates builds across packages
- **pnpm workspaces** manages dependencies and ensures consistent versions
- **Biome** provides fast linting and formatting with Prettier-compatible rules
- **Knip** analyzes code for unused dependencies, exports, and types
- **Parallel execution** of builds, linting, and type checking

## Development Workflow

### Local Development Setup

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Start development mode**:

   ```bash
   # Start all packages in development mode
   pnpm run dev

   # Or start specific packages
   pnpm --filter bpmn-js-markdown-documentation-panel run dev
   pnpm --filter bpmn-viewer-example run dev
   ```

3. **For Camunda Modeler development**:
   Create symbolic link to Camunda Modeler plugins directory:

   - macOS/Linux: `ln -s "$(pwd)/packages/bpmn-js-markdown-documentation-panel" "~/Library/Application Support/camunda-modeler/plugins/bpmn-documentation-panel"`
   - Windows: `mklink /d "%APPDATA%\camunda-modeler\plugins\bpmn-documentation-panel" "path\to\this\plugin\packages\bpmn-js-markdown-documentation-panel"`

4. **Restart Camunda Modeler** to load changes

### Code Quality

- **Biome Integration**: Fast linting and formatting with Prettier-compatible rules
- **Knip Integration**: Automated detection of unused dependencies, exports, and types
- **TypeScript strict mode** enabled with ES6 target
- **Import organization**: Automatic sorting and cleanup of imports
- **Event-driven architecture** - use BPMN.js event bus for reactivity
- **DOM manipulation** - Direct DOM API usage, no React/Vue framework in plugin
- **CSS custom properties** for theming and consistency
- **Error handling** - Comprehensive try/catch blocks with user feedback

### Testing

- **Example Application**: Use the React example app for interactive testing
- **TypeScript Compilation**: Use `pnpm run type-check` for basic validation
- **Sample BPMN Diagram**: Located in `examples/bpmn-viewer-example/public/sample-diagram.xml`
- **Cross-compatibility**: Test both viewer-only and modeler modes

### Distribution

#### Main Plugin Package

- `pnpm run build` creates production build in `packages/bpmn-js-markdown-documentation-panel/dist/`
- **Distribution files**:
  - `dist/bpmn-js-entry.js` + `.d.ts` - For direct bpmn-js integration
  - `dist/camunda-modeler-entry.js` + `.d.ts` - For Camunda Modeler
  - `dist/style.css` - UI styling
- **Package fields**: `main`, `types`, and `style` fields point to appropriate distribution files

#### Example Application

- `pnpm --filter bpmn-viewer-example run build` creates production build
- Demonstrates integration patterns for other applications
- Can be deployed as a standalone demo

### Monorepo Benefits

- **Unified Development**: Single repository for plugin and examples
- **Consistent Tooling**: Shared Biome configuration, TypeScript settings
- **Efficient Builds**: Turborepo caching and parallel execution
- **Example-Driven Development**: Real-world usage patterns alongside plugin code
- **Simplified Testing**: Easy integration testing between plugin and applications
