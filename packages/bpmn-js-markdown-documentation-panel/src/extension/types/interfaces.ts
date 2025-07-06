export type ViewType = "diagram" | "xml" | "unknown";

export interface IViewManager {
  getCurrentView(): ViewType;
  setupViewDetection(): void;
  updateSidebarVisibility(): void;
  destroy(): void;
}

export interface IDocumentationExtensionDependencies {
  eventBus: any;
  elementRegistry: any;
  modeling: any;
  moddle: any;
  selection: any;
  canvas: any;
  isModeler: boolean;
}

export interface IDocumentationExtensionState {
  currentElement: any;
  sidebar: HTMLElement | null;
  currentView: ViewType;
  wasVisible: boolean;
}

export interface IViewManagerCallbacks {
  onViewChanged: (newView: ViewType) => void;
  hideSidebar: () => void;
  showSidebar: (documentation: string) => void;
  getElementDocumentation: (element: any) => string | null;
  getCurrentElement: () => any;
}
