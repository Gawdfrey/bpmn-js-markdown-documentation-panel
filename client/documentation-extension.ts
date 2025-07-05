import { is } from "bpmn-js/lib/util/ModelUtil";
import { marked } from "marked";

declare module "camunda-modeler-plugin-helpers";

export default class DocumentationExtension {
  private _eventBus: any;
  private _elementRegistry: any;
  private _modeling: any;
  private _moddle: any;
  private _selection: any;
  private _canvas: any;
  private _currentElement: any;
  private _sidebar: HTMLElement | null;
  private _resizeObserver: any;
  private _selectedIndex: number;
  private _currentFilter: string;
  private _currentSearchTerm: string;
  private _wasVisible: boolean;
  private _cleanupRaf: any;
  private _isResizing: boolean;
  private _resizeStartX: number;
  private _resizeStartWidth: number;
  private _isVerticalResizing: boolean;
  private _resizeStartY: number;
  private _resizeStartHeight: number;
  private _customWidth: number | null;

  constructor(
    eventBus: any,
    elementRegistry: any,
    modeling: any,
    moddle: any,
    selection: any,
    canvas: any
  ) {
    this._eventBus = eventBus;
    this._elementRegistry = elementRegistry;
    this._modeling = modeling;
    this._moddle = moddle;
    this._selection = selection;
    this._canvas = canvas;
    this._currentElement = null;
    this._sidebar = null;
    this._resizeObserver = null;
    this._selectedIndex = -1;
    this._currentFilter = "all";
    this._currentSearchTerm = "";
    this._wasVisible = false;
    this._cleanupRaf = null;
    this._isResizing = false;
    this._resizeStartX = 0;
    this._resizeStartWidth = 0;
    this._isVerticalResizing = false;
    this._resizeStartY = 0;
    this._resizeStartHeight = 0;
    this._customWidth = null;

    this._initializeSidebar();

    eventBus.on("element.click", (event: any) => {
      const { element } = event;
      this._handleElementClick(element);
    });

    eventBus.on("selection.changed", (event: any) => {
      const { newSelection } = event;
      if (newSelection && newSelection.length > 0) {
        this._handleElementClick(newSelection[0]);
      } else {
        this._hideSidebar();
      }
    });

    // Also listen for connection clicks specifically
    eventBus.on("connection.click", (event: any) => {
      const { element } = event;
      this._handleElementClick(element);
    });

    // Also listen for canvas clicks to hide sidebar
    eventBus.on("canvas.click", (event: any) => {
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
      <div class="tab-container">
        <button class="tab-btn active" id="element-tab" data-tab="element">Element</button>
        <button class="tab-btn" id="overview-tab" data-tab="overview">Overview</button>
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
          <div class="help-section">
            <strong>Creating links:</strong>
            <p>Link to other BPMN elements using their ID:</p>
            <code>[Element Name](#elementId)</code>
            <p>Example: <code>[Check Inventory](#Task_CheckInventory)</code></p>
            <p>Link to external resources:</p>
            <code>[External Link](https://example.com)</code>
            <p><em>Tip: Element IDs can be found in the properties panel or by selecting the element. Type # inside () for autocomplete suggestions.</em></p>
          </div>
        </div>
      </div>
      <div class="tab-content">
        <div class="tab-panel active" id="element-panel">
          <div class="documentation-content">
            <div class="documentation-preview" id="doc-preview"></div>
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

    document.body.appendChild(sidebar);
    this._sidebar = sidebar;

    // Create separate horizontal resize handle
    const horizontalResizeHandle = document.createElement("div");
    horizontalResizeHandle.id = "horizontal-resize-handle";
    horizontalResizeHandle.className = "horizontal-resize-handle";
    document.body.appendChild(horizontalResizeHandle);

    document.getElementById("close-sidebar")?.addEventListener("click", () => {
      this._hideSidebar();
    });

    document.getElementById("help-btn")?.addEventListener("click", () => {
      this._toggleHelpPopover();
    });

    // Close popover when clicking outside
    document.addEventListener("click", (event: any) => {
      const helpPopover = document.getElementById("help-popover");
      const helpBtn = document.getElementById("help-btn");
      if (
        helpPopover &&
        helpPopover.classList.contains("visible") &&
        !(event.target instanceof Node && helpPopover.contains(event.target)) &&
        !(
          event.target instanceof Node &&
          helpBtn &&
          helpBtn.contains(event.target)
        )
      ) {
        this._hideHelpPopover();
      }
    });

    const textarea = document.getElementById(
      "doc-textarea"
    ) as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.addEventListener("input", () => {
        this._updatePreview();
        this._saveDocumentationLive();
        this._handleAutocomplete();
      });

      // Add keydown listener for autocomplete navigation
      textarea.addEventListener("keydown", (event: any) => {
        this._handleAutocompleteKeydown(event);
      });
    }

    // Hide autocomplete when clicking outside
    document.addEventListener("click", (event: any) => {
      const dropdown = document.getElementById(
        "autocomplete-dropdown"
      ) as HTMLElement | null;
      const textarea = document.getElementById("doc-textarea");

      if (
        dropdown &&
        !(event.target instanceof Node && dropdown.contains(event.target)) &&
        event.target !== textarea
      ) {
        this._hideAutocomplete();
      }
    });

    // Setup tab switching
    document.getElementById("element-tab")?.addEventListener("click", () => {
      this._switchTab("element");
    });

    document.getElementById("overview-tab")?.addEventListener("click", () => {
      this._switchTab("overview");
      this._refreshOverview();
    });

    // Setup overview search and filters
    document
      .getElementById("overview-search")
      ?.addEventListener("input", (event: any) => {
        this._filterOverviewList(event.target.value);
      });

    document.getElementById("show-all")?.addEventListener("click", () => {
      this._setOverviewFilter("all");
    });

    document
      .getElementById("show-documented")
      ?.addEventListener("click", () => {
        this._setOverviewFilter("documented");
      });

    document
      .getElementById("show-undocumented")
      ?.addEventListener("click", () => {
        this._setOverviewFilter("undocumented");
      });

    // Setup resize handles after DOM is ready
    setTimeout(() => {
      this._setupResizeHandle();
    }, 100);
  }

  _handleElementClick(element: any) {
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

  _getElementDocumentation(element: any) {
    const businessObject = element.businessObject;

    if (
      businessObject.documentation &&
      businessObject.documentation.length > 0
    ) {
      return businessObject.documentation[0].text;
    }

    return null;
  }

  _hasDocumentationCapability(element: any) {
    return element.businessObject;
  }

  _showSidebar(documentation: string) {
    const textarea = document.getElementById(
      "doc-textarea"
    ) as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.value = documentation || "";
    }
    this._updateElementMetadata();
    this._updatePreview();
    this._updateSidebarPosition();
    if (this._sidebar) {
      this._sidebar.style.display = "flex";
      this._sidebar.classList.add("visible");
    }

    // Show horizontal resize handle
    const horizontalHandle = document.getElementById(
      "horizontal-resize-handle"
    );
    if (horizontalHandle) {
      horizontalHandle.style.display = "block";
    }

    this._wasVisible = true;
  }

  _hideSidebar() {
    if (this._sidebar) {
      this._wasVisible = this._sidebar.classList.contains("visible");
      this._sidebar.classList.remove("visible");
      this._sidebar.style.display = "none";
    }

    // Hide horizontal resize handle
    const horizontalHandle = document.getElementById(
      "horizontal-resize-handle"
    );
    if (horizontalHandle) {
      horizontalHandle.style.display = "none";
    }
  }

  _toggleHelpPopover() {
    const helpPopover = document.getElementById("help-popover");
    if (helpPopover && helpPopover.classList.contains("visible")) {
      this._hideHelpPopover();
    } else if (helpPopover) {
      this._showHelpPopover();
    }
  }

  _showHelpPopover() {
    const helpPopover = document.getElementById("help-popover");
    if (helpPopover) helpPopover.classList.add("visible");
  }

  _hideHelpPopover() {
    const helpPopover = document.getElementById("help-popover");
    if (helpPopover) helpPopover.classList.remove("visible");
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
      const panelBottom = panelRect.bottom;

      if (this._sidebar) {
        this._sidebar.style.right = `${panelWidth}px`;
        // Use custom width if set, otherwise default to 350px
        if (!this._isResizing) {
          const width = this._customWidth ? `${this._customWidth}px` : "350px";
          this._sidebar.style.setProperty("width", width, "important");

          // Always update horizontal handle position to match sidebar
          const horizontalHandle = document.getElementById(
            "horizontal-resize-handle"
          );
          if (horizontalHandle) {
            const sidebarWidth = this._customWidth || 350;
            horizontalHandle.style.right = `${panelWidth + sidebarWidth}px`;
          }
        }
        this._sidebar.style.top = `${Math.max(panelTop, 0)}px`;
      }

      const availableHeight = Math.max(
        panelBottom - Math.max(panelTop, 0),
        300
      );
      if (this._sidebar) {
        this._sidebar.style.height = `${availableHeight}px`;
      }
    } else {
      const statusBar =
        document.querySelector(".status-bar") ||
        document.querySelector(".footer") ||
        document.querySelector(".bottom-bar");

      let bottomOffset = 0;
      if (statusBar) {
        const statusRect = statusBar.getBoundingClientRect();
        bottomOffset = window.innerHeight - statusRect.top;
      }

      if (this._sidebar) {
        this._sidebar.style.right = "300px";
        // Use custom width if set, otherwise default to 350px
        if (!this._isResizing) {
          const width = this._customWidth ? `${this._customWidth}px` : "350px";
          this._sidebar.style.setProperty("width", width, "important");

          // Always update horizontal handle position to match sidebar
          const horizontalHandle = document.getElementById(
            "horizontal-resize-handle"
          );
          if (horizontalHandle) {
            const sidebarWidth = this._customWidth || 350;
            const rightOffset = 300; // Same as sidebar's right position
            horizontalHandle.style.right = `${rightOffset + sidebarWidth}px`;
          }
        }
        this._sidebar.style.top = "0px";
        this._sidebar.style.height = `${window.innerHeight - bottomOffset}px`;
      }
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
    let rafId: any;
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

  async _updatePreview() {
    const textarea = document.getElementById(
      "doc-textarea"
    ) as HTMLTextAreaElement | null;
    const preview = document.getElementById(
      "doc-preview"
    ) as HTMLElement | null;
    if (!textarea || !preview) return;
    const value = textarea.value;
    if (value && value.trim()) {
      const rendered = await Promise.resolve(marked(value));
      preview.innerHTML = typeof rendered === "string" ? rendered : "";
      this._setupElementLinks(preview);
    } else {
      preview.innerHTML = "<em>No documentation.</em>";
    }
  }

  _setupElementLinks(container: HTMLElement) {
    // Find all links that start with # (element links)
    const links = container.querySelectorAll('a[href^="#"]');
    links.forEach((link) => {
      link.addEventListener("click", (event: any) => {
        event.preventDefault();
        const elementId = link.getAttribute("href")?.substring(1);
        if (elementId) {
          this._selectElementById(elementId);
        }
      });
      // Add hover effect
      link.addEventListener("mouseenter", () => {
        link.classList.add("hovered");
      });
      link.addEventListener("mouseleave", () => {
        link.classList.remove("hovered");
      });
    });
  }

  _selectElementById(elementId: string) {
    try {
      // Get the element from the element registry
      const element = this._elementRegistry.get(elementId);

      if (element) {
        // Use the selection service to select the element
        this._selection.select(element);

        // Scroll the element into view
        this._canvas.scrollToElement(element);

        console.log(`Selected element: ${elementId}`);
      } else {
        console.warn(`Element with ID "${elementId}" not found in the diagram`);

        // Show a subtle notification to the user
        this._showLinkNotification(`Element "${elementId}" not found`);
      }
    } catch (error) {
      console.error("Error selecting element:", error);
      this._showLinkNotification(`Error selecting element "${elementId}"`);
    }
  }

  _showLinkNotification(message: string) {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  _handleAutocomplete() {
    const textarea = document.getElementById(
      "doc-textarea"
    ) as HTMLTextAreaElement | null;
    if (!textarea) return;
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;

    // Look for # character before cursor position
    let hashPos = -1;

    // Search backwards from cursor to find the most recent # on the same word
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (text[i] === "#") {
        hashPos = i;
        break;
      }
      // Stop at word boundaries (space, newline, or other punctuation)
      if (text[i] === " " || text[i] === "\n" || text[i] === "\t") {
        break;
      }
    }

    // If we found a # and there's text after it (or cursor is right after #)
    if (hashPos >= 0) {
      const searchText = text.substring(hashPos + 1, cursorPos);
      // Only show autocomplete if the search text doesn't contain spaces or newlines
      if (!searchText.includes(" ") && !searchText.includes("\n")) {
        this._showAutocomplete(searchText, hashPos);
        return;
      }
    }

    // Hide autocomplete if no valid # context found
    this._hideAutocomplete();
  }

  _showAutocomplete(searchText: string, hashPos: number) {
    const dropdown = document.getElementById(
      "autocomplete-dropdown"
    ) as HTMLElement | null;
    const autocompleteList = document.getElementById(
      "autocomplete-list"
    ) as HTMLElement | null;
    const textarea = document.getElementById(
      "doc-textarea"
    ) as HTMLTextAreaElement | null;
    if (!dropdown || !autocompleteList || !textarea) return;

    // Get all elements and filter by search text
    const allElements = this._getAllElements();
    const filteredElements = allElements.filter(
      (element) =>
        element.id.toLowerCase().includes(searchText.toLowerCase()) ||
        element.name.toLowerCase().includes(searchText.toLowerCase())
    );

    if (filteredElements.length === 0) {
      this._hideAutocomplete();
      return;
    }

    // Clear previous items
    autocompleteList.innerHTML = "";

    // Add filtered elements
    filteredElements.slice(0, 10).forEach((element, index) => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.innerHTML = `
        <div class="autocomplete-item-id">${element.id}</div>
        <div class="autocomplete-item-name">${element.name}</div>
        <div class="autocomplete-item-type">${element.type}</div>
      `;

      item.addEventListener("click", () => {
        this._selectAutocompleteItem(element.id, hashPos);
      });

      autocompleteList.appendChild(item);
    });

    // Position and show dropdown
    this._positionAutocomplete(textarea, hashPos);
    dropdown.classList.add("visible");
    this._selectedIndex = 0;
    this._updateAutocompleteSelection(Array.from(autocompleteList.children));
  }

  _hideAutocomplete() {
    const dropdown = document.getElementById(
      "autocomplete-dropdown"
    ) as HTMLElement | null;
    if (!dropdown) return;
    dropdown.classList.remove("visible");
    this._selectedIndex = -1;
  }

  _positionAutocomplete(textarea: any, hashPos: number) {
    const dropdown = document.getElementById(
      "autocomplete-dropdown"
    ) as HTMLElement | null;
    if (!dropdown) return;

    // Get textarea position and cursor position
    const textareaRect = textarea.getBoundingClientRect();
    const style = window.getComputedStyle(textarea);
    const lineHeight = parseInt(style.lineHeight) || 20;

    // Create a temporary element to measure text position
    const tempSpan = document.createElement("span");
    tempSpan.style.visibility = "hidden";
    tempSpan.style.position = "absolute";
    tempSpan.style.top = "-9999px";
    tempSpan.style.fontFamily = style.fontFamily;
    tempSpan.style.fontSize = style.fontSize;
    tempSpan.style.fontWeight = style.fontWeight;
    tempSpan.style.letterSpacing = style.letterSpacing;
    tempSpan.style.whiteSpace = "pre";

    const textUpToHash = textarea.value.substring(0, hashPos);
    const linesUpToHash = textUpToHash.split("\n");
    const currentLine = linesUpToHash[linesUpToHash.length - 1];

    tempSpan.textContent = currentLine;
    document.body.appendChild(tempSpan);
    const textWidth = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);

    // Calculate position
    const lineNumber = linesUpToHash.length - 1;
    const paddingLeft = parseInt(style.paddingLeft) || 15;
    const paddingTop = parseInt(style.paddingTop) || 15;

    // Position within the visible area - use a fixed position in the middle of the textarea
    const left = textareaRect.left + 10;
    const top = textareaRect.top + 100; // Fixed 100px from top of textarea

    dropdown.style.setProperty("left", `${left}px`, "important");
    dropdown.style.setProperty("top", `${top}px`, "important");
    dropdown.style.setProperty("position", "fixed", "important");
    dropdown.style.setProperty("z-index", "10001", "important");
  }

  _getAllElements(): any[] {
    const elements: any[] = [];
    const seenIds = new Set();
    const allElements = this._elementRegistry.getAll();
    allElements.forEach((element: any) => {
      if (element.businessObject && element.businessObject.id) {
        const bo = element.businessObject;
        const elementId = bo.id;
        if (seenIds.has(elementId)) {
          return;
        }
        seenIds.add(elementId);
        elements.push({
          id: elementId,
          name: bo.name || "Unnamed",
          type: this._getElementTypeName(element),
        });
      }
    });
    return elements.sort((a, b) => a.id.localeCompare(b.id));
  }

  _getElementTypeName(element: any) {
    if (is(element, "bpmn:Task")) return "Task";
    if (is(element, "bpmn:UserTask")) return "User Task";
    if (is(element, "bpmn:ServiceTask")) return "Service Task";
    if (is(element, "bpmn:ScriptTask")) return "Script Task";
    if (is(element, "bpmn:CallActivity")) return "Call Activity";
    if (is(element, "bpmn:SubProcess")) return "Sub Process";
    if (is(element, "bpmn:StartEvent")) return "Start Event";
    if (is(element, "bpmn:EndEvent")) return "End Event";
    if (is(element, "bpmn:IntermediateThrowEvent")) return "Intermediate Event";
    if (is(element, "bpmn:IntermediateCatchEvent")) return "Intermediate Event";
    if (is(element, "bpmn:Gateway")) return "Gateway";
    if (is(element, "bpmn:ExclusiveGateway")) return "Exclusive Gateway";
    if (is(element, "bpmn:ParallelGateway")) return "Parallel Gateway";
    if (is(element, "bpmn:InclusiveGateway")) return "Inclusive Gateway";
    if (is(element, "bpmn:SequenceFlow")) return "Sequence Flow";
    if (is(element, "bpmn:MessageFlow")) return "Message Flow";
    if (is(element, "bpmn:DataObject")) return "Data Object";
    if (is(element, "bpmn:DataStore")) return "Data Store";
    if (is(element, "bpmn:Lane")) return "Lane";
    if (is(element, "bpmn:Participant")) return "Pool";
    if (is(element, "bpmn:Process")) return "Process";
    return "Element";
  }

  _handleAutocompleteKeydown(event: any) {
    const dropdown = document.getElementById(
      "autocomplete-dropdown"
    ) as HTMLElement | null;

    if (!dropdown || !dropdown.classList.contains("visible")) {
      return;
    }

    const items = Array.from(dropdown.querySelectorAll(".autocomplete-item"));

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this._selectedIndex = Math.min(this._selectedIndex + 1, items.length - 1);
      this._updateAutocompleteSelection(items);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this._selectedIndex = Math.max(this._selectedIndex - 1, 0);
      this._updateAutocompleteSelection(items);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (this._selectedIndex >= 0 && items[this._selectedIndex]) {
        const selectedId = (
          items[this._selectedIndex] as HTMLElement
        ).querySelector(".autocomplete-item-id")?.textContent;
        const textarea = document.getElementById(
          "doc-textarea"
        ) as HTMLTextAreaElement | null;
        if (!textarea) return;
        const cursorPos = textarea.selectionStart;
        const text = textarea.value;
        // Find hash position
        let hashPos = -1;
        for (let i = cursorPos - 1; i >= 0; i--) {
          if (text[i] === "#") {
            hashPos = i;
            break;
          }
        }
        if (hashPos >= 0 && selectedId) {
          this._selectAutocompleteItem(selectedId, hashPos);
        }
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      this._hideAutocomplete();
    }
  }

  _updateAutocompleteSelection(items: any[]) {
    const dropdown = document.getElementById(
      "autocomplete-dropdown"
    ) as HTMLElement | null;
    const autocompleteList = document.getElementById(
      "autocomplete-list"
    ) as HTMLElement | null;
    if (!dropdown || !autocompleteList) return;
    Array.from(items).forEach((item: any, index: number) => {
      if (index === this._selectedIndex) {
        item.classList.add("selected");
        const itemTop = item.offsetTop;
        const itemBottom = itemTop + item.offsetHeight;
        const dropdownTop = dropdown.scrollTop;
        const dropdownBottom = dropdownTop + dropdown.clientHeight;
        if (itemTop < dropdownTop) {
          dropdown.scrollTop = itemTop;
        } else if (itemBottom > dropdownBottom) {
          dropdown.scrollTop = itemBottom - dropdown.clientHeight;
        }
      } else {
        item.classList.remove("selected");
      }
    });
  }

  _selectAutocompleteItem(elementId: any, hashPos: any) {
    const textarea = document.getElementById(
      "doc-textarea"
    ) as HTMLTextAreaElement | null;
    if (!textarea) return;
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;

    // Replace the text from # to cursor with the selected element ID
    const beforeHash = text.substring(0, hashPos + 1); // Include the #
    const afterCursor = text.substring(cursorPos);
    const newText = beforeHash + elementId + afterCursor;

    textarea.value = newText;

    // Set cursor position after the inserted ID
    const newCursorPos = hashPos + 1 + elementId.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);

    // Hide autocomplete and update preview
    this._hideAutocomplete();
    this._updatePreview();
    this._saveDocumentationLive();

    // Focus back to textarea
    textarea.focus();
  }

  _switchTab(tabName: any) {
    Array.from(document.querySelectorAll(".tab-btn")).forEach((btn: any) => {
      const btnEl = btn as HTMLElement;
      if (btnEl.dataset.tab === tabName) {
        btnEl.classList.add("active");
      } else {
        btnEl.classList.remove("active");
      }
    });
    Array.from(document.querySelectorAll(".tab-panel")).forEach(
      (panel: any) => {
        const panelEl = panel as HTMLElement;
        if (panelEl.id === `${tabName}-panel`) {
          panelEl.classList.add("active");
        } else {
          panelEl.classList.remove("active");
        }
      }
    );
    // Keep element metadata visible on all tabs
    const elementMetadata = document.getElementById(
      "element-metadata"
    ) as HTMLElement | null;
    if (elementMetadata) {
      elementMetadata.style.display = "block";
    }
  }

  _refreshOverview() {
    this._currentFilter = "all";
    this._currentSearchTerm = "";
    this._updateCoverageStats();
    this._updateOverviewList();
  }

  _updateCoverageStats() {
    const elements = this._getAllElementsWithDocumentation();
    const documentedCount = elements.filter(
      (el: any) => el.hasDocumentation
    ).length;
    const totalCount = elements.length;
    const percentage =
      totalCount > 0 ? Math.round((documentedCount / totalCount) * 100) : 0;
    const documentedCountEl = document.getElementById("documented-count");
    if (documentedCountEl)
      documentedCountEl.textContent = documentedCount.toString();
    const totalCountEl = document.getElementById("total-count");
    if (totalCountEl) totalCountEl.textContent = totalCount.toString();
    const coveragePercentageEl = document.getElementById("coverage-percentage");
    if (coveragePercentageEl)
      coveragePercentageEl.textContent = `${percentage}%`;
    const progressBar = document.getElementById(
      "coverage-progress"
    ) as HTMLElement | null;
    if (progressBar) progressBar.style.width = `${percentage}%`;
  }

  _getAllElementsWithDocumentation() {
    const elements: any[] = [];
    const seenIds = new Set();
    const allElements = this._elementRegistry.getAll();

    allElements.forEach((element: any) => {
      if (element.businessObject && element.businessObject.id) {
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
          hasDocumentation: !!(documentation && documentation.trim()),
          documentation: documentation || "",
          element: element,
        });
      }
    });

    return elements.sort((a, b) => a.id.localeCompare(b.id));
  }

