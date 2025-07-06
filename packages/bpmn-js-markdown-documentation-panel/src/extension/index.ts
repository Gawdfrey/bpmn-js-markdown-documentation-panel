import { is } from "bpmn-js/lib/util/ModelUtil";
import { marked } from "marked";
import { ExportService } from "./export-service";
import { SidebarManager } from "./managers/SidebarManager";
import { ViewManager } from "./managers/ViewManager";
import { HtmlTemplateGenerator } from "./templates/HtmlTemplateGenerator";
import type { IViewManagerCallbacks, ViewType } from "./types/interfaces";

class DocumentationExtension {
  private _eventBus: any;
  private _elementRegistry: any;
  private _modeling: any;
  private _moddle: any;
  private _selection: any;
  private _canvas: any;
  private _currentElement: any;
  private _selectedIndex: number;
  private _currentFilter: string;
  private _currentSearchTerm: string;
  private _isModeler: boolean;
  private _exportService: ExportService;
  private _currentView: ViewType;
  private _viewManager: ViewManager;
  private _htmlGenerator: HtmlTemplateGenerator;
  private _sidebarManager: SidebarManager;

  constructor(
    eventBus: any,
    elementRegistry: any,
    injector: any,
    moddle: any,
    selection: any,
    canvas: any
  ) {
    // Use injector to check for modeling service availability
    this._modeling = injector.get("modeling", false);
    this._isModeler = !!this._modeling;

    this._eventBus = eventBus;
    this._elementRegistry = elementRegistry;
    this._moddle = moddle;
    this._selection = selection;
    this._canvas = canvas;
    this._currentElement = null;
    this._selectedIndex = -1;
    this._currentFilter = "all";
    this._currentSearchTerm = "";
    this._currentView = "diagram";

    this._exportService = new ExportService(elementRegistry, moddle, canvas);

    // Initialize HtmlTemplateGenerator
    this._htmlGenerator = new HtmlTemplateGenerator({
      isModeler: this._isModeler,
    });

    // Initialize SidebarManager
    this._sidebarManager = new SidebarManager({
      canvas: this._canvas,
      htmlGenerator: this._htmlGenerator,
      onSidebarReady: (sidebar) => this._onSidebarReady(sidebar),
    });

    // Initialize ViewManager with callbacks
    const viewCallbacks: IViewManagerCallbacks = {
      onViewChanged: (newView: ViewType) => {
        this._currentView = newView;
      },
      hideSidebar: () => this._sidebarManager.hideSidebar(),
      showSidebar: (documentation: string) => this._showSidebar(documentation),
      getElementDocumentation: (element: any) =>
        this._getElementDocumentation(element),
      getCurrentElement: () => this._currentElement,
    };
    this._viewManager = new ViewManager(viewCallbacks);

    this._sidebarManager.initializeSidebar();
    this._viewManager.setupViewDetection();

    eventBus.on("element.click", (event: any) => {
      const { element } = event;
      this._handleElementClick(element);
    });

    eventBus.on("selection.changed", (event: any) => {
      const { newSelection } = event;
      if (newSelection && newSelection.length > 0) {
        this._handleElementClick(newSelection[0]);
      } else {
        this._sidebarManager.hideSidebar();
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
          this._sidebarManager.hideSidebar();
        }
      }, 10);
    });
  }

  _onSidebarReady(sidebar: HTMLElement): void {
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

    // Only add editing functionality in modeler mode
    if (this._isModeler) {
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

    // Setup close button and tab switching after DOM is ready
    setTimeout(() => {
      document
        .getElementById("close-sidebar")
        ?.addEventListener("click", () => {
          // Clear current element so ViewManager doesn't re-show sidebar
          this._currentElement = null;
          this._sidebarManager.hideSidebar();
        });

      document.getElementById("element-tab")?.addEventListener("click", () => {
        this._switchTab("element");
      });

      document.getElementById("overview-tab")?.addEventListener("click", () => {
        this._switchTab("overview");
        this._refreshOverview();
      });
    }, 100);

    // Setup overview search and filters after DOM is ready
    setTimeout(() => {
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

      // Setup export functionality
      document.getElementById("export-btn")?.addEventListener("click", () => {
        this._exportService.exportDocumentation("html");
      });
    }, 100);
  }

  _handleElementClick(element: any) {
    // Only process element clicks in diagram view
    if (this._currentView === "xml") {
      return;
    }

    if (!element || !element.businessObject) {
      this._currentElement = null;
      this._sidebarManager.hideSidebar();
      return;
    }

    const documentation = this._getElementDocumentation(element);

    if (documentation || this._hasDocumentationCapability(element)) {
      this._currentElement = element;
      this._showSidebar(documentation || "");
    } else {
      this._currentElement = null;
      this._sidebarManager.hideSidebar();
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
    // Only populate textarea in modeler mode
    if (this._isModeler) {
      const textarea = document.getElementById(
        "doc-textarea"
      ) as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.value = documentation || "";
      }
    }
    this._updateElementMetadata();
    this._updatePreview();
    this._sidebarManager.showSidebar();
  }

  _hideSidebar() {
    this._sidebarManager.hideSidebar();
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

  _getCanvasContainer(): HTMLElement {
    return this._canvas?.getContainer() ?? document.body;
  }

  async _updatePreview() {
    const preview = document.getElementById(
      "doc-preview"
    ) as HTMLElement | null;
    if (!preview) return;

    let value = "";

    if (this._isModeler) {
      // In modeler mode, get value from textarea
      const textarea = document.getElementById(
        "doc-textarea"
      ) as HTMLTextAreaElement | null;
      if (!textarea) return;
      value = textarea.value;
    } else {
      // In viewer mode, get documentation directly from current element
      if (this._currentElement) {
        value = this._getElementDocumentation(this._currentElement) || "";
      }
    }

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

    this._getCanvasContainer().appendChild(notification);

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
    const lineHeight = Number.parseInt(style.lineHeight) || 20;

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
    this._getCanvasContainer().appendChild(tempSpan);
    this._getCanvasContainer().removeChild(tempSpan);

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
    if (!this._sidebarManager.isSidebarVisible()) return;

    const sidebar = this._sidebarManager.getSidebar();
    if (!sidebar) return;

    // Scope selectors to this specific sidebar instance
    Array.from(sidebar.querySelectorAll(".tab-btn")).forEach((btn: Element) => {
      const btnEl = btn as HTMLElement;
      if (btnEl.dataset.tab === tabName) {
        btnEl.classList.add("active");
      } else {
        btnEl.classList.remove("active");
      }
    });
    Array.from(sidebar.querySelectorAll(".tab-panel")).forEach(
      (panel: Element) => {
        const panelEl = panel as HTMLElement;
        if (panelEl.id === `${tabName}-panel`) {
          panelEl.classList.add("active");
        } else {
          panelEl.classList.remove("active");
        }
      }
    );
    // Keep element metadata visible on all tabs
    const elementMetadata = sidebar.querySelector(
      "#element-metadata"
    ) as HTMLElement | null;
    if (elementMetadata) {
      elementMetadata.style.display = "block";
    }
  }

  _refreshOverview() {
    // Don't reset filter state when switching tabs - preserve user's filter selection
    // this._currentFilter = "all";
    // this._currentSearchTerm = "";

    // Update button states to reflect current filter
    this._updateFilterButtonStates();

    this._updateCoverageStats();
    this._updateOverviewList();
  }

  _updateCoverageStats() {
    const sidebar = this._sidebarManager.getSidebar();
    if (!sidebar) return;

    const elements = this._getAllElementsWithDocumentation();
    const documentedCount = elements.filter(
      (el: any) => el.hasDocumentation
    ).length;
    const totalCount = elements.length;
    const percentage =
      totalCount > 0 ? Math.round((documentedCount / totalCount) * 100) : 0;
    const documentedCountEl = sidebar.querySelector("#documented-count");
    if (documentedCountEl)
      documentedCountEl.textContent = documentedCount.toString();
    const totalCountEl = sidebar.querySelector("#total-count");
    if (totalCountEl) totalCountEl.textContent = totalCount.toString();
    const coveragePercentageEl = sidebar.querySelector("#coverage-percentage");
    if (coveragePercentageEl)
      coveragePercentageEl.textContent = `${percentage}%`;
    const progressBar = sidebar.querySelector(
      "#coverage-progress"
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
    const sidebar = this._sidebarManager.getSidebar();
    if (!sidebar) return;

    const overviewList = sidebar.querySelector(
      "#overview-list"
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
    if (!this._currentElement || !this._modeling) return;

    const textarea = document.getElementById(
      "doc-textarea"
    ) as HTMLTextAreaElement | null;
    if (!textarea) return;

    const documentation = textarea.value;

    try {
      // Prepare documentation array
      const documentationArray = [];

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

    const sidebar = this._sidebarManager.getSidebar();
    if (!sidebar) return;

    // Update button states - scope to sidebar
    sidebar.querySelectorAll(".btn-small").forEach((btn: Element) => {
      btn.classList.remove("active");
    });

    const activeButton = sidebar.querySelector(`#show-${filter}`);
    if (activeButton) {
      activeButton.classList.add("active");
    }

    // Update the overview list
    this._updateOverviewList();
  }

  _updateFilterButtonStates() {
    const sidebar = this._sidebarManager.getSidebar();
    if (!sidebar) return;

    // Update button states to reflect current filter - scope to sidebar
    sidebar.querySelectorAll(".btn-small").forEach((btn: Element) => {
      btn.classList.remove("active");
    });

    const activeButton = sidebar.querySelector(`#show-${this._currentFilter}`);
    if (activeButton) {
      activeButton.classList.add("active");
    }
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
}

// Export the module registration object as default
export default {
  __init__: ["documentationExtension"],
  documentationExtension: [
    "type",
    DocumentationExtension,
    "eventBus",
    "elementRegistry",
    "injector",
    "moddle",
    "selection",
    "canvas",
  ],
};
