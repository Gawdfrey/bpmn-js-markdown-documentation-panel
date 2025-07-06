import { marked } from "marked";
import type { IExportManager } from "../types/interfaces";

export class ExportManager implements IExportManager {
  private _elementRegistry: any;
  private _moddle: any;
  private _canvas: any;

  constructor(elementRegistry: any, moddle: any, canvas: any) {
    this._elementRegistry = elementRegistry;
    this._moddle = moddle;
    this._canvas = canvas;
  }

  setupExportEventListeners(): void {
    // Setup export functionality after DOM is ready
    setTimeout(() => {
      document.getElementById("export-btn")?.addEventListener("click", () => {
        this.handleExport();
      });
    }, 100);
  }

  handleExport(): void {
    this.exportDocumentation().catch((error) => {
      console.error("Export failed:", error);
      this._showNotification("Export failed", "error");
    });
  }

  /**
   * Export documentation in HTML format
   */
  async exportDocumentation(): Promise<void> {
    try {
      // Get process information
      const processInfo = this._getProcessInfo();

      // Get all elements with documentation
      const elements = this._getAllElementsWithDocumentation();

      // Filter to only include documented elements
      const documentedElements = elements.filter(
        (el: any) => el.hasDocumentation
      );

      if (documentedElements.length === 0) {
        this._showNotification(
          "No documented elements found to export",
          "warning"
        );
        return;
      }

      // Generate HTML export
      const htmlContent = await this._generateHTMLExport(
        documentedElements,
        processInfo
      );

      // Create filename
      const processName = processInfo.name || processInfo.id || "Process";
      const filename = `${processName}_Documentation.html`;

      // Download the file
      this._downloadFile(htmlContent, filename, "text/html");

      this._showNotification(
        `Documentation exported successfully (${documentedElements.length} elements)`,
        "success"
      );
    } catch (error) {
      console.error("Export failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this._showNotification(`Export failed: ${errorMessage}`, "error");
    }
  }

  /**
   * Get BPMN diagram as SVG
   */
  private async _getDiagramSVG(): Promise<string> {
    try {
      // Get the canvas container and extract the SVG
      const canvasContainer = this._canvas.getContainer();
      const svgElement = canvasContainer.querySelector("svg");

      if (svgElement) {
        // Create a copy of the SVG to avoid modifying the original
        const svgCopy = svgElement.cloneNode(true) as SVGElement;

        // Get all elements to calculate the full diagram bounds
        const allElements = this._elementRegistry.getAll();
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        // Calculate the bounding box of all elements
        allElements.forEach((element: any) => {
          if (
            element.x !== undefined &&
            element.y !== undefined &&
            element.width !== undefined &&
            element.height !== undefined
          ) {
            minX = Math.min(minX, element.x);
            minY = Math.min(minY, element.y);
            maxX = Math.max(maxX, element.x + element.width);
            maxY = Math.max(maxY, element.y + element.height);
          }
        });

        // Add padding around the diagram
        const padding = 50;
        const diagramWidth = maxX - minX;
        const diagramHeight = maxY - minY;

        // Calculate viewBox to show the entire diagram with padding
        const viewBoxX = minX - padding;
        const viewBoxY = minY - padding;
        const viewBoxWidth = diagramWidth + padding * 2;
        const viewBoxHeight = diagramHeight + padding * 2;

        // Set the viewBox to show the entire diagram
        const viewBox = `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`;
        svgCopy.setAttribute("viewBox", viewBox);

        // Set reasonable dimensions while maintaining aspect ratio
        const aspectRatio = viewBoxWidth / viewBoxHeight;
        let svgWidth = 800;
        let svgHeight = 600;

        if (aspectRatio > svgWidth / svgHeight) {
          // Diagram is wider, constrain by width
          svgHeight = svgWidth / aspectRatio;
        } else {
          // Diagram is taller, constrain by height
          svgWidth = svgHeight * aspectRatio;
        }

        svgCopy.setAttribute("width", Math.round(svgWidth).toString());
        svgCopy.setAttribute("height", Math.round(svgHeight).toString());

        // Add background
        const background = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        background.setAttribute("x", viewBoxX.toString());
        background.setAttribute("y", viewBoxY.toString());
        background.setAttribute("width", viewBoxWidth.toString());
        background.setAttribute("height", viewBoxHeight.toString());
        background.setAttribute("fill", "#ffffff");
        svgCopy.insertBefore(background, svgCopy.firstChild);

        return svgCopy.outerHTML;
      }

      return "";
    } catch (error) {
      console.error("Error getting diagram SVG:", error);
      return "";
    }
  }

  /**
   * Get all elements with their documentation status
   */
  private _getAllElementsWithDocumentation(): any[] {
    const elements: any[] = [];
    const seenIds = new Set();
    const allElements = this._elementRegistry.getAll();

    allElements.forEach((element: any) => {
      if (element.businessObject?.id) {
        const bo = element.businessObject;
        const elementId = bo.id;

        if (seenIds.has(elementId)) {
          return;
        }

        seenIds.add(elementId);
        const documentation = this._getElementDocumentation(element);

        elements.push({
          id: elementId,
          name: bo.name || "Unnamed",
          type: this._getElementTypeName(element),
          hasDocumentation: !!documentation?.trim(),
          documentation: documentation || "",
          element: element,
        });
      }
    });

    return elements.sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Get documentation for a specific element
   */
  private _getElementDocumentation(element: any): string {
    if (!element || !element.businessObject) return "";

    const bo = element.businessObject;
    if (bo.documentation && bo.documentation.length > 0) {
      return bo.documentation[0].text || "";
    }
    return "";
  }

  /**
   * Get element type name for display
   */
  private _getElementTypeName(element: any): string {
    if (!element || !element.businessObject) return "Unknown";

    const bo = element.businessObject;
    const type = bo.$type || "";

    // Clean up type names for display
    if (type.includes(":")) {
      const typeName = type.split(":")[1];
      return typeName.replace(/([A-Z])/g, " $1").trim();
    }

    return type || "Unknown";
  }

  /**
   * Generate HTML export content
   */
  private async _generateHTMLExport(
    elements: any[],
    processInfo: any
  ): Promise<string> {
    const totalElements = elements.length;
    const documentedCount = elements.filter((el) => el.hasDocumentation).length;
    const undocumentedCount = totalElements - documentedCount;
    const coveragePercentage =
      totalElements > 0
        ? Math.round((documentedCount / totalElements) * 100)
        : 0;

    const processTitle = processInfo.name || processInfo.id || "BPMN Process";

    // Get diagram SVG
    const diagramSVG = await this._getDiagramSVG();

    // Generate table of contents
    const tocItems = elements
      .map(
        (el) =>
          `<li><a href="#element-${el.id}" class="toc-link">${el.name} (${el.id})</a></li>`
      )
      .join("");

    // Generate element sections
    const elementSections = elements
      .map((el) => {
        const markdownContent = el.documentation || "";
        const htmlContent = markdownContent
          ? marked(markdownContent)
          : "<p class='no-documentation'><em>No documentation available</em></p>";

        return `
        <div class="element-section" id="element-${el.id}">
          <div class="element-header">
            <div class="element-icon">${this._getElementIcon(el.type)}</div>
            <div class="element-title-info">
              <h2 class="element-title">${el.name}</h2>
              <div class="element-meta">
                <span class="element-type">${el.type}</span>
                <span class="element-id">${el.id}</span>
              </div>
            </div>
          </div>
          <div class="element-content">
            ${htmlContent}
          </div>
        </div>
      `;
      })
      .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this._escapeHtml(processTitle)} - Documentation</title>
  <style>
    ${this._generateStyles()}
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1 class="main-title">${this._escapeHtml(processTitle)}</h1>
      <p class="subtitle">Process Documentation Report</p>
      <div class="export-info">
        <span class="export-date">Generated on ${new Date().toLocaleDateString()}</span>
      </div>
    </header>
    
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${totalElements}</div>
          <div class="stat-label">Total Elements</div>
        </div>
        <div class="stat-card documented">
          <div class="stat-number">${documentedCount}</div>
          <div class="stat-label">Documented</div>
        </div>
        <div class="stat-card undocumented">
          <div class="stat-number">${undocumentedCount}</div>
          <div class="stat-label">Undocumented</div>
        </div>
        <div class="stat-card coverage">
          <div class="stat-number">${coveragePercentage}%</div>
          <div class="stat-label">Coverage</div>
        </div>
      </div>
    </div>
    
    ${
      diagramSVG
        ? `
    <div class="diagram-section">
      <h2 class="section-title">Process Diagram</h2>
      <div class="diagram-container">
        ${diagramSVG}
      </div>
    </div>
    `
        : ""
    }
    
    <div class="toc-section">
      <h2 class="section-title">Table of Contents</h2>
      <div class="toc-container">
        <ul class="toc-list">
          ${tocItems}
        </ul>
      </div>
    </div>
    
    <div class="documentation-section">
      <h2 class="section-title">Element Documentation</h2>
      ${elementSections}
    </div>
    
    <div class="back-to-top">
      <button onclick="window.scrollTo({top: 0, behavior: 'smooth'})" class="back-to-top-btn">
        ↑ Back to Top
      </button>
    </div>
  </div>
  
  <script>
    // Add smooth scrolling for table of contents links
    document.querySelectorAll('.toc-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
    
    // Show/hide back to top button
    window.addEventListener('scroll', function() {
      const backToTop = document.querySelector('.back-to-top');
      if (window.scrollY > 300) {
        backToTop.style.display = 'block';
      } else {
        backToTop.style.display = 'none';
      }
    });
  </script>
</body>
</html>`;
  }

  /**
   * Get element icon based on type
   */
  private _getElementIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      "Start Event": "🟢",
      "End Event": "🔴",
      Task: "📋",
      "User Task": "👤",
      "Service Task": "⚙️",
      "Script Task": "📝",
      "Manual Task": "✋",
      "Receive Task": "📥",
      "Send Task": "📤",
      Gateway: "💠",
      "Exclusive Gateway": "⚡",
      "Parallel Gateway": "🔄",
      "Inclusive Gateway": "🌐",
      "Event Based Gateway": "📊",
      Subprocess: "📦",
      "Call Activity": "📞",
      Pool: "🏊",
      Lane: "🛤️",
      "Data Object": "📄",
      "Data Store": "🗄️",
      Message: "💬",
      Timer: "⏰",
      Signal: "📡",
      Error: "❌",
      Escalation: "⬆️",
      Compensation: "↩️",
      Conditional: "❓",
      Link: "🔗",
      Multiple: "🔢",
      Terminate: "🛑",
    };

    return iconMap[type] || "📋";
  }

  /**
   * Generate CSS styles for the HTML export
   */
  private _generateStyles(): string {
    return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0;
      background: white;
      box-shadow: 0 0 30px rgba(0,0,0,0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grain)"/></svg>');
      animation: grain 20s linear infinite;
      pointer-events: none;
    }
    
    @keyframes grain {
      0%, 100% { transform: translate(0, 0); }
      10% { transform: translate(-5%, -5%); }
      20% { transform: translate(-10%, 5%); }
      30% { transform: translate(5%, -10%); }
      40% { transform: translate(-5%, 15%); }
      50% { transform: translate(-10%, 5%); }
      60% { transform: translate(15%, 0%); }
      70% { transform: translate(0%, 10%); }
      80% { transform: translate(-15%, 0%); }
      90% { transform: translate(10%, 5%); }
    }
    
    .main-title {
      font-size: 3em;
      font-weight: 700;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      position: relative;
      z-index: 1;
    }
    
    .subtitle {
      font-size: 1.3em;
      opacity: 0.9;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    
    .export-info {
      position: relative;
      z-index: 1;
    }
    
    .export-date {
      font-size: 0.9em;
      opacity: 0.8;
      background: rgba(255,255,255,0.1);
      padding: 5px 15px;
      border-radius: 20px;
      display: inline-block;
    }
    
    .stats-section {
      padding: 40px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    
    .stat-card {
      background: white;
      padding: 30px 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transition: transform 0.3s ease;
      border-left: 4px solid #667eea;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
    }
    
    .stat-card.documented {
      border-left-color: #28a745;
    }
    
    .stat-card.undocumented {
      border-left-color: #dc3545;
    }
    
    .stat-card.coverage {
      border-left-color: #ffc107;
    }
    
    .stat-number {
      font-size: 2.5em;
      font-weight: 700;
      color: #2c3e50;
      display: block;
      margin-bottom: 5px;
    }
    
    .stat-label {
      color: #6c757d;
      font-size: 0.9em;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .diagram-section {
      padding: 40px;
      background: white;
      border-bottom: 1px solid #e9ecef;
    }
    
    .section-title {
      font-size: 2em;
      color: #2c3e50;
      margin-bottom: 30px;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
      display: inline-block;
    }
    
    .diagram-container {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .diagram-container svg {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .toc-section {
      padding: 40px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }
    
    .toc-container {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .toc-list {
      list-style: none;
      columns: 2;
      column-gap: 30px;
      column-fill: balance;
    }
    
    .toc-list li {
      break-inside: avoid;
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
    }
    
    .toc-list li::before {
      content: '▶';
      position: absolute;
      left: 0;
      color: #667eea;
      font-size: 0.8em;
    }
    
    .toc-link {
      color: #495057;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s ease;
    }
    
    .toc-link:hover {
      color: #667eea;
    }
    
    .documentation-section {
      padding: 40px;
      background: white;
    }
    
    .element-section {
      margin-bottom: 40px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 15px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: box-shadow 0.3s ease;
    }
    
    .element-section:hover {
      box-shadow: 0 4px 25px rgba(0,0,0,0.15);
    }
    
    .element-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px 30px;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .element-icon {
      font-size: 2em;
      opacity: 0.9;
    }
    
    .element-title-info {
      flex: 1;
    }
    
    .element-title {
      font-size: 1.5em;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .element-meta {
      display: flex;
      gap: 15px;
      align-items: center;
    }
    
    .element-type {
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8em;
      font-weight: 500;
    }
    
    .element-id {
      font-size: 0.9em;
      opacity: 0.8;
      font-family: 'Monaco', 'Consolas', monospace;
    }
    
    .element-content {
      padding: 30px;
      background: white;
    }
    
    .element-content h1,
    .element-content h2,
    .element-content h3,
    .element-content h4,
    .element-content h5,
    .element-content h6 {
      color: #2c3e50;
      margin-top: 25px;
      margin-bottom: 15px;
      font-weight: 600;
    }
    
    .element-content p {
      margin-bottom: 15px;
      line-height: 1.7;
    }
    
    .element-content ul,
    .element-content ol {
      margin-bottom: 15px;
      padding-left: 25px;
    }
    
    .element-content li {
      margin-bottom: 8px;
      line-height: 1.6;
    }
    
    .element-content code {
      background: #f1f3f4;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.9em;
      color: #e83e8c;
    }
    
    .element-content pre {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin-bottom: 20px;
      border-left: 4px solid #667eea;
    }
    
    .element-content blockquote {
      border-left: 4px solid #667eea;
      padding-left: 20px;
      margin: 20px 0;
      color: #6c757d;
      font-style: italic;
      background: #f8f9fa;
      padding: 15px 20px;
      border-radius: 0 8px 8px 0;
    }
    
    .element-content table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .element-content th,
    .element-content td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #e9ecef;
    }
    
    .element-content th {
      background: #667eea;
      color: white;
      font-weight: 600;
    }
    
    .element-content tr:hover {
      background: #f8f9fa;
    }
    
    .element-content a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }
    
    .element-content a:hover {
      color: #764ba2;
      text-decoration: underline;
    }
    
    .no-documentation {
      color: #6c757d;
      font-style: italic;
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .back-to-top {
      position: fixed;
      bottom: 30px;
      right: 30px;
      display: none;
      z-index: 1000;
    }
    
    .back-to-top-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 15px;
      border-radius: 50px;
      cursor: pointer;
      font-size: 1.1em;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    }
    
    .back-to-top-btn:hover {
      background: #764ba2;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }
    
    @media (max-width: 768px) {
      .container {
        margin: 0;
        box-shadow: none;
      }
      
      .header {
        padding: 40px 20px;
      }
      
      .main-title {
        font-size: 2.2em;
      }
      
      .stats-section,
      .diagram-section,
      .toc-section,
      .documentation-section {
        padding: 20px;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .toc-list {
        columns: 1;
      }
      
      .element-header {
        padding: 20px;
        flex-direction: column;
        text-align: center;
        gap: 10px;
      }
      
      .element-meta {
        justify-content: center;
      }
      
      .element-content {
        padding: 20px;
      }
    }
    
    @media print {
      body {
        background: white;
      }
      
      .container {
        box-shadow: none;
      }
      
      .back-to-top {
        display: none;
      }
      
      .element-section {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
    `;
  }

  /**
   * Escape HTML special characters
   */
  private _escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Get process information from BPMN diagram
   */
  private _getProcessInfo(): any {
    try {
      // Get the root element using canvas API
      const rootElement = this._canvas.getRootElement();

      if (rootElement?.businessObject) {
        const bo = rootElement.businessObject;
        return {
          name: bo.name || null,
          id: bo.id || null,
          filename: "process.bpmn",
          element: rootElement,
        };
      }

      return {
        name: null,
        id: null,
        filename: "process.bpmn",
        element: null,
      };
    } catch (error) {
      console.error("Error getting process info:", error);
      return {
        name: null,
        id: null,
        filename: "process.bpmn",
        element: null,
      };
    }
  }

  /**
   * Download file to user's system
   */
  private _downloadFile(
    content: string,
    filename: string,
    mimeType: string
  ): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Show notification to user
   */
  private _showNotification(
    message: string,
    type: "success" | "warning" | "error"
  ): void {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 16px",
      borderRadius: "4px",
      color: "white",
      fontSize: "14px",
      fontWeight: "500",
      zIndex: "10000",
      maxWidth: "300px",
      wordWrap: "break-word",
      backgroundColor:
        type === "success"
          ? "#28a745"
          : type === "warning"
            ? "#ffc107"
            : "#dc3545",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    });

    this._canvas.getContainer().appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  destroy(): void {
    // Remove event listeners if needed
    // Currently using global event listeners, so no cleanup needed
  }
}
