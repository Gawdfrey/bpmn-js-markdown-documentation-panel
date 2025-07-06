import type {
  IAutocompleteElement,
  IAutocompleteManager,
  IAutocompleteManagerCallbacks,
  IAutocompleteManagerOptions,
} from "../types/interfaces";

export class AutocompleteManager implements IAutocompleteManager {
  private _callbacks: IAutocompleteManagerCallbacks;
  private _selectedIndex = -1;

  constructor(options: IAutocompleteManagerOptions) {
    this._callbacks = options.callbacks;
  }

  setupAutocompleteEventListeners(): void {
    // Setup autocomplete after DOM is ready
    setTimeout(() => {
      // Only setup autocomplete in modeler mode
      const textarea = document.getElementById(
        "doc-textarea"
      ) as HTMLTextAreaElement | null;
      if (!textarea) return;

      // Handle autocomplete on input
      textarea.addEventListener("input", () => {
        this.handleAutocomplete();
      });

      // Add keydown listener for autocomplete navigation
      textarea.addEventListener("keydown", (event: any) => {
        this._handleAutocompleteKeydown(event);
      });

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
          this.hideAutocomplete();
        }
      });
    }, 100);
  }

  handleAutocomplete(): void {
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
    this.hideAutocomplete();
  }

  hideAutocomplete(): void {
    const dropdown = document.getElementById(
      "autocomplete-dropdown"
    ) as HTMLElement | null;
    if (!dropdown) return;
    dropdown.classList.remove("visible");
    this._selectedIndex = -1;
  }

  destroy(): void {
    // Hide autocomplete when destroying
    this.hideAutocomplete();
  }

  private _showAutocomplete(searchText: string, hashPos: number): void {
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
      this.hideAutocomplete();
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

  private _positionAutocomplete(
    textarea: HTMLTextAreaElement,
    hashPos: number
  ): void {
    const dropdown = document.getElementById(
      "autocomplete-dropdown"
    ) as HTMLElement | null;
    if (!dropdown) return;

    // Get textarea position and cursor position
    const textareaRect = textarea.getBoundingClientRect();
    const style = window.getComputedStyle(textarea);

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
    this._callbacks.getCanvasContainer().appendChild(tempSpan);
    this._callbacks.getCanvasContainer().removeChild(tempSpan);

    // Position within the visible area - use a fixed position in the middle of the textarea
    const left = textareaRect.left + 10;
    const top = textareaRect.top + 100; // Fixed 100px from top of textarea

    dropdown.style.setProperty("left", `${left}px`, "important");
    dropdown.style.setProperty("top", `${top}px`, "important");
    dropdown.style.setProperty("position", "fixed", "important");
    dropdown.style.setProperty("z-index", "10001", "important");
  }

  private _getAllElements(): IAutocompleteElement[] {
    const elements: IAutocompleteElement[] = [];
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
        elements.push({
          id: elementId,
          name: bo.name || "Unnamed",
          type: this._callbacks.getElementTypeName(element),
        });
      }
    });

    return elements.sort((a, b) => a.id.localeCompare(b.id));
  }

  private _handleAutocompleteKeydown(event: any): void {
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
      this.hideAutocomplete();
    }
  }

  private _updateAutocompleteSelection(items: any[]): void {
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

  private _selectAutocompleteItem(elementId: string, hashPos: number): void {
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
    this.hideAutocomplete();
    this._callbacks.updatePreview();
    this._callbacks.saveDocumentationLive();

    // Focus back to textarea
    textarea.focus();
  }
}
