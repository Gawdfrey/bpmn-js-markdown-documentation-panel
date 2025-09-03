import { is } from "bpmn-js/lib/util/ModelUtil";
import { AutocompleteManager } from "./managers/AutocompleteManager";
import { ExportManager } from "./managers/ExportManager";
import { OverviewManager } from "./managers/OverviewManager";
import { SidebarManager } from "./managers/SidebarManager";
import { TabManager } from "./managers/TabManager";
import { ViewManager } from "./managers/ViewManager";
import { HtmlTemplateGenerator } from "./templates/HtmlTemplateGenerator";
import type {
  IAutocompleteManagerCallbacks,
  IOverviewManagerCallbacks,
  ITabManagerCallbacks,
  IViewManagerCallbacks,
  ViewType,
} from "./types/interfaces";
import { MarkdownRenderer } from "./utils/MarkdownRenderer";

class DocumentationExtension {
  private _eventBus: any;
  private _elementRegistry: any;
  private _modeling: any;
  private _moddle: any;
  private _selection: any;
  private _canvas: any;
  private _currentElement: any;
  private _isModeler: boolean;
  private _currentView: ViewType;
  private _viewManager: ViewManager;
  private _htmlGenerator: HtmlTemplateGenerator;
  private _sidebarManager: SidebarManager;
  private _tabManager: TabManager;
  private _overviewManager: OverviewManager;
  private _autocompleteManager: AutocompleteManager;
  private _exportManager: ExportManager;
  private _markdownRenderer: MarkdownRenderer;

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
    this._currentView = "diagram";

    // Initialize HtmlTemplateGenerator
    this._htmlGenerator = new HtmlTemplateGenerator({
      isModeler: this._isModeler,
    });

    // Initialize MarkdownRenderer
    this._markdownRenderer = new MarkdownRenderer();

    // Initialize SidebarManager
    this._sidebarManager = new SidebarManager({
      canvas: this._canvas,
      htmlGenerator: this._htmlGenerator,
      onSidebarReady: () => this._onSidebarReady(),
    });

    // Initialize TabManager
    const tabCallbacks: ITabManagerCallbacks = {
      onOverviewTabActivated: () => this._overviewManager.refreshOverview(),
      onElementTabActivated: () => {
        // No specific action needed for element tab
      },
      getSidebar: () => this._sidebarManager.getSidebar(),
      isSidebarVisible: () => this._sidebarManager.isSidebarVisible(),
    };
    this._tabManager = new TabManager({
      callbacks: tabCallbacks,
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

    // Initialize OverviewManager
    const overviewCallbacks: IOverviewManagerCallbacks = {
      getAllElements: () => this._elementRegistry.getAll(),
      getElementDocumentation: (element: any) =>
        this._getElementDocumentation(element),
      getElementTypeName: (element: any) => this._getElementTypeName(element),
      getSidebar: () => this._sidebarManager.getSidebar(),
      selectElementById: (elementId: string) =>
        this._selectElementById(elementId),
      switchToElementTab: () => this._tabManager.switchTab("element"),
    };
    this._overviewManager = new OverviewManager({
      callbacks: overviewCallbacks,
    });

    // Initialize AutocompleteManager
    const autocompleteCallbacks: IAutocompleteManagerCallbacks = {
      getAllElements: () => this._elementRegistry.getAll(),
      getElementTypeName: (element: any) => this._getElementTypeName(element),
      getCanvasContainer: () => this._getCanvasContainer(),
      updatePreview: () => this._updatePreview(),
      saveDocumentationLive: () => this._saveDocumentationLive(),
      selectElementById: (elementId: string) =>
        this._selectElementById(elementId),
      getCurrentElement: () => this._currentElement,
    };
    this._autocompleteManager = new AutocompleteManager({
      callbacks: autocompleteCallbacks,
    });

    // Initialize ExportManager
    this._exportManager = new ExportManager(
      this._elementRegistry,
      this._moddle,
      this._canvas
    );

    this._sidebarManager.initializeSidebar();
    this._viewManager.setupViewDetection();

    // Setup export event listeners using ExportManager
    this._exportManager.setupExportEventListeners();

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
    eventBus.on("canvas.click", () => {
      // Small delay to let selection.changed fire first
      setTimeout(() => {
        if (!this._currentElement) {
          this._sidebarManager.hideSidebar();
        }
      }, 10);
    });

    // Handle diagram import events (file switching)
    eventBus.on("import.done", () => {
      this._handleDiagramImport();
    });

    eventBus.on("import.parse.complete", () => {
      this._handleDiagramImport();
    });

    // Handle diagram destruction/clearing
    eventBus.on("diagram.destroy", () => {
      this._handleDiagramDestroy();
    });

    eventBus.on("diagram.clear", () => {
      this._handleDiagramClear();
    });
  }

  _onSidebarReady(): void {
    const helpBtn = document.getElementById("help-btn");
    if (helpBtn) {
      // Remove any existing listeners first
      helpBtn.replaceWith(helpBtn.cloneNode(true));
      const newHelpBtn = document.getElementById("help-btn");
      newHelpBtn?.addEventListener("click", (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        this._toggleHelpPopover();
      });
    }

    // Close popover when clicking outside
    document.addEventListener("click", (event: any) => {
      const helpPopover = document.getElementById("help-popover");
      const helpBtn = document.getElementById("help-btn");
      if (
        helpPopover?.classList.contains("visible") &&
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
        });
      }

      // Setup autocomplete using AutocompleteManager
      this._autocompleteManager.setupAutocompleteEventListeners();
    }

    // Setup close button after DOM is ready
    setTimeout(() => {
      document
        .getElementById("close-sidebar")
        ?.addEventListener("click", () => {
          // Clear current element so ViewManager doesn't re-show sidebar
          this._currentElement = null;
          this._sidebarManager.hideSidebar();
        });
    }, 100);

    // Setup tab event listeners using TabManager
    this._tabManager.setupTabEventListeners();

    // Setup overview event listeners using OverviewManager
    this._overviewManager.setupOverviewEventListeners();

    // Setup scroll event handling to prevent diagram scrolling
    this._setupScrollEventHandling();
  }

