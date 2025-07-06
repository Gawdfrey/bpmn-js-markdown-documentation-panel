import type {
  IElementWithDocumentation,
  IOverviewManager,
  IOverviewManagerCallbacks,
  IOverviewManagerOptions,
} from "../types/interfaces";

export class OverviewManager implements IOverviewManager {
  private _callbacks: IOverviewManagerCallbacks;
  private _currentFilter = "all";
  private _currentSearchTerm = "";

  constructor(options: IOverviewManagerOptions) {
    this._callbacks = options.callbacks;
  }

  setupOverviewEventListeners(): void {
    // Setup overview search and filters after DOM is ready
    setTimeout(() => {
      document
        .getElementById("overview-search")
        ?.addEventListener("input", (event: any) => {
          this.filterOverviewList(event.target.value);
        });

      document.getElementById("show-all")?.addEventListener("click", () => {
        this.setOverviewFilter("all");
      });

      document
        .getElementById("show-documented")
        ?.addEventListener("click", () => {
          this.setOverviewFilter("documented");
        });

      document
        .getElementById("show-undocumented")
        ?.addEventListener("click", () => {
          this.setOverviewFilter("undocumented");
        });
    }, 100);
  }

  refreshOverview(): void {
    // Don't reset filter state when switching tabs - preserve user's filter selection
    // Update button states to reflect current filter
    this._updateFilterButtonStates();
    this._updateCoverageStats();
    this._updateOverviewList();
  }

  filterOverviewList(searchTerm: string): void {
    this._currentSearchTerm = searchTerm;
    this._updateOverviewList();
  }

  setOverviewFilter(filter: string): void {
    this._currentFilter = filter;

    const sidebar = this._callbacks.getSidebar();
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

  destroy(): void {
    // Remove event listeners if needed
    // Currently using global event listeners, so no cleanup needed
  }

  private _updateFilterButtonStates(): void {
    const sidebar = this._callbacks.getSidebar();
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

  private _updateCoverageStats(): void {
    const sidebar = this._callbacks.getSidebar();
    if (!sidebar) return;

    const elements = this._getAllElementsWithDocumentation();
    const documentedCount = elements.filter(
      (el: IElementWithDocumentation) => el.hasDocumentation
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

  private _getAllElementsWithDocumentation(): IElementWithDocumentation[] {
    const elements: IElementWithDocumentation[] = [];
    const seenIds = new Set();
    const allElements = this._callbacks.getAllElements();

    allElements.forEach((element: any) => {
      if (element.businessObject && element.businessObject.id) {
        const bo = element.businessObject;
        const elementId = bo.id;

        if (seenIds.has(elementId)) {
          return;
        }

        seenIds.add(elementId);
        const documentation = this._callbacks.getElementDocumentation(element);

        elements.push({
          id: elementId,
          name: bo.name || "Unnamed",
          type: this._callbacks.getElementTypeName(element),
          hasDocumentation: !!(documentation && documentation.trim()),
          documentation: documentation || "",
          element: element,
        });
      }
    });

    return elements.sort((a, b) => a.id.localeCompare(b.id));
  }

  private _updateOverviewList(): void {
    const sidebar = this._callbacks.getSidebar();
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
          this._callbacks.selectElementById(elementId);
          // Switch to Element tab to show the documentation
          this._callbacks.switchToElementTab();
        }
      });
    });
  }
}
