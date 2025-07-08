import type {
  ISidebarManager,
  ISidebarManagerOptions,
} from "../types/interfaces";

export class SidebarManager implements ISidebarManager {
  private _canvas: any;
  private _htmlGenerator: any;
  private _onSidebarReady?: (sidebar: HTMLElement) => void;
  private _sidebar: HTMLElement | null = null;
  private _resizeObserver: any = null;
  private _cleanupRaf: any = null;
  private _isResizing = false;
  private _resizeStartX = 0;
  private _resizeStartWidth = 0;
  private _isVerticalResizing = false;
  private _resizeStartY = 0;
  private _resizeStartHeight = 0;
  private _customWidth: number | null = null;
  private _wasVisible = false;

  constructor(options: ISidebarManagerOptions) {
    this._canvas = options.canvas;
    this._htmlGenerator = options.htmlGenerator;
    this._onSidebarReady = options.onSidebarReady;
  }

  initializeSidebar(): void {
    // Clean up any existing sidebar from previous diagram instances
    const existingSidebar = document.getElementById("documentation-sidebar");
    if (existingSidebar) {
      existingSidebar.remove();
    }

    // Clean up existing horizontal resize handle
    const existingHandle = document.getElementById("horizontal-resize-handle");
    if (existingHandle) {
      existingHandle.remove();
    }

    const sidebar = document.createElement("div");
    sidebar.id = "documentation-sidebar";
    sidebar.className = "documentation-sidebar";
    sidebar.style.display = "none"; // Start hidden
    sidebar.innerHTML = this._htmlGenerator.generateSidebarHTML();

    // Get the canvas container and append sidebar to it instead of document.body
    const canvasContainer = this._getCanvasContainer();

    // Ensure canvas container has relative positioning for absolute sidebar positioning
    const currentPosition = window.getComputedStyle(canvasContainer).position;
    if (currentPosition === "static") {
      canvasContainer.style.position = "relative";
    }

    canvasContainer.appendChild(sidebar);
    this._sidebar = sidebar;

    // Create separate horizontal resize handle
    const horizontalResizeHandle = document.createElement("div");
    horizontalResizeHandle.id = "horizontal-resize-handle";
    horizontalResizeHandle.className = "horizontal-resize-handle";
    canvasContainer.appendChild(horizontalResizeHandle);

    // Notify that sidebar is ready (with small delay to ensure DOM is ready)
    if (this._onSidebarReady) {
      setTimeout(() => {
        this._onSidebarReady?.(sidebar);
      }, 10);
    }

    // Initial positioning
    setTimeout(() => {
      this.updateSidebarPosition();
      this.setupResizeObserver();
      this.setupResizeHandles();
    }, 100);
  }

