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

# Format and lint all code with Biome
pnpm run format-and-lint

# Fix auto-fixable linting and formatting issues
pnpm run format-and-lint:fix

# Type check all packages
pnpm run type-check

# Run all tests
pnpm run test

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
pnpm --filter bpmn-js-markdown-documentation-panel run build

# Build production bundle (same as build)
pnpm --filter bpmn-js-markdown-documentation-panel run bundle

# Full build pipeline (bundle + types)
pnpm --filter bpmn-js-markdown-documentation-panel run all

# TypeScript type checking only
pnpm --filter bpmn-js-markdown-documentation-panel run type-check

# Run tests with Vitest
pnpm --filter bpmn-js-markdown-documentation-panel run test

# Run tests with UI
pnpm --filter bpmn-js-markdown-documentation-panel run test:ui

# Run tests in browser
pnpm --filter bpmn-js-markdown-documentation-panel run test:browser

# Analyze bundle size
pnpm --filter bpmn-js-markdown-documentation-panel run build-analyze
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

- **Rolldown** bundles TypeScript into ES modules and CommonJS formats
- **TypeScript compiler** generates declaration files (.d.ts)
- **Dual build targets**: ESM for bpmn-js/browser, CommonJS for Camunda Modeler
- **Source maps** enabled for debugging
- **Sonda** for bundle analysis in production builds
- **Asset copying** plugin for style.css and other static files
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

- **Vitest**: Primary testing framework with support for UI and browser testing
- **Example Application**: Use the React example app for interactive testing
- **TypeScript Compilation**: Use `pnpm run type-check` for basic validation
- **Sample BPMN Diagram**: Located in `examples/bpmn-viewer-example/public/sample-diagram.xml`
- **Cross-compatibility**: Test both viewer-only and modeler modes
- **Test commands**: `test`, `test:ui`, `test:browser` for different testing modes

### Distribution

#### Main Plugin Package

- `pnpm run build` creates production build in `packages/bpmn-js-markdown-documentation-panel/dist/`
- **Distribution files**:
  - `dist/bpmn-js-entry.js` + `.d.ts` - ESM build for direct bpmn-js integration
  - `dist/camunda-modeler-entry.js` + `.d.ts` - CJS build for Camunda Modeler
  - `dist/style.css` - UI styling (copied from src)
- **Package fields**: `main`, `types`, and `exports` fields point to appropriate distribution files
- **Bundle analysis**: Production builds include bundle size analysis reports

#### Example Application

- `pnpm --filter bpmn-viewer-example run build` creates production build
- Demonstrates integration patterns for other applications
- Can be deployed as a standalone demo

### Version Management

