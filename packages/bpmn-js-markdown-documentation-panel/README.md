# bpmn-js-markdown-documentation-panel

> Main plugin package for the BPMN Documentation Panel

This package contains the core plugin implementation that provides markdown documentation capabilities for BPMN diagrams in both Camunda Modeler and custom bpmn-js applications.

## 🏗️ Package Structure

```
src/
├── bpmn-js-entry.ts           # ESM entry point for bpmn-js
├── camunda-modeler-entry.ts   # CommonJS entry point for Camunda Modeler
├── index.js                   # Plugin manifest for Camunda Modeler
├── style.css                  # Complete UI styling
├── extension/                 # Core plugin logic
│   ├── index.ts              # Main extension class
│   ├── managers/             # Feature managers
│   │   ├── SidebarManager.ts
│   │   ├── TabManager.ts
│   │   ├── ViewManager.ts
│   │   ├── AutocompleteManager.ts
│   │   ├── ExportManager.ts
│   │   └── OverviewManager.ts
│   ├── templates/
│   │   └── HtmlTemplateGenerator.ts
│   └── types/
│       └── interfaces.ts
└── typings/                   # Type definitions
    └── camunda-modeler-plugin-helpers.d.ts
```

## 🛠️ Development

### Prerequisites

- Node.js >= 16.0.0
- pnpm >= 7.0.0

### Development Setup

```bash
# Install dependencies (from project root)
pnpm install

# Start development mode with file watching
pnpm --filter bpmn-js-markdown-documentation-panel run dev

# Or from this package directory
pnpm run dev
```

### Available Scripts

```bash
# Development mode with file watching (primary development command)
pnpm run dev

# Build production bundle
pnpm run bundle

# Full build pipeline (bundle + types)
pnpm run all

# TypeScript type checking only
pnpm run type-check

# Bundle analysis
pnpm run analyze
```

### Building for Production

```bash
# Build everything (bundle + types)
pnpm run all

# Or step by step
pnpm run bundle      # Build JavaScript bundles
pnpm run type-check  # Generate TypeScript declarations
```

## 📦 Build Output

The build process generates several files in the `dist/` directory:

- **`bpmn-js-entry.js`** - ESM build for direct bpmn-js integration
- **`camunda-modeler-entry.js`** - CommonJS build for Camunda Modeler
- **`index.js`** - Plugin manifest for Camunda Modeler
- **`style.css`** - Compiled CSS styles
- **`*.d.ts`** - TypeScript declaration files

## 🔧 Code Quality

This package uses several tools to maintain code quality:

- **Biome** - Fast linting and formatting with Prettier-compatible rules
- **Knip** - Automated detection of unused dependencies, exports, and types
- **TypeScript** - Strict type checking for enhanced reliability
- **Rolldown** - Fast bundling with tree-shaking

```bash
# Run all quality checks
pnpm run lint        # Biome linting
pnpm run format:check # Format checking
pnpm run type-check  # TypeScript checks
pnpm run knip        # Unused code detection (run from root)
```

## 🏛️ Architecture

### Plugin Entry Points

The plugin provides two entry points for different environments:

1. **`bpmn-js-entry.ts`** - Direct bpmn-js integration (ESM)
2. **`camunda-modeler-entry.ts`** - Camunda Modeler plugin (CommonJS)

### Core Extension

The main plugin logic is in `src/extension/index.ts`, which:

- Handles event-driven UI updates (`element.click`, `selection.changed`)
- Manages DOM manipulation for sidebar and tabs
- Provides markdown parsing and rendering
- Implements element linking and autocomplete
- Handles documentation persistence in BPMN model
- Adapts to viewer/modeler environments

### Manager Classes

Feature-specific managers handle different aspects:

- **SidebarManager** - Sidebar panel lifecycle
- **TabManager** - Tab switching and state
- **ViewManager** - Content rendering and updates
- **AutocompleteManager** - Element suggestions
- **ExportManager** - Documentation export
- **OverviewManager** - Coverage tracking and element index

## 🔗 Integration Points

### BPMN.js Dependencies

The plugin integrates with bpmn-js through:

- **Element Registry** - Access to diagram elements
- **Event Bus** - Reactive updates on element selection
- **Modeling API** - Property manipulation (when available)
- **Canvas** - DOM container management

### Camunda Modeler Integration

For Camunda Modeler, the plugin:

- Uses `registerBpmnJSPlugin` helper from `camunda-modeler-plugin-helpers`
- Provides `index.js` manifest with plugin metadata
- Supports both development and production modes

## 📊 Bundle Analysis

The build process includes bundle analysis using Sonda:

```bash
# Run bundle analysis
pnpm run analyze
```

This generates detailed reports about:

- Bundle size breakdown
- Dependency analysis
- Code splitting effectiveness
- Potential optimizations

## 🧪 Testing Integration

The plugin is tested through:

- **Example application** - Real-world integration testing
- **Type checking** - Compile-time validation
- **Linting** - Code quality enforcement
- **CI/CD pipeline** - Automated quality checks

## 🔄 Development Workflow

1. **Make changes** to source files
2. **Run development mode** - `pnpm run dev` (watches and rebuilds)
3. **Test in Camunda Modeler** - Plugin auto-reloads on rebuild
4. **Run quality checks** - `pnpm run lint && pnpm run type-check`
5. **Build for production** - `pnpm run all`

## 📋 Technical Notes

### DOM Attachment Strategy

Following project conventions, all DOM elements are attached via `getCanvasContainer()` rather than `document.body` to ensure proper scoping within the application context.

### Event-Driven Architecture

The plugin uses BPMN.js event bus for reactivity:

```typescript
eventBus.on("element.click", (event) => {
  // Handle element selection
});
```

### Viewer/Modeler Detection

The plugin adapts its interface based on available capabilities:

```typescript
const isModeler = !!modeling; // Modeling API available
```

## 🐛 Troubleshooting

### Common Issues

1. **Plugin not loading** - Check symbolic link and restart Camunda Modeler
2. **Build errors** - Ensure all dependencies are installed with `pnpm install`
3. **Type errors** - Run `pnpm run type-check` for detailed error information
4. **Styling issues** - Verify CSS build output in `dist/style.css`

### Debug Mode

Enable debug logging by setting localStorage in browser developer tools:

```javascript
localStorage.setItem("bpmn-documentation-debug", "true");
```
