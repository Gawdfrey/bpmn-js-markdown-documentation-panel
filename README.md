# BPMN Documentation Panel

![Compatible with Camunda Modeler version 5](https://img.shields.io/badge/Modeler_Version-5.0.0+-blue.svg) ![Plugin Type](https://img.shields.io/badge/Plugin_Type-BPMN-orange.svg) ![Documentation](https://img.shields.io/badge/Feature-Documentation-green.svg) ![Markdown](https://img.shields.io/badge/Format-Markdown-blue.svg)

A comprehensive documentation management plugin for Camunda Modeler that enables you to create, manage, and navigate rich markdown documentation for your BPMN diagrams with interactive element linking and coverage tracking.

## ✨ Features

### 📝 **Rich Markdown Documentation**

- Write documentation for any BPMN element using full markdown syntax
- Support for **bold**, _italic_, `code`, lists, and more
- Live preview with real-time rendering
- Auto-save functionality

### 🔗 **Interactive Element Linking**

- Create clickable links between BPMN elements using `[Element Name](#ElementId)` syntax
- Smart autocomplete with element suggestions when typing `#` in links
- Click links in documentation to jump directly to referenced elements
- Support for external URLs alongside internal element references

### 📊 **Documentation Overview & Management**

- **Coverage tracking** - Visual progress bar showing documentation completion
- **Element index** - Browse all elements with documentation status indicators
- **Global search** - Find elements by ID, name, or documentation content
- **Smart filtering** - View documented, undocumented, or all elements
- **Quick navigation** - Click any element to jump to its documentation

### 🎯 **Professional UI/UX**

- Modern dual-tab interface (Element editing / Overview)
- Color-coded status indicators (green for documented, yellow for undocumented)
- Keyboard shortcuts and navigation
- Responsive design that integrates seamlessly with Camunda Modeler

## 🏗️ Repository Structure

This is a **monorepo** containing:

```
bpmn-js-markdown-documentation-panel/
├── packages/
│   └── bpmn-js-markdown-documentation-panel/  # Main plugin package
├── examples/
│   └── bpmn-viewer-example/                    # React TypeScript example
├── .github/                                    # CI/CD workflows
└── docs/                                       # Documentation
```

- **`packages/bpmn-js-markdown-documentation-panel/`** - The main plugin package
- **`examples/bpmn-viewer-example/`** - React TypeScript example showing integration
- **`.github/`** - GitHub Actions for CI/CD, quality checks, and releases

## 🚀 Installation

This plugin is built with dual exports to support both browser ESM and Electron CommonJS environments:

- **Browser/bpmn-js**: ESM format for modern web applications
- **Camunda Modeler**: CommonJS format for Electron-based plugin system

### For Camunda Modeler

1. **Download or clone** this repository:

   ```bash
   git clone https://github.com/your-username/bpmn-js-markdown-documentation-panel.git
   cd bpmn-js-markdown-documentation-panel
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Build the plugin:**

   ```bash
   pnpm run build
   ```

4. **Link to Camunda Modeler:**
   Create a symbolic link from the plugin directory to your Camunda Modeler plugins folder:

   **Windows:**

   ```cmd
   mklink /d "%APPDATA%\camunda-modeler\plugins\bpmn-js-markdown-documentation-panel" "path\to\this\repo\packages\bpmn-js-markdown-documentation-panel"
   ```

   **macOS/Linux:**

   ```bash
   ln -s "/path/to/this/repo/packages/bpmn-js-markdown-documentation-panel" "~/Library/Application Support/camunda-modeler/plugins/bpmn-js-markdown-documentation-panel"
   ```

5. **Restart Camunda Modeler** to load the plugin

### For Custom bpmn-js Applications

You can also integrate this documentation panel directly into your custom bpmn-js applications:

1. **Install the plugin package:**

   ```bash
   pnpm install bpmn-js-markdown-documentation-panel
   ```

2. **Import the module in your application:**

   ```javascript
   import BpmnModeler from "bpmn-js/lib/Modeler";
   import { DocumentationExtension } from "bpmn-js-markdown-documentation-panel";
   import "bpmn-js-markdown-documentation-panel/dist/style.css";

   const modeler = new BpmnModeler({
     container: "#canvas",
     additionalModules: [DocumentationExtension],
   });
   ```

## 📖 Usage

### Basic Documentation

1. Open any BPMN diagram in Camunda Modeler
2. Click on any BPMN element (tasks, gateways, events, etc.)
3. The documentation panel will appear on the right side
4. Start typing in the markdown editor to add documentation
5. See live preview above the editor

### Element Linking

1. In the markdown editor, create a link: `[Go to next task](#Task_ProcessPayment)`
2. When typing `#` inside parentheses, you'll see autocomplete suggestions
3. Use arrow keys to navigate and Enter to select
4. Links in the preview are clickable and will select the referenced element

### Documentation Overview

1. Click the "Overview" tab in the documentation panel
2. See coverage statistics and progress bar
3. Use the search box to find specific elements
4. Filter by documentation status using the buttons
5. Click any element to jump to its documentation

## 🛠️ Development

### Quick Start

```bash
# Install dependencies
pnpm install

# Start development mode (builds + watches)
pnpm run dev

# Run all quality checks
pnpm run lint
pnpm run type-check
pnpm run knip

# Build for production
pnpm run build
```

### Available Commands

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

See [CLAUDE.md](./CLAUDE.md) for detailed development documentation.

### Release Management with Changesets

This project uses [changesets](https://github.com/changesets/changesets) for version management and releasing:

```bash
# Create a changeset for your changes
pnpm changeset

# Version packages based on changesets
pnpm changeset:version

# Publish packages to npm
pnpm changeset:publish
```

**Release Workflow:**

1. **Make your changes** - Implement features or bug fixes
2. **Create a changeset** - Run `pnpm changeset` and describe your changes
3. **Commit and push** - Include your changes and the generated changeset files
4. **Automated release** - GitHub Actions will:
   - Create a "Release" PR that versions packages and updates CHANGELOG.md
   - When you merge the Release PR, it automatically publishes to npm
   - Creates GitHub releases with release notes

The changeset CLI will guide you through selecting which packages to version and the type of change (major, minor, or patch).

**Manual Release (if needed):**

```bash
# Version packages locally
pnpm changeset:version

# Publish to npm
pnpm changeset:publish
```

## 📋 Example Use Cases

- **Process Documentation** - Document business logic for each task and decision point
- **Onboarding** - Create comprehensive guides for new team members
- **Compliance** - Maintain required documentation for regulatory purposes
- **Knowledge Management** - Capture domain expertise and business rules
- **Cross-referencing** - Link related elements to show process dependencies

## 🎯 Best Practices

1. **Document critical elements first** - Focus on complex tasks and decision gateways
2. **Use descriptive element names** - Makes linking and navigation easier
3. **Link related elements** - Create a web of interconnected documentation
4. **Keep it concise** - Use bullet points and clear headings
5. **Review coverage regularly** - Use the overview tab to track progress

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Start development: `pnpm run dev`
4. Make your changes
5. Run quality checks: `pnpm run lint && pnpm run type-check && pnpm run knip`
6. Submit a pull request

## 🔗 Related Resources

- [Camunda Modeler Plugin Documentation](https://docs.camunda.io/docs/components/modeler/desktop-modeler/plugins/)
- [Markdown Syntax Guide](https://www.markdownguide.org/basic-syntax/)
- [BPMN 2.0 Specification](https://www.omg.org/spec/BPMN/2.0/)
- [bpmn-js Documentation](https://github.com/bpmn-io/bpmn-js)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
