# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Camunda Modeler Plugin** called "BPMN Documentation Panel" that provides comprehensive documentation management for BPMN diagrams. The plugin is built with TypeScript and integrates into Camunda Modeler as a client-side extension, offering markdown documentation with element linking and coverage tracking.

## Development Commands

### Build & Development

```bash
# Development mode with file watching (primary development command)
pnpm run dev

# Build production bundle
pnpm run bundle

# Alternative development mode
pnpm run start

# Full build pipeline
pnpm run all

# TypeScript type checking only
pnpm run type-check
```

### Testing

- No formal testing framework is currently configured
- Use TypeScript compilation (`pnpm run type-check`) for basic validation

## Architecture Overview

### Core Structure

- **Plugin Entry Point**: `index.ts` - Exports plugin configuration for Camunda Modeler
- **Client Registration**: `src/index.ts` - Registers the BPMN.js plugin extension
- **Main Extension**: `src/documentation-extension.ts` - Core functionality (968 lines)
- **Styling**: `src/style/style.css` - Complete UI styling for the documentation panel
- **Build Output**: `dist/client.js` - Webpack-bundled JavaScript for distribution

### Plugin Architecture Pattern

The plugin follows Camunda Modeler's extension architecture:

1. **Plugin Declaration** (`index.ts`): Defines plugin metadata and file references
2. **BPMN.js Module Registration** (`src/index.ts`): Uses `registerBpmnJSPlugin` to inject the extension
3. **Extension Implementation** (`src/documentation-extension.ts`): Main class that handles:
   - Event-driven UI updates (element.click, selection.changed)
   - DOM manipulation for sidebar and tabs
   - Markdown parsing and rendering
   - Element linking and autocomplete
   - Documentation persistence in BPMN model

### Key Dependencies & Integration Points

- **bpmn-js**: Core BPMN diagram library - provides element registry, event bus, modeling API
- **camunda-modeler-plugin-helpers**: Plugin registration utilities
- **marked**: Markdown parser for documentation rendering
- **TypeScript**: Primary development language with strict typing

### UI Architecture

- **Sidebar Panel**: Right-side documentation interface that appears on element selection
- **Dual-Tab Interface**:
  - Element tab: Markdown editor with live preview
  - Overview tab: Coverage tracking and element management
- **Smart Autocomplete**: Context-aware element suggestions when typing `#` in markdown links
- **Element Linking**: Clickable cross-references using `[text](#elementId)` syntax

### Data Persistence

- Documentation is stored directly in BPMN element properties
- No external database required - documentation travels with the .bpmn file
- Uses BPMN moddle API for property manipulation
- Real-time synchronization between UI and model data

### Build System

- **Webpack** bundles TypeScript into single `client.js` file
- **Babel** transpilation with React presets (configured but not actively used)
- **Source maps** enabled for debugging
- **Node.js fallbacks** for browser compatibility (path, fs, os, electron)
- Entry point: `./src/index.ts` → Output: `./dist/client.js`

## Development Workflow

### Local Development

1. `pnpm install` - Install dependencies
2. `pnpm run dev` - Start file watching for development
3. Create symbolic link to Camunda Modeler plugins directory:
   - macOS/Linux: `ln -s "$(pwd)" "~/Library/Application Support/camunda-modeler/plugins/bpmn-documentation-panel"`
   - Windows: `mklink /d "%APPDATA%\camunda-modeler\plugins\bpmn-documentation-panel" "path\to\this\plugin"`
4. Restart Camunda Modeler to load changes

### Code Conventions

- **TypeScript strict mode** enabled with ES6 target
- **Event-driven architecture** - use BPMN.js event bus for reactivity
- **DOM manipulation** - Direct DOM API usage, no React/Vue framework
- **CSS custom properties** for theming and consistency
- **Error handling** - Comprehensive try/catch blocks with user feedback

### Distribution

- `pnpm run bundle` creates production build in `/dist/`
- Plugin can be distributed as npm package or direct installation
- Main files for distribution: `dist/client.js`, `src/style/style.css`, `index.js`
