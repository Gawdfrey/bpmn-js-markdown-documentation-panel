---
"bpmn-js-markdown-documentation-panel": patch
---

Fix export notification issues and markdown link processing

- Fix duplicate export notifications by preventing multiple event listeners on export button
- Fix markdown link processing by removing custom paragraph renderer that interfered with link generation
- Improve notification styling by appending to document.body instead of canvas container
- Ensure markdown links like [Element](#ElementId) are properly converted to clickable HTML anchor tags
- Fix navigation between BPMN elements via documentation links