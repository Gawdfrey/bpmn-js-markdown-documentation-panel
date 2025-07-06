export type ViewType = "diagram" | "xml" | "unknown";

export interface IViewManager {
  getCurrentView(): ViewType;
  setupViewDetection(): void;
  updateSidebarVisibility(): void;
  destroy(): void;
}

export interface IHtmlTemplateGenerator {
  generateSidebarHTML(): string;
}

export interface IHtmlTemplateGeneratorOptions {
  isModeler: boolean;
}

export interface ISidebarManager {
  initializeSidebar(): void;
  showSidebar(): void;
  hideSidebar(): void;
  updateSidebarPosition(): void;
  setupResizeObserver(): void;
  setupResizeHandles(): void;
  getSidebar(): HTMLElement | null;
  isSidebarVisible(): boolean;
  destroy(): void;
}

export interface ISidebarManagerOptions {
  canvas: any;
  htmlGenerator: IHtmlTemplateGenerator;
  onSidebarReady?: (sidebar: HTMLElement) => void;
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

export interface ITabManager {
  setupTabEventListeners(): void;
  switchTab(tabName: string): void;
  destroy(): void;
}

export interface ITabManagerCallbacks {
  onOverviewTabActivated: () => void;
  onElementTabActivated: () => void;
  getSidebar: () => HTMLElement | null;
  isSidebarVisible: () => boolean;
}

export interface ITabManagerOptions {
  callbacks: ITabManagerCallbacks;
}

export interface IOverviewManager {
  setupOverviewEventListeners(): void;
  refreshOverview(): void;
  filterOverviewList(searchTerm: string): void;
  setOverviewFilter(filter: string): void;
  destroy(): void;
}

export interface IOverviewManagerCallbacks {
  getAllElements: () => any[];
  getElementDocumentation: (element: any) => string | null;
  getElementTypeName: (element: any) => string;
  getSidebar: () => HTMLElement | null;
  selectElementById: (elementId: string) => void;
  switchToElementTab: () => void;
}

export interface IOverviewManagerOptions {
  callbacks: IOverviewManagerCallbacks;
}

export interface IElementWithDocumentation {
  id: string;
  name: string;
  type: string;
  hasDocumentation: boolean;
  documentation: string;
  element: any;
}

export interface IAutocompleteManager {
  setupAutocompleteEventListeners(): void;
  handleAutocomplete(): void;
  hideAutocomplete(): void;
  destroy(): void;
}

export interface IAutocompleteManagerCallbacks {
  getAllElements: () => any[];
  getElementTypeName: (element: any) => string;
  getCanvasContainer: () => HTMLElement;
  updatePreview: () => void;
  saveDocumentationLive: () => void;
}

export interface IAutocompleteManagerOptions {
  callbacks: IAutocompleteManagerCallbacks;
}

export interface IAutocompleteElement {
  id: string;
  name: string;
  type: string;
}

export interface IExportManager {
  setupExportEventListeners(): void;
  handleExport(format: "html"): void;
  destroy(): void;
}

export interface IExportManagerCallbacks {
  exportDocumentation: (format: "html") => void;
}

export interface IExportManagerOptions {
  callbacks: IExportManagerCallbacks;
}