  _updateOverviewList() {
    const overviewList = document.getElementById(
      "overview-list"
    ) as HTMLElement | null;
    if (!overviewList) return;
    const elements = this._getAllElementsWithDocumentation();

    // Apply filters
    let filteredElements = elements;

    if (this._currentFilter === "documented") {
      filteredElements = elements.filter((el) => el.hasDocumentation);
    } else if (this._currentFilter === "undocumented") {
      filteredElements = elements.filter((el) => !el.hasDocumentation);
    }

    // Apply search
    if (this._currentSearchTerm) {
      const searchTerm = this._currentSearchTerm.toLowerCase();
      filteredElements = filteredElements.filter(
        (el) =>
          el.id.toLowerCase().includes(searchTerm) ||
          el.name.toLowerCase().includes(searchTerm) ||
          el.documentation.toLowerCase().includes(searchTerm)
      );
    }

    if (filteredElements.length === 0) {
      overviewList.innerHTML =
        '<div class="overview-loading">No elements found</div>';
      return;
    }

    // Generate HTML
    overviewList.innerHTML = filteredElements
      .map((element) => {
        const statusClass = element.hasDocumentation
          ? "documented"
          : "undocumented";
        const statusText = element.hasDocumentation
          ? "documented"
          : "undocumented";

        return `
        <div class="element-item ${statusClass}" data-element-id="${element.id}">
          <div class="element-header">
            <span class="element-id">${element.id}</span>
            <span class="element-status ${statusClass}">${statusText}</span>
          </div>
          <div class="element-info">
            <span>${element.name}</span>
            <span>•</span>
            <span>${element.type}</span>
          </div>
        </div>
      `;
      })
      .join("");

    // Add click handlers to element cards
    overviewList.querySelectorAll(".element-item").forEach((card) => {
      card.addEventListener("click", () => {
        const elementId = card.getAttribute("data-element-id");
        if (elementId) {
          this._selectElementById(elementId);
          // Switch to Element tab to show the documentation
          this._switchTab("element");
        }
      });
    });
  }

