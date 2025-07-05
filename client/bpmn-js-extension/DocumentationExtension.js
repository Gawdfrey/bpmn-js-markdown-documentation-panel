import { is } from "bpmn-js/lib/util/ModelUtil";
import { marked } from "marked";

export default class DocumentationExtension {
  constructor(eventBus, elementRegistry, modeling, moddle, selection, canvas) {
    this._eventBus = eventBus;
    this._elementRegistry = elementRegistry;
    this._modeling = modeling;
    this._moddle = moddle;
    this._selection = selection;
    this._canvas = canvas;
    this._currentElement = null;
    this._sidebar = null;
    this._resizeObserver = null;
    this._saveTimeout = null;
    this._wasVisible = false;
    this._selectedIndex = -1;

    this._initializeSidebar();

    eventBus.on("element.click", (event) => {
      const { element } = event;
      this._handleElementClick(element);
    });

    eventBus.on("selection.changed", (event) => {
      const { newSelection } = event;
      if (newSelection && newSelection.length > 0) {
        this._handleElementClick(newSelection[0]);
      } else {
        this._hideSidebar();
      }
    });

    // Also listen for connection clicks specifically
    eventBus.on("connection.click", (event) => {
      const { element } = event;
      this._handleElementClick(element);
    });

    // Also listen for canvas clicks to hide sidebar
    eventBus.on("canvas.click", (event) => {
      // Small delay to let selection.changed fire first
      setTimeout(() => {
        if (!this._currentElement) {
          this._hideSidebar();
        }
      }, 10);
    });

    // Initial positioning
    setTimeout(() => {
      this._updateSidebarPosition();
      this._setupResizeObserver();
      this._setupViewObserver();
    }, 100);
  }