  _setupScrollEventHandling(): void {
    // Wait for DOM to be ready and then setup scroll event handling
    setTimeout(() => {
      // Prevent scroll events from bubbling up to the canvas container
      const sidebar = document.getElementById("documentation-sidebar");
      if (sidebar) {
        // Add event listeners to the sidebar to catch all scroll events
        sidebar.addEventListener(
          "wheel",
          (event: WheelEvent) => {
            // Only stop propagation if the event target is within the sidebar
            if (
              event.target instanceof Element &&
              sidebar.contains(event.target)
            ) {
              event.stopPropagation();
            }
          },
          { passive: false }
        );

        sidebar.addEventListener(
          "scroll",
          (event: Event) => {
            // Only stop propagation if the event target is within the sidebar
            if (
              event.target instanceof Element &&
              sidebar.contains(event.target)
            ) {
              event.stopPropagation();
            }
          },
          { passive: true }
        );

        // Also handle specific scrollable elements within the sidebar
        const sidebarScrollableSelectors = [
          "#doc-preview",
          "#overview-list",
          "#doc-textarea",
          "#autocomplete-dropdown",
        ];

        sidebarScrollableSelectors.forEach((selector) => {
          const element = sidebar.querySelector(selector) as HTMLElement;
          if (element) {
            element.addEventListener(
              "wheel",
              (event: WheelEvent) => {
                event.stopPropagation();
              },
              { passive: false }
            );

            element.addEventListener(
              "scroll",
              (event: Event) => {
                event.stopPropagation();
              },
              { passive: true }
            );
          }
        });
      }

      // Handle help popover separately since it's now a sibling to the sidebar
      const helpPopover = document.getElementById("help-popover");
      if (helpPopover) {
        helpPopover.addEventListener(
          "wheel",
          (event: WheelEvent) => {
            event.stopPropagation();
          },
          { passive: false }
        );

        helpPopover.addEventListener(
          "scroll",
          (event: Event) => {
            event.stopPropagation();
          },
          { passive: true }
        );
      }
    }, 150); // Small delay to ensure DOM is ready
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
    const hasCapability = this._hasDocumentationCapability(element);

    if (documentation || hasCapability) {
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
    console.log(
      "Toggle help popover:",
      helpPopover?.classList.contains("visible")
    );
    if (helpPopover?.classList.contains("visible")) {
      this._hideHelpPopover();
    } else if (helpPopover) {
      this._showHelpPopover();
    }
  }

  _showHelpPopover() {
    const helpPopover = document.getElementById("help-popover");
    if (helpPopover) {
      helpPopover.classList.add("visible");
    }
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

    try {
      const rendered = await this._markdownRenderer.render(value);

      // Ensure we have a string result
      if (typeof rendered === "string") {
        preview.innerHTML = rendered;
      } else {
        console.warn(
          "Unexpected render result type:",
          typeof rendered,
          rendered
        );
        preview.innerHTML = "<em>Error: Unexpected rendering result</em>";
      }
    } catch (error) {
      console.error("Error updating preview:", error);
      preview.innerHTML = `<div class="markdown-error">Preview error: ${error instanceof Error ? error.message : "Unknown error"}</div>`;
    }
    this._setupElementLinks(preview);
    this._setupCodeCopyFunctionality();
  }

  _setupCodeCopyFunctionality() {
    // Add global copy function for code blocks
    if (!(window as any).copyCodeBlock) {
      (window as any).copyCodeBlock = (codeId: string) => {
        const codeElement = document.getElementById(codeId);
        if (codeElement) {
          const text = codeElement.textContent || "";
          navigator.clipboard
            .writeText(text)
            .then(() => {
              // Optional: Show a brief success indicator
              const button = codeElement
                .closest(".markdown-code-block")
                ?.querySelector(".markdown-code-copy");
              if (button) {
                const originalTitle = button.getAttribute("title");
                button.setAttribute("title", "Copied!");
                setTimeout(() => {
                  button.setAttribute("title", originalTitle || "Copy code");
                }, 1000);
              }
            })
            .catch(() => {
              console.warn("Failed to copy code to clipboard");
            });
        }
      };
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

  _handleDiagramImport(): void {
    // Reset state when a new diagram is imported
    this._currentElement = null;
    this._sidebarManager.hideSidebar();

    // Recreate the sidebar for the new canvas container
    // This ensures the sidebar is attached to the correct DOM element
    this._sidebarManager.initializeSidebar();

    // Clear any cached state that might be file-specific
    // The managers will handle their own reset logic if needed
  }

  _handleDiagramDestroy(): void {
    // Clean up when diagram is being destroyed
    this._cleanup();
  }

  _handleDiagramClear(): void {
    // Clean up when diagram is cleared
    this._currentElement = null;
    this._sidebarManager.hideSidebar();
  }

  _cleanup(): void {
    // Reset current element and hide sidebar
    this._currentElement = null;
    this._sidebarManager.hideSidebar();

    // Note: We don't destroy the managers completely as they need to persist
    // across file switches. Each manager handles its own reset logic.
  }

  destroy(): void {
    // Full cleanup when the extension is being destroyed
    this._cleanup();

    // Destroy all managers
    this._sidebarManager.destroy();
    this._viewManager.destroy();
    this._autocompleteManager.destroy();
    this._exportManager.destroy();
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
