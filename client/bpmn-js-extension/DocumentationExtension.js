import { is } from "bpmn-js/lib/util/ModelUtil";
import { marked } from "marked";

export default class DocumentationExtension {
  constructor(eventBus, elementRegistry, modeling, moddle) {
    this._eventBus = eventBus;
    this._elementRegistry = elementRegistry;
    this._modeling = modeling;
    this._moddle = moddle;
    this._currentElement = null;
    this._sidebar = null;
    this._resizeObserver = null;
    this._saveTimeout = null;
    this._wasVisible = false;

    this._initializeSidebar();

    eventBus.on("element.click", (event) => {
      const { element } = event;
      this._handleElementClick(element);
    });

    eventBus.on("selection.changed", (event) => {
      const { newSelection } = event;
      if (newSelection && newSelection.length > 0) {
        this._handleElementClick(newSelection[0]);
      } else {
        this._hideSidebar();
      }
    });

    // Also listen for connection clicks specifically
    eventBus.on("connection.click", (event) => {
      const { element } = event;
      this._handleElementClick(element);
    });

    // Also listen for canvas clicks to hide sidebar
    eventBus.on("canvas.click", (event) => {
      // Small delay to let selection.changed fire first
      setTimeout(() => {
        if (!this._currentElement) {
          this._hideSidebar();
        }
      }, 10);
    });

    // Initial positioning
    setTimeout(() => {
      this._updateSidebarPosition();
      this._setupResizeObserver();
      this._setupViewObserver();
    }, 100);
  }