  showSidebar(): void {
    // Check if sidebar is detached from DOM and reinitialize if needed
    if (this._sidebar && !this._sidebar.parentElement) {
      this.initializeSidebar();
      // Give the initialization a moment to complete
      setTimeout(() => {
        this.showSidebar();
      }, 10);
      return;
    }

    this.updateSidebarPosition();
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

  hideSidebar(): void {
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

  updateSidebarPosition(): void {
    const canvasContainer = this._getCanvasContainer();
    const containerRect = canvasContainer.getBoundingClientRect();

    const propertiesPanel =
      document.querySelector(".bio-properties-panel-container") ||
      document.querySelector(".djs-properties-panel") ||
      document.querySelector('[data-tab="properties"]') ||
      document.querySelector(".properties-panel");

    if (propertiesPanel) {
      const panelRect = propertiesPanel.getBoundingClientRect();

      // Calculate positions relative to the canvas container
      const topOffset = Math.max(panelRect.top - containerRect.top, 0);
      const bottomOffset = Math.max(containerRect.bottom - panelRect.bottom, 0);
      const availableHeight = containerRect.height - topOffset - bottomOffset;

      if (this._sidebar) {
        this._sidebar.style.top = `${topOffset}px`;
        this._sidebar.style.height = `${Math.max(availableHeight, 300)}px`;

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
            horizontalHandle.style.right = `${sidebarWidth}px`;
            horizontalHandle.style.top = `${topOffset}px`;
            horizontalHandle.style.height = `${Math.max(
              availableHeight,
              900
            )}px`;
          }
        }
      }
    } else {
      // Fallback: position relative to canvas container
      if (this._sidebar) {
        this._sidebar.style.right = "0px";
        this._sidebar.style.top = "0px";
        this._sidebar.style.height = "100%";

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
            horizontalHandle.style.right = `${sidebarWidth}px`;
            horizontalHandle.style.top = "0px";
            horizontalHandle.style.height = "100%";
          }
        }
      }
    }
  }

  setupResizeObserver(): void {
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
          this.updateSidebarPosition();
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

    // More frequent position updates only when visible and not resizing
    let rafId: any;
    const updatePosition = () => {
      if (
        this._sidebar?.classList.contains("visible") &&
        this._sidebar.style.display !== "none" &&
        !this._isResizing &&
        !this._isVerticalResizing
      ) {
        this.updateSidebarPosition();
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
      this.updateSidebarPosition();
    });
  }

  setupResizeHandles(): void {
    this._setupHorizontalResize();
    this._setupVerticalResize();
  }

  getSidebar(): HTMLElement | null {
    return this._sidebar;
  }

  isSidebarVisible(): boolean {
    return this._sidebar?.classList.contains("visible") ?? false;
  }

  destroy(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    if (this._cleanupRaf) {
      this._cleanupRaf();
    }
    if (this._sidebar) {
      this._sidebar.remove();
    }
    const horizontalHandle = document.getElementById(
      "horizontal-resize-handle"
    );
    if (horizontalHandle) {
      horizontalHandle.remove();
    }
  }

  private _getCanvasContainer(): HTMLElement {
    return this._canvas?.getContainer() ?? document.body;
  }

  private _setupHorizontalResize(): void {
    const horizontalHandle = document.getElementById(
      "horizontal-resize-handle"
    );
    if (!horizontalHandle) return;

    let rafId: number | null = null;
    let pendingWidth: number | null = null;

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

    const updateResize = () => {
      if (pendingWidth !== null && this._sidebar) {
        this._sidebar.style.setProperty(
          "width",
          `${pendingWidth}px`,
          "important"
        );

        // Update horizontal handle position
        const horizontalHandle = document.getElementById(
          "horizontal-resize-handle"
        );
        if (horizontalHandle) {
          horizontalHandle.style.right = `${pendingWidth}px`;
        }

        pendingWidth = null;
      }
      rafId = null;
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
      pendingWidth = constrainedWidth;

      // Throttle DOM updates using requestAnimationFrame
      if (rafId === null) {
        rafId = requestAnimationFrame(updateResize);
      }
    };

    const handleMouseUp = () => {
      this._isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      // Apply any pending resize immediately
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        updateResize();
      }

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    horizontalHandle.addEventListener("mousedown", handleMouseDown);
  }

  private _setupVerticalResize(): void {
    const verticalHandle = document.getElementById("resize-handle");
    if (!verticalHandle) return;

    let rafId: number | null = null;
    let pendingHeight: number | null = null;

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

    const updateResize = () => {
      if (pendingHeight !== null) {
        const previewElement = document.getElementById("doc-preview");
        if (previewElement) {
          previewElement.style.height = `${pendingHeight}px`;
        }
        pendingHeight = null;
      }
      rafId = null;
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

      pendingHeight = constrainedHeight;

      // Throttle DOM updates using requestAnimationFrame
      if (rafId === null) {
        rafId = requestAnimationFrame(updateResize);
      }
    };

    const handleMouseUp = () => {
      this._isVerticalResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      // Apply any pending resize immediately
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        updateResize();
      }

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    verticalHandle.addEventListener("mousedown", handleMouseDown);
  }
}