This project uses [Changesets](https://github.com/changesets/changesets) for version management and automated releases.

#### Writing Changenotes with Changesets

When you make changes that should be included in a release, create a changeset:

```bash
# Create a changeset - this will prompt you for details
pnpm changeset
```

The changeset CLI will ask you:
1. **Which packages have changed?** - Select the packages that need version bumps
2. **What type of change?** - Choose the semver bump type:
   - **patch** - Bug fixes, small improvements (0.0.X)
   - **minor** - New features, non-breaking changes (0.X.0) 
   - **major** - Breaking changes (X.0.0)
3. **Summary of changes** - Write a clear, user-facing description

**Example changeset prompts:**
```
🦋  Which packages would you like to include?
· bpmn-js-markdown-documentation-panel

🦋  Which type of change is this for bpmn-js-markdown-documentation-panel?
· patch

🦋  Please enter a summary for this change:
· Fix help popover positioning and scroll behavior
```

This creates a markdown file in `.changeset/` with your change description.

#### Changeset Best Practices

- **Write user-facing descriptions** - Describe what users will experience, not implementation details
- **Use present tense** - "Fix positioning bug" not "Fixed positioning bug"
- **Be specific** - "Fix help popover scroll behavior" not "Fix bug"
- **Group related changes** - One changeset can cover multiple related fixes
- **Skip internal changes** - Don't create changesets for refactoring, test updates, or build changes that don't affect users

**Good changeset examples:**
```markdown
# patch
Fix help popover positioning relative to documentation panel

# minor  
Add CSS hot reloading support for development workflow

# patch
Improve scroll behavior in help popover and prevent canvas interference
```

**Manual changeset commands:**
```bash
# Version packages (usually done by CI)
pnpm changeset:version

# Publish packages (usually done by CI)
pnpm changeset:publish
```

## Release Workflow

This project uses a feature branch + PR workflow with automated releases via GitHub Actions.

### Creating a Release

Follow these steps to create a new release:

#### 1. Create a Feature/Release Branch

```bash
# Create and switch to a new branch
git checkout -b feat/help-popover-improvements
# or for bug fixes:
git checkout -b fix/popover-positioning
# or for releases:
git checkout -b release/v0.1.0
```

#### 2. Make Your Changes

Make your code changes, following the development workflow and testing guidelines.

#### 3. Create Changesets

For each logical change that affects users, create a changeset:

```bash
pnpm changeset
```

#### 4. Commit All Changes

Create a comprehensive commit message that summarizes all changes:

```bash
# Stage all changes
git add .

# Create a descriptive commit message
git commit -m "feat: improve help popover positioning and scroll behavior

- Fix help popover positioning to be relative to canvas container
- Add proper scroll event handling to prevent canvas interference  
- Enhance CSS with overscroll-behavior and touch scrolling
- Add CSS hot reloading support for development workflow
- Update Rolldown configuration to watch CSS files

Resolves positioning issues and improves development experience."
```

**Commit Message Guidelines:**
- Use conventional commit format: `type: description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Include a blank line followed by detailed bullet points
- Reference issues if applicable: `Fixes #123` or `Resolves #456`

#### 5. Push Branch and Create PR

```bash
# Push the branch to GitHub
git push -u origin feat/help-popover-improvements

# Create a pull request using GitHub CLI (recommended)
gh pr create --title "Improve help popover positioning and scroll behavior" --body "$(cat <<'EOF'
## Summary
- Fix help popover positioning relative to canvas container instead of viewport
- Add proper scroll event handling to prevent interference with BPMN canvas scrolling  
- Enhance CSS with better overflow behavior and touch scrolling support
- Add CSS hot reloading support for improved development workflow

## Changes Made
- Updated help popover creation to be sibling element of documentation sidebar
- Modified CSS positioning from `fixed` to `absolute` for canvas-relative positioning
- Added scroll event handlers specifically for help popover
- Enhanced Rolldown configuration with CSS file watching in development mode
- Added proper cleanup and debouncing for file watchers

## Test Plan
- [x] Help popover appears in correct position relative to documentation panel
- [x] Scrolling within help popover works without affecting BPMN canvas
- [x] CSS changes trigger automatic rebuilds in development mode
- [x] Build and type checking pass successfully

## Breaking Changes
None - this is a backward-compatible improvement.

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)"
```

**Alternative PR Creation (without GitHub CLI):**
1. Go to GitHub.com and navigate to your repository
2. Click "Compare & pull request" for your pushed branch
3. Fill in the title and description using the template above

#### 6. Automated Release Process

Once your PR is merged:

1. **GitHub Actions** automatically detects changesets
2. **Release PR** is created automatically by the Changesets action
3. **Review and merge** the release PR to trigger:
   - Version bumping based on changesets
   - Package publishing to npm
   - GitHub release creation with changelog

### Branch Naming Conventions

- `feat/feature-name` - New features
- `fix/bug-description` - Bug fixes  
- `docs/documentation-update` - Documentation changes
- `chore/maintenance-task` - Build, CI, or maintenance tasks
- `release/v1.2.3` - Release preparation branches

### PR Guidelines

- **Clear titles** - Summarize the main change
- **Detailed descriptions** - Explain what changed and why
- **Test plan** - Show how changes were tested
- **Breaking changes** - Clearly mark any breaking changes
- **Link issues** - Reference related GitHub issues

### Monorepo Benefits

- **Unified Development**: Single repository for plugin and examples
- **Consistent Tooling**: Shared Biome configuration, TypeScript settings
- **Efficient Builds**: Turborepo caching and parallel execution
- **Example-Driven Development**: Real-world usage patterns alongside plugin code
- **Simplified Testing**: Easy integration testing between plugin and applications
- **Automated Releases**: GitHub Actions with changeset-based versioning