  _saveDocumentationLive() {
    if (!this._currentElement) return;

    const textarea = document.getElementById(
      "doc-textarea"
    ) as HTMLTextAreaElement | null;
    if (!textarea) return;

    const documentation = textarea.value;

    try {
      // Prepare documentation array
      let documentationArray = [];

      if (documentation.trim()) {
        // Create documentation element
        const docElement = this._moddle.create("bpmn:Documentation", {
          text: documentation,
        });
        documentationArray.push(docElement);
      }

      // Use modeling service to update the element properties
      this._modeling.updateProperties(this._currentElement, {
        documentation: documentationArray,
      });
    } catch (error) {
      console.error("Error saving documentation:", error);
    }
  }

  _filterOverviewList(searchTerm: any) {
    this._currentSearchTerm = searchTerm;
    this._updateOverviewList();
  }

  _setOverviewFilter(filter: any) {
    this._currentFilter = filter;

    // Update button states
    document.querySelectorAll(".btn-small").forEach((btn) => {
      btn.classList.remove("active");
    });

    const activeButton = document.getElementById(`show-${filter}`);
    if (activeButton) {
      activeButton.classList.add("active");
    }

    // Update the overview list
    this._updateOverviewList();
  }

  _setupResizeHandle() {
    this._setupHorizontalResize();
    this._setupVerticalResize();
  }

