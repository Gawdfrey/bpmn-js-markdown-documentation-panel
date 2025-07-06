import type {
  IExportManager,
  IExportManagerCallbacks,
  IExportManagerOptions,
} from "../types/interfaces";

export class ExportManager implements IExportManager {
  private _callbacks: IExportManagerCallbacks;

  constructor(options: IExportManagerOptions) {
    this._callbacks = options.callbacks;
  }

  setupExportEventListeners(): void {
    // Setup export functionality after DOM is ready
    setTimeout(() => {
      document.getElementById("export-btn")?.addEventListener("click", () => {
        this.handleExport("html");
      });
    }, 100);
  }

  handleExport(format: "html"): void {
    this._callbacks.exportDocumentation(format);
  }

  destroy(): void {
    // Remove event listeners if needed
    // Currently using global event listeners, so no cleanup needed
  }
}
