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
    this.exportDocumentation();
  }

  /**
   * Export documentation in HTML format
   */
  exportDocumentation(): void {
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
      const htmlContent = this._generateHTMLExport(
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
  private _generateHTMLExport(elements: any[], processInfo: any): string {
    const totalElements = elements.length;
    const documentedCount = elements.filter((el) => el.hasDocumentation).length;
    const coveragePercentage =
      totalElements > 0
        ? Math.round((documentedCount / totalElements) * 100)
        : 0;

    const processTitle = processInfo.name || processInfo.id || "BPMN Process";

    // Generate table of contents
    const tocItems = elements
      .map(
        (el) => `<li><a href="#element-${el.id}">${el.name} (${el.id})</a></li>`
      )
      .join("");

    // Generate element sections
    const elementSections = elements
      .map((el) => {
        const markdownContent = el.documentation || "";
        const htmlContent = markdownContent
          ? marked(markdownContent)
          : "<p><em>No documentation available</em></p>";

        return `
        <div class="element-section" id="element-${el.id}">
          <h2 class="element-title">${el.name} (${el.id})</h2>
          <div class="element-meta">
            <span class="element-type">${el.type}</span>
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
  <title>${processTitle} - Documentation</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #ffffff;
      padding: 0;
      margin: 0;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
    }
    
    .header h1 {
      font-size: 2.5em;
      color: #2c3e50;
      margin-bottom: 10px;
      font-weight: 600;
    }
    
    .header .subtitle {
      font-size: 1.2em;
      color: #7f8c8d;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border: 1px solid #e9ecef;
      text-align: center;
    }
    
    .stat-number {
      font-size: 2em;
      font-weight: bold;
      color: #2c3e50;
      display: block;
    }
    
    .stat-label {
      color: #6c757d;
      font-size: 0.9em;
      margin-top: 5px;
    }
    
    .toc {
      background: #f8f9fa;
      padding: 20px;
      margin-bottom: 40px;
      border: 1px solid #e9ecef;
    }
    
    .toc h2 {
      color: #2c3e50;
      margin-bottom: 15px;
      font-size: 1.3em;
    }
    
    .toc ul {
      list-style: none;
    }
    
    .toc li {
      margin-bottom: 5px;
    }
    
    .toc a {
      color: #3498db;
      text-decoration: none;
      font-size: 0.95em;
    }
    
    .toc a:hover {
      text-decoration: underline;
    }
    
    .element-section {
      margin-bottom: 40px;
      padding: 20px;
      background: #ffffff;
      border: 1px solid #e9ecef;
    }
    
    .element-title {
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 1.5em;
      font-weight: 600;
    }
    
    .element-meta {
      margin-bottom: 20px;
    }
    
    .element-type {
      display: inline-block;
      background: #e9ecef;
      color: #495057;
      padding: 4px 8px;
      font-size: 0.8em;
      border: 1px solid #dee2e6;
      font-weight: 500;
    }
    
    .element-content {
      color: #2c3e50;
    }
    
    .element-content h1,
    .element-content h2,
    .element-content h3,
    .element-content h4,
    .element-content h5,
    .element-content h6 {
      color: #2c3e50;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    .element-content p {
      margin-bottom: 15px;
    }
    
    .element-content ul,
    .element-content ol {
      margin-bottom: 15px;
      padding-left: 20px;
    }
    
    .element-content li {
      margin-bottom: 5px;
    }
    
    .element-content code {
      background: #f8f9fa;
      padding: 2px 4px;
      border: 1px solid #e9ecef;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.9em;
    }
    
    .element-content pre {
      background: #f8f9fa;
      padding: 15px;
      border: 1px solid #e9ecef;
      overflow-x: auto;
      margin-bottom: 15px;
    }
    
    .element-content blockquote {
      border-left: 4px solid #3498db;
      padding-left: 15px;
      margin: 15px 0;
      color: #7f8c8d;
      font-style: italic;
    }
    
    .element-content table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    
    .element-content th,
    .element-content td {
      padding: 10px;
      border: 1px solid #e9ecef;
      text-align: left;
    }
    
    .element-content th {
      background: #f8f9fa;
      font-weight: 600;
    }
    
    .element-content a {
      color: #3498db;
      text-decoration: none;
    }
    
    .element-content a:hover {
      text-decoration: underline;
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 20px 10px;
      }
      
      .header h1 {
        font-size: 2em;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
    
    @media print {
      .container {
        max-width: none;
        padding: 20px;
      }
      
      .element-section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${processTitle}</h1>
      <div class="subtitle">Process Documentation</div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-number">${totalElements}</span>
        <div class="stat-label">Total Elements</div>
      </div>
      <div class="stat-card">
        <span class="stat-number">${documentedCount}</span>
        <div class="stat-label">Documented</div>
      </div>
      <div class="stat-card">
        <span class="stat-number">${coveragePercentage}%</span>
        <div class="stat-label">Coverage</div>
      </div>
    </div>
    
    <div class="toc">
      <h2>Table of Contents</h2>
      <ul>
        ${tocItems}
      </ul>
    </div>
    
    <div class="elements">
      ${elementSections}
    </div>
  </div>
</body>
</html>`;
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