  _setupHorizontalResize() {
    const horizontalHandle = document.getElementById(
      "horizontal-resize-handle"
    );

    if (!horizontalHandle) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      this._isResizing = true;
      this._resizeStartX = e.clientX;
      this._resizeStartWidth = this._sidebar?.offsetWidth || 350;

      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!this._isResizing || !this._sidebar) return;

      e.preventDefault();
      const deltaX = this._resizeStartX - e.clientX;
      const newWidth = this._resizeStartWidth + deltaX;

      // Set minimum and maximum width constraints
      const minWidth = 250;
      const maxWidth = window.innerWidth * 0.6; // 60% of viewport width
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      // Store the custom width
      this._customWidth = constrainedWidth;

      this._sidebar.style.setProperty(
        "width",
        `${constrainedWidth}px`,
        "important"
      );

      // Update horizontal handle position
      const horizontalHandle = document.getElementById(
        "horizontal-resize-handle"
      );
      if (horizontalHandle) {
        horizontalHandle.style.right = `${constrainedWidth}px`;
      }
    };

    const handleMouseUp = () => {
      this._isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    horizontalHandle.addEventListener("mousedown", handleMouseDown);
  }

  _setupVerticalResize() {
    const verticalHandle = document.getElementById("resize-handle");

    if (!verticalHandle) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      this._isVerticalResizing = true;
      this._resizeStartY = e.clientY;

      const previewElement = document.getElementById("doc-preview");
      this._resizeStartHeight = previewElement?.offsetHeight || 200;

      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!this._isVerticalResizing) return;

      e.preventDefault();
      const deltaY = e.clientY - this._resizeStartY;
      const newHeight = this._resizeStartHeight + deltaY;

      // Set minimum and maximum height constraints
      const minHeight = 100;
      const maxHeight = window.innerHeight * 0.6;
      const constrainedHeight = Math.max(
        minHeight,
        Math.min(maxHeight, newHeight)
      );

      const previewElement = document.getElementById("doc-preview");
      if (previewElement) {
        previewElement.style.height = `${constrainedHeight}px`;
      }
    };

    const handleMouseUp = () => {
      this._isVerticalResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    verticalHandle.addEventListener("mousedown", handleMouseDown);
  }

  _updateElementMetadata() {
    if (!this._currentElement) return;

    const businessObject = this._currentElement.businessObject;
    const elementId = businessObject.id || "Unknown ID";

    // Update the element name display
    const elementNameElement = document.getElementById("element-name");
    if (elementNameElement) {
      elementNameElement.textContent = elementId;
    }
  }

  _setupViewObserver() {
    // TODO: Implement or migrate logic from previous JS version if needed
  }
}