  _initializeSidebar() {
    const sidebar = document.createElement("div");
    sidebar.id = "documentation-sidebar";
    sidebar.className = "documentation-sidebar";
    sidebar.style.display = "none"; // Start hidden
    sidebar.innerHTML = `
      <div class="documentation-header">
        <div class="header-content">
          <div class="title-row">
            <h3>Documentation</h3>
            <button class="help-btn" id="help-btn">?</button>
          </div>
          <div class="element-metadata" id="element-metadata">
            <span class="element-name" id="element-name"></span>
          </div>
        </div>
        <button class="close-btn" id="close-sidebar">×</button>
      </div>
      <div class="help-popover" id="help-popover">
        <div class="help-content">
          <h4>Documentation Panel Guide</h4>
          <div class="help-section">
            <strong>What is this panel?</strong>
            <p>This panel allows you to add and view documentation for BPMN elements in your diagram.</p>
          </div>
          <div class="help-section">
            <strong>How to use:</strong>
            <ul>
              <li><strong>Select an element</strong> - Click on any BPMN element (task, gateway, event, etc.) to view or edit its documentation</li>
              <li><strong>Edit documentation</strong> - Use the editor below to write documentation in Markdown format</li>
              <li><strong>Preview</strong> - The top section shows a live preview of your formatted documentation</li>
            </ul>
          </div>
          <div class="help-section">
            <strong>Markdown support:</strong>
            <p>Use standard Markdown syntax for formatting: **bold**, *italic*, lists, links, and more.</p>
          </div>
          <div class="help-section">
            <strong>Creating links:</strong>
            <p>Link to other BPMN elements using their ID:</p>
            <code>[Element Name](#elementId)</code>
            <p>Example: <code>[Check Inventory](#Task_CheckInventory)</code></p>
            <p>Link to external resources:</p>
            <code>[External Link](https://example.com)</code>
            <p><em>Tip: Element IDs can be found in the properties panel or by selecting the element. Type # inside () for autocomplete suggestions.</em></p>
          </div>
        </div>
      </div>
      <div class="documentation-content">
        <div class="documentation-preview" id="doc-preview"></div>
        <div class="documentation-bottom">
          <div class="resize-handle" id="resize-handle"></div>
          <div class="documentation-editor">
            <div class="editor-container">
              <textarea id="doc-textarea" placeholder="Write documentation in Markdown..."></textarea>
              <div class="autocomplete-dropdown" id="autocomplete-dropdown">
                <div class="autocomplete-list" id="autocomplete-list"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(sidebar);
    this._sidebar = sidebar;

    document.getElementById("close-sidebar").addEventListener("click", () => {
      this._hideSidebar();
    });

    document.getElementById("help-btn").addEventListener("click", () => {
      this._toggleHelpPopover();
    });

    // Close popover when clicking outside
    document.addEventListener("click", (event) => {
      const helpPopover = document.getElementById("help-popover");
      const helpBtn = document.getElementById("help-btn");

      if (
        helpPopover &&
        helpPopover.classList.contains("visible") &&
        !helpPopover.contains(event.target) &&
        !helpBtn.contains(event.target)
      ) {
        this._hideHelpPopover();
      }
    });

    const textarea = document.getElementById("doc-textarea");
    textarea.addEventListener("input", () => {
      this._updatePreview();
      this._saveDocumentationLive();
      this._handleAutocomplete();
    });

    // Add keydown listener for autocomplete navigation
    textarea.addEventListener("keydown", (event) => {
      this._handleAutocompleteKeydown(event);
    });

    // Hide autocomplete when clicking outside
    document.addEventListener("click", (event) => {
      const dropdown = document.getElementById("autocomplete-dropdown");
      const textarea = document.getElementById("doc-textarea");
      
      if (!dropdown.contains(event.target) && event.target !== textarea) {
        this._hideAutocomplete();
      }
    });

    this._setupResizeHandle();
  }

  _handleElementClick(element) {
    if (!element || !element.businessObject) {
      this._currentElement = null;
      this._hideSidebar();
      return;
    }

    const documentation = this._getElementDocumentation(element);

    if (documentation || this._hasDocumentationCapability(element)) {
      this._currentElement = element;
      this._showSidebar(documentation || "");
    } else {
      this._currentElement = null;
      this._hideSidebar();
    }
  }

  _getElementDocumentation(element) {
    const businessObject = element.businessObject;

    if (
      businessObject.documentation &&
      businessObject.documentation.length > 0
    ) {
      return businessObject.documentation[0].text;
    }

    return null;
  }

  _hasDocumentationCapability(element) {
    return element.businessObject;
  }

  _showSidebar(documentation) {
    const textarea = document.getElementById("doc-textarea");
    textarea.value = documentation || "";
    this._updateElementMetadata();
    this._updatePreview();
    this._updateSidebarPosition();
    this._sidebar.style.display = "flex";
    this._sidebar.classList.add("visible");
    this._wasVisible = true;
  }

  _hideSidebar() {
    this._wasVisible = this._sidebar.classList.contains("visible");
    this._sidebar.classList.remove("visible");
    this._sidebar.style.display = "none";
  }

  _toggleHelpPopover() {
    const helpPopover = document.getElementById("help-popover");
    if (helpPopover.classList.contains("visible")) {
      this._hideHelpPopover();
    } else {
      this._showHelpPopover();
    }
  }

  _showHelpPopover() {
    const helpPopover = document.getElementById("help-popover");
    helpPopover.classList.add("visible");
  }

  _hideHelpPopover() {
    const helpPopover = document.getElementById("help-popover");
    helpPopover.classList.remove("visible");
  }

  _updateSidebarPosition() {
    const propertiesPanel =
      document.querySelector(".bio-properties-panel-container") ||
      document.querySelector(".djs-properties-panel") ||
      document.querySelector('[data-tab="properties"]') ||
      document.querySelector(".properties-panel");

    if (propertiesPanel) {
      const panelRect = propertiesPanel.getBoundingClientRect();
      const panelWidth = panelRect.width;
      const panelTop = panelRect.top;

      // Position sidebar to the left of the properties panel
      this._sidebar.style.right = `${panelWidth}px`;
      this._sidebar.style.width = "350px";
      this._sidebar.style.top = `${Math.max(panelTop, 0)}px`;
      this._sidebar.style.height = `${
        window.innerHeight - Math.max(panelTop, 0)
      }px`;
    } else {
      // Fallback positioning if properties panel not found
      this._sidebar.style.right = "300px";
      this._sidebar.style.width = "350px";
      this._sidebar.style.top = "0px";
      this._sidebar.style.height = "100vh";
    }
  }

  _setupResizeObserver() {
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
          this._updateSidebarPosition();
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

    // More frequent position updates only when visible
    let rafId;
    const updatePosition = () => {
      if (
        this._sidebar &&
        this._sidebar.classList.contains("visible") &&
        this._sidebar.style.display !== "none"
      ) {
        this._updateSidebarPosition();
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
      this._updateSidebarPosition();
    });
  }

  _updatePreview() {
    const textarea = document.getElementById("doc-textarea");
    const preview = document.getElementById("doc-preview");
    const markdown = textarea.value;

    if (markdown && markdown.trim()) {
      preview.innerHTML = marked(markdown);
      this._setupElementLinks(preview);
    } else {
      preview.innerHTML =
        "<p><em>No documentation yet. Start typing to see a preview.</em></p>";
    }
  }

  _setupElementLinks(container) {
    // Find all links that start with # (element links)
    const links = container.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const elementId = link.getAttribute('href').substring(1); // Remove the #
        this._selectElementById(elementId);
      });
      
      // Add visual styling to indicate these are special links
      link.style.cursor = 'pointer';
      link.style.textDecoration = 'underline';
      link.style.color = '#0066cc';
    });
  }

  _selectElementById(elementId) {
    try {
      // Get the element from the element registry
      const element = this._elementRegistry.get(elementId);
      
      if (element) {
        // Use the selection service to select the element
        this._selection.select(element);
        
        // Scroll the element into view
        this._canvas.scrollToElement(element);
        
        console.log(`Selected element: ${elementId}`);
      } else {
        console.warn(`Element with ID "${elementId}" not found in the diagram`);
        
        // Show a subtle notification to the user
        this._showLinkNotification(`Element "${elementId}" not found`);
      }
    } catch (error) {
      console.error('Error selecting element:', error);
      this._showLinkNotification(`Error selecting element "${elementId}"`);
    }
  }

  _showLinkNotification(message) {
    // Create a temporary notification
    const notification = document.createElement('div');
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
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  _handleAutocomplete() {
    const textarea = document.getElementById("doc-textarea");
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;
    
    // Find the position of # before cursor, but only if inside parentheses
    let hashPos = -1;
    let openParenPos = -1;
    let closeParenPos = -1;
    
    // First, find if we're inside parentheses of a markdown link
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (text[i] === ')') {
        closeParenPos = i;
        break; // We're after a closing paren, not inside link
      }
      if (text[i] === '(') {
        openParenPos = i;
        break;
      }
      if (text[i] === '[' || text[i] === '\n') {
        break; // Stop at link start or line boundary
      }
    }
    
    // Only proceed if we found an opening paren and no closing paren (we're inside parentheses)
    if (openParenPos >= 0 && closeParenPos === -1) {
      // Now look for # after the opening paren
      for (let i = cursorPos - 1; i >= openParenPos; i--) {
        if (text[i] === '#') {
          hashPos = i;
          break;
        }
        if (text[i] === ' ' || text[i] === '\n') {
          break; // Stop at word boundary
        }
      }
    }
    
    if (hashPos >= 0 && openParenPos >= 0) {
      const searchText = text.substring(hashPos + 1, cursorPos);
      this._showAutocomplete(searchText, hashPos);
    } else {
      this._hideAutocomplete();
    }
  }

  _showAutocomplete(searchText, hashPos) {
    const dropdown = document.getElementById("autocomplete-dropdown");
    const autocompleteList = document.getElementById("autocomplete-list");
    const textarea = document.getElementById("doc-textarea");
    
    // Get all elements and filter by search text
    const elements = this._getAllElements();
    const filteredElements = elements.filter(element => 
      element.id.toLowerCase().includes(searchText.toLowerCase()) ||
      element.name.toLowerCase().includes(searchText.toLowerCase())
    );
    
    if (filteredElements.length === 0) {
      this._hideAutocomplete();
      return;
    }
    
    // Clear previous items
    autocompleteList.innerHTML = '';
    
    // Add filtered items
    filteredElements.slice(0, 10).forEach((element, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      if (index === 0) item.classList.add('selected');
      
      item.innerHTML = `
        <div class="autocomplete-item-id">${element.id}</div>
        <div class="autocomplete-item-name">${element.name}</div>
        <div class="autocomplete-item-type">${element.type}</div>
      `;
      
      item.addEventListener('click', () => {
        this._selectAutocompleteItem(element.id, hashPos);
      });
      
      autocompleteList.appendChild(item);
    });
    
    // Position the dropdown
    this._positionAutocomplete(textarea, hashPos);
    
    // Show dropdown
    dropdown.classList.add('visible');
    this._selectedIndex = 0;
  }

  _hideAutocomplete() {
    const dropdown = document.getElementById("autocomplete-dropdown");
    dropdown.classList.remove('visible');
    this._selectedIndex = -1;
  }

  _positionAutocomplete(textarea, hashPos) {
    const dropdown = document.getElementById("autocomplete-dropdown");
    
    // Position dropdown at the top of the textarea area
    dropdown.style.top = '10px';
    dropdown.style.left = '10px';
    dropdown.style.bottom = 'auto';
  }

  _getAllElements() {
    const elements = [];
    const seenIds = new Set();
    const allElements = this._elementRegistry.getAll();
    
    allElements.forEach(element => {
      if (element.businessObject && element.businessObject.id) {
        const bo = element.businessObject;
        const elementId = bo.id;
        
        // Skip if we've already seen this ID
        if (seenIds.has(elementId)) {
          return;
        }
        
        seenIds.add(elementId);
        elements.push({
          id: elementId,
          name: bo.name || 'Unnamed',
          type: this._getElementTypeName(element)
        });
      }
    });
    
    return elements.sort((a, b) => a.id.localeCompare(b.id));
  }

  _getElementTypeName(element) {
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

  _handleAutocompleteKeydown(event) {
    const dropdown = document.getElementById("autocomplete-dropdown");
    
    if (!dropdown.classList.contains('visible')) {
      return;
    }
    
    const items = dropdown.querySelectorAll('.autocomplete-item');
    
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._selectedIndex = Math.min(this._selectedIndex + 1, items.length - 1);
      this._updateAutocompleteSelection(items);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._selectedIndex = Math.max(this._selectedIndex - 1, 0);
      this._updateAutocompleteSelection(items);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this._selectedIndex >= 0 && items[this._selectedIndex]) {
        const selectedId = items[this._selectedIndex].querySelector('.autocomplete-item-id').textContent;
        const textarea = document.getElementById("doc-textarea");
        const cursorPos = textarea.selectionStart;
        const text = textarea.value;
        
        // Find hash position
        let hashPos = -1;
        for (let i = cursorPos - 1; i >= 0; i--) {
          if (text[i] === '#') {
            hashPos = i;
            break;
          }
        }
        
        if (hashPos >= 0) {
          this._selectAutocompleteItem(selectedId, hashPos);
        }
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this._hideAutocomplete();
    }
  }

  _updateAutocompleteSelection(items) {
    const dropdown = document.getElementById("autocomplete-dropdown");
    
    items.forEach((item, index) => {
      if (index === this._selectedIndex) {
        item.classList.add('selected');
        
        // Scroll the selected item into view
        const itemTop = item.offsetTop;
        const itemBottom = itemTop + item.offsetHeight;
        const dropdownTop = dropdown.scrollTop;
        const dropdownBottom = dropdownTop + dropdown.clientHeight;
        
        if (itemTop < dropdownTop) {
          // Item is above visible area, scroll up
          dropdown.scrollTop = itemTop;
        } else if (itemBottom > dropdownBottom) {
          // Item is below visible area, scroll down
          dropdown.scrollTop = itemBottom - dropdown.clientHeight;
        }
      } else {
        item.classList.remove('selected');
      }
    });
  }

  _selectAutocompleteItem(elementId, hashPos) {
    const textarea = document.getElementById("doc-textarea");
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

  _setElementDocumentation(element, documentation) {
    const businessObject = element.businessObject;

    // Clear existing documentation
    if (businessObject.documentation) {
      businessObject.documentation.length = 0;
    }

    // Add new documentation if provided
    if (documentation && documentation.trim()) {
      if (!businessObject.documentation) {
        businessObject.documentation = [];
      }

      businessObject.documentation.push({
        $type: "bpmn:Documentation",
        text: documentation.trim(),
      });
    }

    // Fire element changed event to update the XML
    this._eventBus.fire("element.changed", { element });
  }

  _saveDocumentationLive() {
    if (!this._currentElement) return;

    // Clear existing timeout
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
    }

    // Debounce the save to avoid rapid-fire updates
    this._saveTimeout = setTimeout(() => {
      const textarea = document.getElementById("doc-textarea");
      const documentation = textarea.value;

      try {
        // Use moddle to create proper BPMN documentation object
        const properties = {};
        if (documentation && documentation.trim()) {
          const docObject = this._moddle.create("bpmn:Documentation", {
            text: documentation.trim(),
          });
          properties.documentation = [docObject];
        } else {
          properties.documentation = [];
        }

        this._modeling.updateProperties(this._currentElement, properties);
      } catch (error) {
        console.error("Error updating documentation:", error);
        // Fallback to direct businessObject update
        this._setElementDocumentation(this._currentElement, documentation);
      }
    }, 300); // Wait 300ms after user stops typing
  }

  _setupResizeHandle() {
    const resizeHandle = document.getElementById("resize-handle");
    const preview = document.getElementById("doc-preview");
    const bottomSection = document.querySelector(".documentation-bottom");
    let isResizing = false;
    let startY = 0;
    let startPreviewHeight = 0;
    let startBottomHeight = 0;

    resizeHandle.addEventListener("mousedown", (e) => {
      isResizing = true;
      startY = e.clientY;
      startPreviewHeight = preview.offsetHeight;
      startBottomHeight = bottomSection.offsetHeight;

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      e.preventDefault();
    });

    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const deltaY = e.clientY - startY;
      const newPreviewHeight = startPreviewHeight + deltaY;
      const newBottomHeight = startBottomHeight - deltaY;

      // Minimum heights
      const minHeight = 100;
      if (newPreviewHeight >= minHeight && newBottomHeight >= minHeight) {
        preview.style.height = `${newPreviewHeight}px`;
        bottomSection.style.height = `${newBottomHeight}px`;
      }
    };

    const handleMouseUp = () => {
      isResizing = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }

  _setupViewObserver() {
    // Watch for tab changes in the main content area
    const observer = new MutationObserver(() => {
      this._checkCurrentView();
    });

    // Observe the main app container for changes
    const appContainer =
      document.querySelector(".app-content") ||
      document.querySelector(".content") ||
      document.body;

    if (appContainer) {
      observer.observe(appContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }

    // Also listen for click events on tab buttons
    document.addEventListener("click", (e) => {
      if (
        e.target.closest("[data-tab]") ||
        e.target.closest(".bio-properties-panel-tab") ||
        e.target.closest(".tab")
      ) {
        setTimeout(() => this._checkCurrentView(), 100);
      }
    });
  }

  _updateElementMetadata() {
    if (!this._currentElement) return;

    const element = this._currentElement;
    const businessObject = element.businessObject;

    // Get element ID
    const elementId = businessObject.id || "Unknown ID";

    // Update the metadata display
    document.getElementById("element-name").textContent = elementId;
  }

  _checkCurrentView() {
    // Check if XML editor is actually present and visible
    const xmlEditor = document.querySelector(".cm-editor");
    const codeEditor = document.querySelector(".CodeMirror");

    // Only hide if we can actually see an XML/code editor
    if (
      (xmlEditor && xmlEditor.offsetParent !== null) ||
      (codeEditor && codeEditor.offsetParent !== null)
    ) {
      if (this._sidebar.classList.contains("visible")) {
        this._hideSidebar();
      }
    }
  }
}

DocumentationExtension.$inject = [
  "eventBus",
  "elementRegistry",
  "modeling",
  "moddle",
  "selection",
  "canvas",
];
