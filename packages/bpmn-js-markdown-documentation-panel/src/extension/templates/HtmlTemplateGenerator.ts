import type {
  IHtmlTemplateGenerator,
  IHtmlTemplateGeneratorOptions,
} from "../types/interfaces";

export class HtmlTemplateGenerator implements IHtmlTemplateGenerator {
  private _options: IHtmlTemplateGeneratorOptions;

  constructor(options: IHtmlTemplateGeneratorOptions) {
    this._options = options;
  }

  generateSidebarHTML(): string {
    const helpContent = this._generateHelpContent();
    const editorSection = this._generateEditorSection();

    return `
      <div class="documentation-header">
        <div class="header-content">
          <div class="title-row">
            <h3>Documentation${
              this._options.isModeler ? "" : " (Read-only)"
            }</h3>
            <button class="help-btn" id="help-btn">?</button>
          </div>
          <div class="element-metadata" id="element-metadata">
            <span class="element-name" id="element-name"></span>
          </div>
        </div>
        <button class="close-btn" id="close-sidebar">×</button>
      </div>
      <div class="tab-container">
        <div class="tab-buttons">
          <button class="tab-btn active" id="element-tab" data-tab="element">Element</button>
          <button class="tab-btn" id="overview-tab" data-tab="overview">Overview</button>
        </div>
        <button class="btn-export" id="export-btn">
          <span class="export-btn-icon">📤</span>
          <span>Export</span>
        </button>
      </div>
      <div class="help-popover" id="help-popover">
        <div class="help-content">
          <h4>Documentation Panel Guide</h4>
          ${helpContent}
        </div>
      </div>
      <div class="tab-content">
        <div class="tab-panel active" id="element-panel">
          <div class="documentation-content">
            <div class="documentation-preview" id="doc-preview"></div>
            ${editorSection}
          </div>
        </div>
        <div class="tab-panel" id="overview-panel">
          <div class="overview-content">
            <div class="overview-header">
              <div class="coverage-summary">
                <div class="coverage-stats">
                  <span class="stat-item">
                    <strong id="documented-count">0</strong> documented
                  </span>
                  <span class="stat-item">
                    <strong id="total-count">0</strong> total elements
                  </span>
                  <span class="stat-item">
                    <strong id="coverage-percentage">0%</strong> coverage
                  </span>
                </div>
                <div class="coverage-bar">
                  <div class="coverage-progress" id="coverage-progress"></div>
                </div>
              </div>
              <div class="overview-search">
                <input type="text" id="overview-search" placeholder="Search documentation..." />
                <div class="search-actions">
                  <button class="btn-small" id="show-documented">Documented</button>
                  <button class="btn-small" id="show-undocumented">Undocumented</button>
                  <button class="btn-small active" id="show-all">All</button>
                </div>
              </div>
            </div>
            <div class="overview-list" id="overview-list">
              <div class="overview-loading">Loading elements...</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _generateHelpContent(): string {
    return this._options.isModeler
      ? `
      <div class="help-section">
        <strong>What is this panel?</strong>
        <p>This panel allows you to add and view documentation for BPMN elements in your diagram.</p>
      </div>
      <div class="help-section">
        <strong>How to use:</strong>
        <ul>
          <li><strong>Select an element</strong> - Click on any BPMN element (task, gateway, event, etc.) to view or edit its documentation</li>
          <li><strong>Edit documentation</strong> - Use the editor below to write documentation in Markdown format</li>
          <li><strong>Preview</strong> - The top section shows a live preview of your formatted documentation</li>
        </ul>
      </div>
      <div class="help-section">
        <strong>Markdown support:</strong>
        <p>Use standard Markdown syntax for formatting: **bold**, *italic*, lists, links, and more.</p>
      </div>
      <div class="help-section">
        <strong>Creating links:</strong>
        <p>Link to other BPMN elements using their ID:</p>
        <code>[Element Name](#elementId)</code>
        <p>Example: <code>[Check Inventory](#Task_CheckInventory)</code></p>
        <p>Link to external resources:</p>
        <code>[External Link](https://example.com)</code>
        <p><em>Tip: Element IDs can be found in the properties panel or by selecting the element. Type # inside () for autocomplete suggestions.</em></p>
      </div>
    `
      : `
      <div class="help-section">
        <strong>What is this panel?</strong>
        <p>This panel displays documentation for BPMN elements in this diagram.</p>
      </div>
      <div class="help-section">
        <strong>How to use:</strong>
        <ul>
          <li><strong>Select an element</strong> - Click on any BPMN element (task, gateway, event, etc.) to view its documentation</li>
          <li><strong>Navigate</strong> - Click on element links to jump to related elements in the diagram</li>
          <li><strong>Overview</strong> - Use the Overview tab to see all documented elements</li>
        </ul>
      </div>
      <div class="help-section">
        <strong>Reading documentation:</strong>
        <p>Documentation is displayed in formatted view. Click on element links (shown in blue) to navigate to related elements in the diagram.</p>
      </div>
    `;
  }

  private _generateEditorSection(): string {
    return this._options.isModeler
      ? `
      <div class="documentation-bottom">
        <div class="resize-handle" id="resize-handle"></div>
        <div class="documentation-editor">
          <div class="editor-container">
            <textarea id="doc-textarea" placeholder="Write documentation in Markdown..."></textarea>
            <div class="autocomplete-dropdown" id="autocomplete-dropdown">
              <div class="autocomplete-list" id="autocomplete-list"></div>
            </div>
          </div>
        </div>
      </div>
    `
      : "";
  }
}
