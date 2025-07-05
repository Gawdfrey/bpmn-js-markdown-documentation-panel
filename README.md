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

## 🚀 Installation

### For Camunda Modeler

1. **Download or clone** this plugin to your local machine
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Build the plugin:**
   ```bash
   npm run bundle
   ```
4. **Link to Camunda Modeler:**
   Create a symbolic link from the plugin directory to your Camunda Modeler plugins folder:

   **Windows:**

   ```cmd
   mklink /d "%APPDATA%\camunda-modeler\plugins\bpmn-documentation-panel" "path\to\this\plugin"
   ```

   **macOS/Linux:**

   ```bash
   ln -s "/path/to/this/plugin" "~/Library/Application Support/camunda-modeler/plugins/bpmn-documentation-panel"
   ```

5. **Restart Camunda Modeler** to load the plugin

### For Custom bpmn-js Applications

You can also integrate this documentation panel directly into your custom bpmn-js applications:

1. **Install the plugin package:**
   ```bash
   npm install bpmn-documentation-panel
   ```

2. **Import the module in your application:**
   ```javascript
   import BpmnModeler from 'bpmn-js/lib/Modeler';
   import DocumentationExtension from 'bpmn-documentation-panel/client/bpmn-js-extension';
   
   // Import required dependencies
   import { marked } from 'marked';
   
   const modeler = new BpmnModeler({
     container: '#canvas',
     additionalModules: [
       DocumentationExtension
     ]
   });
   ```

3. **Include the stylesheet:**
   ```html
   <link rel="stylesheet" href="node_modules/bpmn-documentation-panel/style/style.css">
   ```

4. **Add the required dependencies to your project:**
   ```bash
   npm install marked classnames
   ```

#### Alternative: Include via CDN

For quick prototyping or simple integrations:

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/bpmn-documentation-panel/style/style.css">
</head>
<body>
  <div id="canvas"></div>
  
  <script src="https://unpkg.com/bpmn-js/dist/bpmn-modeler.development.js"></script>
  <script src="https://unpkg.com/marked/marked.min.js"></script>
  <script src="https://unpkg.com/bpmn-documentation-panel/dist/client.js"></script>
  
  <script>
    const modeler = new BpmnJS({
      container: '#canvas',
      additionalModules: [
        window.BpmnDocumentationPanel
      ]
    });
  </script>
</body>
</html>
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

### Development Setup

```bash
# Install dependencies
npm install

# Start development mode with file watching
npm run dev
```

### Building for Production

```bash
# Build the plugin for distribution
npm run all
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

## 🔗 Related Resources

- [Camunda Modeler Plugin Documentation](https://docs.camunda.io/docs/components/modeler/desktop-modeler/plugins/)
- [Markdown Syntax Guide](https://www.markdownguide.org/basic-syntax/)
- [BPMN 2.0 Specification](https://www.omg.org/spec/BPMN/2.0/)
