import type {
  IViewManager,
  IViewManagerCallbacks,
  ViewType,
} from "../types/interfaces";

export class ViewManager implements IViewManager {
  private _currentView: ViewType = "diagram";
  private _viewCheckInterval: any = null;
  private _callbacks: IViewManagerCallbacks;

  constructor(callbacks: IViewManagerCallbacks) {
    this._callbacks = callbacks;
  }

  getCurrentView(): ViewType {
    return this._currentView;
  }

  setupViewDetection(): void {
    // Check view state periodically
    this._viewCheckInterval = setInterval(() => {
      const newView = this._detectCurrentView();
      if (newView !== this._currentView) {
        this._currentView = newView;
        this._callbacks.onViewChanged(newView);
        this.updateSidebarVisibility();
      }
    }, 500); // Check every 500ms
  }

  updateSidebarVisibility(): void {
    if (this._currentView === "xml") {
      // Hide sidebar in XML view
      this._callbacks.hideSidebar();
    } else if (this._currentView === "diagram") {
      // Show sidebar in diagram view if element is selected
      const currentElement = this._callbacks.getCurrentElement();
      if (currentElement) {
        const documentation =
          this._callbacks.getElementDocumentation(currentElement);
        this._callbacks.showSidebar(documentation || "");
      }
    }
  }

  destroy(): void {
    if (this._viewCheckInterval) {
      clearInterval(this._viewCheckInterval);
      this._viewCheckInterval = null;
    }
  }

  private _detectCurrentView(): ViewType {
    // Check if XML editor is actually present and visible
    const xmlEditor = document.querySelector(".cm-editor") as HTMLElement;
    const codeEditor = document.querySelector(".CodeMirror") as HTMLElement;

    // Only detect XML view if we can actually see an XML/code editor
    if (
      (xmlEditor && xmlEditor.offsetParent !== null) ||
      (codeEditor && codeEditor.offsetParent !== null)
    ) {
      return "xml";
    }

    return "diagram";
  }
}
