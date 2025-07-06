import type {
  ITabManager,
  ITabManagerCallbacks,
  ITabManagerOptions,
} from "../types/interfaces";

export class TabManager implements ITabManager {
  private _callbacks: ITabManagerCallbacks;

  constructor(options: ITabManagerOptions) {
    this._callbacks = options.callbacks;
  }

  setupTabEventListeners(): void {
    // Setup tab switching after DOM is ready
    setTimeout(() => {
      document.getElementById("element-tab")?.addEventListener("click", () => {
        this.switchTab("element");
      });

      document.getElementById("overview-tab")?.addEventListener("click", () => {
        this.switchTab("overview");
        this._callbacks.onOverviewTabActivated();
      });
    }, 100);
  }

  switchTab(tabName: string): void {
    if (!this._callbacks.isSidebarVisible()) return;

    const sidebar = this._callbacks.getSidebar();
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

    // Call specific callbacks based on tab
    if (tabName === "element") {
      this._callbacks.onElementTabActivated();
    }
  }

  destroy(): void {
    // Remove event listeners if needed
    // Currently using global event listeners, so no cleanup needed
  }
}
