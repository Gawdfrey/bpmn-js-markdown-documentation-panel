---
"bpmn-js-markdown-documentation-panel": minor
---

Add minimize/restore functionality to documentation panel with session persistence

- Add minimize button (−) next to close button in documentation panel controls
- Implement three-state sidebar system: hidden, visible, minimized
- Add floating minimized icon showing current element name and ID with restore functionality
- Include session persistence using sessionStorage to maintain minimize preference across element selections
- Add comprehensive CSS styling for minimized icon with hover effects and responsive design
- Update SidebarManager with new state management methods and minimize/restore logic