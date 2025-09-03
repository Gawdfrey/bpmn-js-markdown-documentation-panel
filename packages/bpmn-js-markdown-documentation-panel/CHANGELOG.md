# bpmn-js-markdown-documentation-panel

## 0.1.0

### Minor Changes

- 63d96a2: Add minimize/restore functionality to documentation panel with session persistence

  - Add minimize button (−) next to close button in documentation panel controls
  - Implement three-state sidebar system: hidden, visible, minimized
  - Add floating minimized icon showing current element name and ID with restore functionality
  - Include session persistence using sessionStorage to maintain minimize preference across element selections
  - Add comprehensive CSS styling for minimized icon with hover effects and responsive design
  - Update SidebarManager with new state management methods and minimize/restore logic

### Patch Changes

- a4d947d: Fix export notification issues and markdown link processing

  - Fix duplicate export notifications by preventing multiple event listeners on export button
  - Fix markdown link processing by removing custom paragraph renderer that interfered with link generation
  - Improve notification styling by appending to document.body instead of canvas container
  - Ensure markdown links like [Element](#ElementId) are properly converted to clickable HTML anchor tags
  - Fix navigation between BPMN elements via documentation links

## 0.0.7

### Patch Changes

- c4e6b5f: feat: added support for github alerts and code snippet rendering in markdown

## 0.0.6

### Patch Changes

- 9606d74: Fix help popover positioning and scroll behavior

  The help popover now positions correctly relative to the documentation panel instead of the browser viewport, and scrolling within the popover no longer interferes with BPMN canvas navigation.

## 0.0.5

### Patch Changes

- f43a2d1: Fixes a visual bug with the resize handle

## 0.0.4

### Patch Changes

- 1d36f57: do not minify camunda output

## 0.0.3

### Patch Changes

- 56f5019: Initial changeset release