  _initializeSidebar() {
    const sidebar = document.createElement("div");
    sidebar.id = "documentation-sidebar";
    sidebar.className = "documentation-sidebar";
    sidebar.style.display = "none"; // Start hidden
    sidebar.innerHTML = `
      <div class="documentation-header">
        <div class="header-content">
          <div class="title-row">
            <h3>Documentation</h3>
            <button class="help-btn" id="help-btn">?</button>
          </div>
          <div class="element-metadata" id="element-metadata">
            <span class="element-name" id="element-name"></span>
          </div>
        </div>
        <button class="close-btn" id="close-sidebar">×</button>
      </div>
      <div class="help-popover" id="help-popover">
        <div class="help-content">
          <h4>Documentation Panel Guide</h4>
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
        </div>
      </div>
      <div class="documentation-content">
        <div class="documentation-preview" id="doc-preview"></div>
        <div class="documentation-bottom">
          <div class="resize-handle" id="resize-handle"></div>
          <div class="documentation-editor">
            <textarea id="doc-textarea" placeholder="Write documentation in Markdown..."></textarea>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(sidebar);
    this._sidebar = sidebar;

    document.getElementById("close-sidebar").addEventListener("click", () => {
      this._hideSidebar();
    });

    document.getElementById("help-btn").addEventListener("click", () => {
      this._toggleHelpPopover();
    });

    // Close popover when clicking outside
    document.addEventListener("click", (event) => {
      const helpPopover = document.getElementById("help-popover");
      const helpBtn = document.getElementById("help-btn");

      if (
        helpPopover &&
        helpPopover.classList.contains("visible") &&
        !helpPopover.contains(event.target) &&
        !helpBtn.contains(event.target)
      ) {
        this._hideHelpPopover();
      }
    });

    const textarea = document.getElementById("doc-textarea");
    textarea.addEventListener("input", () => {
      this._updatePreview();
      this._saveDocumentationLive();
    });

    this._setupResizeHandle();
  }

  _handleElementClick(element) {
    if (!element || !element.businessObject) {
      this._currentElement = null;
      this._hideSidebar();
      return;
    }

    const documentation = this._getElementDocumentation(element);

    if (documentation || this._hasDocumentationCapability(element)) {
      this._currentElement = element;
      this._showSidebar(documentation || "");
    } else {
      this._currentElement = null;
      this._hideSidebar();
    }
  }

  _getElementDocumentation(element) {
    const businessObject = element.businessObject;

    if (
      businessObject.documentation &&
      businessObject.documentation.length > 0
    ) {
      return businessObject.documentation[0].text;
    }

    return null;
  }

  _hasDocumentationCapability(element) {
    return element.businessObject;
  }

  _showSidebar(documentation) {
    const textarea = document.getElementById("doc-textarea");
    textarea.value = documentation || "";
    this._updateElementMetadata();
    this._updatePreview();
    this._updateSidebarPosition();
    this._sidebar.style.display = "flex";
    this._sidebar.classList.add("visible");
    this._wasVisible = true;
  }

  _hideSidebar() {
    this._wasVisible = this._sidebar.classList.contains("visible");
    this._sidebar.classList.remove("visible");
    this._sidebar.style.display = "none";
  }

  _toggleHelpPopover() {
    const helpPopover = document.getElementById("help-popover");
    if (helpPopover.classList.contains("visible")) {
      this._hideHelpPopover();
    } else {
      this._showHelpPopover();
    }
  }

  _showHelpPopover() {
    const helpPopover = document.getElementById("help-popover");
    helpPopover.classList.add("visible");
  }

  _hideHelpPopover() {
    const helpPopover = document.getElementById("help-popover");
    helpPopover.classList.remove("visible");
  }

  _updateSidebarPosition() {
    const propertiesPanel =
      document.querySelector(".bio-properties-panel-container") ||
      document.querySelector(".djs-properties-panel") ||
      document.querySelector('[data-tab="properties"]') ||
      document.querySelector(".properties-panel");

    if (propertiesPanel) {
      const panelRect = propertiesPanel.getBoundingClientRect();
      const panelWidth = panelRect.width;
      const panelTop = panelRect.top;

      // Position sidebar to the left of the properties panel
      this._sidebar.style.right = `${panelWidth}px`;
      this._sidebar.style.width = "350px";
      this._sidebar.style.top = `${Math.max(panelTop, 0)}px`;
      this._sidebar.style.height = `${
        window.innerHeight - Math.max(panelTop, 0)
      }px`;
    } else {
      // Fallback positioning if properties panel not found
      this._sidebar.style.right = "300px";
      this._sidebar.style.width = "350px";
      this._sidebar.style.top = "0px";
      this._sidebar.style.height = "100vh";
    }
  }

  _setupResizeObserver() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }

    // Look for properties panel with various selectors
    const propertiesPanel =
      document.querySelector(".bio-properties-panel-container") ||
      document.querySelector(".djs-properties-panel") ||
      document.querySelector('[data-tab="properties"]') ||
      document.querySelector(".properties-panel");

    if (propertiesPanel && window.ResizeObserver) {
      this._resizeObserver = new ResizeObserver(() => {
        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
          this._updateSidebarPosition();
        });
      });

      this._resizeObserver.observe(propertiesPanel);

      // Also observe the parent container for position changes
      const parentContainer = propertiesPanel.parentElement;
      if (parentContainer) {
        this._resizeObserver.observe(parentContainer);
      }

      // Observe the entire right panel area
      const rightPanel =
        document.querySelector(".djs-properties-panel-parent") ||
        document.querySelector(".properties-panel-parent") ||
        propertiesPanel.closest(".panel");
      if (rightPanel && rightPanel !== propertiesPanel) {
        this._resizeObserver.observe(rightPanel);
      }
    }

    // More frequent position updates only when visible
    let rafId;
    const updatePosition = () => {
      if (
        this._sidebar &&
        this._sidebar.classList.contains("visible") &&
        this._sidebar.style.display !== "none"
      ) {
        this._updateSidebarPosition();
      }
      rafId = requestAnimationFrame(updatePosition);
    };
    updatePosition();

    // Cleanup on destruction
    this._cleanupRaf = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };

    // Fallback: use window resize event
    window.addEventListener("resize", () => {
      this._updateSidebarPosition();
    });
  }

  _updatePreview() {
    const textarea = document.getElementById("doc-textarea");
    const preview = document.getElementById("doc-preview");
    const markdown = textarea.value;

    if (markdown && markdown.trim()) {
      preview.innerHTML = marked(markdown);
    } else {
      preview.innerHTML =
        "<p><em>No documentation yet. Start typing to see a preview.</em></p>";
    }
  }

  _setElementDocumentation(element, documentation) {
    const businessObject = element.businessObject;

    // Clear existing documentation
    if (businessObject.documentation) {
      businessObject.documentation.length = 0;
    }

    // Add new documentation if provided
    if (documentation && documentation.trim()) {
      if (!businessObject.documentation) {
        businessObject.documentation = [];
      }

      businessObject.documentation.push({
        $type: "bpmn:Documentation",
        text: documentation.trim(),
      });
    }

    // Fire element changed event to update the XML
    this._eventBus.fire("element.changed", { element });
  }

  _saveDocumentationLive() {
    if (!this._currentElement) return;

    // Clear existing timeout
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
    }

    // Debounce the save to avoid rapid-fire updates
    this._saveTimeout = setTimeout(() => {
      const textarea = document.getElementById("doc-textarea");
      const documentation = textarea.value;

      try {
        // Use moddle to create proper BPMN documentation object
        const properties = {};
        if (documentation && documentation.trim()) {
          const docObject = this._moddle.create("bpmn:Documentation", {
            text: documentation.trim(),
          });
          properties.documentation = [docObject];
        } else {
          properties.documentation = [];
        }

        this._modeling.updateProperties(this._currentElement, properties);
      } catch (error) {
        console.error("Error updating documentation:", error);
        // Fallback to direct businessObject update
        this._setElementDocumentation(this._currentElement, documentation);
      }
    }, 300); // Wait 300ms after user stops typing
  }

  _setupResizeHandle() {
    const resizeHandle = document.getElementById("resize-handle");
    const preview = document.getElementById("doc-preview");
    const bottomSection = document.querySelector(".documentation-bottom");
    let isResizing = false;
    let startY = 0;
    let startPreviewHeight = 0;
    let startBottomHeight = 0;

    resizeHandle.addEventListener("mousedown", (e) => {
      isResizing = true;
      startY = e.clientY;
      startPreviewHeight = preview.offsetHeight;
      startBottomHeight = bottomSection.offsetHeight;

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      e.preventDefault();
    });

    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const deltaY = e.clientY - startY;
      const newPreviewHeight = startPreviewHeight + deltaY;
      const newBottomHeight = startBottomHeight - deltaY;

      // Minimum heights
      const minHeight = 100;
      if (newPreviewHeight >= minHeight && newBottomHeight >= minHeight) {
        preview.style.height = `${newPreviewHeight}px`;
        bottomSection.style.height = `${newBottomHeight}px`;
      }
    };

    const handleMouseUp = () => {
      isResizing = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }

  _setupViewObserver() {
    // Watch for tab changes in the main content area
    const observer = new MutationObserver(() => {
      this._checkCurrentView();
    });

    // Observe the main app container for changes
    const appContainer =
      document.querySelector(".app-content") ||
      document.querySelector(".content") ||
      document.body;

    if (appContainer) {
      observer.observe(appContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }

    // Also listen for click events on tab buttons
    document.addEventListener("click", (e) => {
      if (
        e.target.closest("[data-tab]") ||
        e.target.closest(".bio-properties-panel-tab") ||
        e.target.closest(".tab")
      ) {
        setTimeout(() => this._checkCurrentView(), 100);
      }
    });
  }

  _updateElementMetadata() {
    if (!this._currentElement) return;

    const element = this._currentElement;
    const businessObject = element.businessObject;

    // Get element name/id
    const elementName = businessObject.name || businessObject.id || "Unnamed";

    // Update the metadata display
    document.getElementById("element-name").textContent = elementName;
  }

  _checkCurrentView() {
    // Check if XML editor is actually present and visible
    const xmlEditor = document.querySelector(".cm-editor");
    const codeEditor = document.querySelector(".CodeMirror");

    // Only hide if we can actually see an XML/code editor
    if (
      (xmlEditor && xmlEditor.offsetParent !== null) ||
      (codeEditor && codeEditor.offsetParent !== null)
    ) {
      if (this._sidebar.classList.contains("visible")) {
        this._hideSidebar();
      }
    }
  }
}

DocumentationExtension.$inject = [
  "eventBus",
  "elementRegistry",
  "modeling",
  "moddle",
];
