import { marked } from "marked";

/**
 * Enhanced markdown renderer with GitHub-style alerts and improved code block rendering
 */
export class MarkdownRenderer {
  private renderer: any;

  constructor() {
    this.renderer = new marked.Renderer();
    this.setupRenderer();
    this.configureMarked();
  }

  private setupRenderer() {
    // Override blockquote rendering to handle GitHub-style alerts
    this.renderer.blockquote = (quote: any) => {
      // Handle the fact that marked sometimes passes token objects
      let quoteStr = "";
      if (typeof quote === "string") {
        quoteStr = quote;
      } else if (quote && typeof quote === "object") {
        // If it's a token object, try to extract the text content
        if (quote.text) {
          quoteStr = quote.text;
        } else if (quote.tokens && Array.isArray(quote.tokens)) {
          // Process tokens to extract text
          quoteStr = quote.tokens
            .map((token: any) => {
              if (typeof token === "string") return token;
              if (token && token.text) return token.text;
              if (token && token.raw) return token.raw;
              return "";
            })
            .join("");
        } else {
          quoteStr = String(quote);
        }
      } else {
        quoteStr = String(quote || "");
      }

      // Check for GitHub alert syntax in various HTML formats
      // Pattern 1: <p>[!TYPE]</p><p>content</p>
      let alertMatch = quoteStr.match(
        /<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]<\/p>\s*<p>([\s\S]*?)<\/p>/
      );

      // Pattern 2: <p>[!TYPE] content</p> (inline)
      if (!alertMatch) {
        alertMatch = quoteStr.match(
          /<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s+([\s\S]*?)<\/p>/
        );
      }

      // Pattern 3: Plain text format
      if (!alertMatch) {
        alertMatch = quoteStr.match(
          /\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s+([\s\S]*?)$/
        );
      }

      if (alertMatch) {
        const [, type, content] = alertMatch;
        const alertType = type.toLowerCase();
        const icon = this.getAlertIcon(alertType);

        return `
          <div class="markdown-alert markdown-alert-${alertType}">
            <p class="markdown-alert-title">
              ${icon}
              ${type}
            </p>
            <div class="markdown-alert-content">${content}</div>
          </div>
        `;
      }

      // Also check for our special marker (fallback)
      const alertMarkerMatch = quoteStr.match(
        /GITHUB_ALERT_(NOTE|TIP|IMPORTANT|WARNING|CAUTION):([\s\S]*)$/
      );
      if (alertMarkerMatch) {
        const [, type, content] = alertMarkerMatch;
        const alertType = type.toLowerCase();
        const icon = this.getAlertIcon(alertType);
        const cleanContent = content.trim();

        return `
          <div class="markdown-alert markdown-alert-${alertType}">
            <p class="markdown-alert-title">
              ${icon}
              ${type}
            </p>
            ${cleanContent && cleanContent !== "No content" ? `<div class="markdown-alert-content">${this.escapeHtml(cleanContent)}</div>` : ""}
          </div>
        `;
      }

      return `<blockquote>${quoteStr}</blockquote>`;
    };

    // Enhanced code block rendering
    this.renderer.code = (
      code: any,
      language?: string,
      escaped?: boolean,
      meta?: string
    ) => {
      // Ensure code is a string and handle object cases properly
      let codeStr = "";
      if (typeof code === "string") {
        codeStr = code;
      } else if (code && typeof code === "object") {
        // If it's an object, try to extract meaningful content
        if (code.text) {
          codeStr = code.text;
        } else if (code.raw) {
          codeStr = code.raw;
        } else {
          codeStr = String(code);
        }
      } else {
        codeStr = String(code || "");
      }

      const validLanguage = language || "";

      // Parse title and language information
      let title = "";
      let actualLanguage = validLanguage;

      // Look for block ID in the code content
      const blockIdMatch = codeStr.match(/<!-- BLOCK_ID:([^>]+) -->/);
      if (blockIdMatch) {
        const blockId = blockIdMatch[1];
        const blockData = MarkdownRenderer.codeBlockData.get(blockId);
        if (blockData) {
          title = blockData.title;
          actualLanguage = blockData.language;
        }
        // Remove the comment from the code
        codeStr = codeStr.replace(/<!-- BLOCK_ID:[^>]+ -->\s*/, "");
      }

      // Ensure we have a valid language
      const displayLanguage = actualLanguage || validLanguage || "text";

      // Escape the code after processing
      const escapedCode = this.escapeHtml(codeStr);

      // Create unique ID for this code block to avoid conflicts
      const codeId = "code_" + Math.random().toString(36).substr(2, 9);

      return `<div class="markdown-code-block">
  <div class="markdown-code-header">
    <div class="markdown-code-info">
      ${title ? `<span class="markdown-code-title">${this.escapeHtml(title)}</span>` : ""}
      <span class="markdown-code-language">${displayLanguage}</span>
    </div>
    <button class="markdown-code-copy" onclick="copyCodeBlock('${codeId}')" title="Copy code">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
        <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
      </svg>
    </button>
  </div>
  <pre><code id="${codeId}" class="language-${displayLanguage}">${escapedCode}</code></pre>
</div>`;
    };

    // Enhanced inline code rendering
    this.renderer.codespan = (code: string) => {
      return `<code class="markdown-inline-code">${this.escapeHtml(code)}</code>`;
    };
  }

  private configureMarked() {
    marked.setOptions({
      renderer: this.renderer,
      gfm: true,
      breaks: true,
    });
  }

  private getAlertIcon(type: string): string {
    const icons: Record<string, string> = {
      note: `<svg class="markdown-alert-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/>
      </svg>`,
      tip: `<svg class="markdown-alert-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"/>
      </svg>`,
      important: `<svg class="markdown-alert-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
      </svg>`,
      warning: `<svg class="markdown-alert-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
      </svg>`,
      caution: `<svg class="markdown-alert-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/>
      </svg>`,
    };
    return icons[type] || icons.note;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Store for code block titles and languages (static storage during rendering)
   */
  private static codeBlockData = new Map<
    string,
    { title: string; language: string }
  >();

  /**
   * Renders markdown content with GitHub-style alerts and enhanced code blocks
   */
  async render(markdown: string): Promise<string> {
    if (!markdown?.trim()) {
      return "<em>No documentation.</em>";
    }

    // Clear previous data
    MarkdownRenderer.codeBlockData.clear();

    // Pre-process to handle code blocks with titles
    let processedMarkdown = markdown;

    // Only process complete code blocks with titles - let marked handle everything else normally
    processedMarkdown = processedMarkdown.replace(
      /```([a-zA-Z0-9_+-]+):([^`\n]+)\n([\s\S]*?)```/g,
      (match, language, title, code) => {
        const blockId = "cb_" + Math.random().toString(36).substr(2, 9);
        MarkdownRenderer.codeBlockData.set(blockId, {
          title: title.trim(),
          language: language,
        });
        // Return normal code block with special comment containing the block ID
        return `\`\`\`${language}\n<!-- BLOCK_ID:${blockId} -->\n${code}\n\`\`\``;
      }
    );

    // Pre-process alerts
    processedMarkdown = this.preprocessAlerts(processedMarkdown);

    try {
      const rendered = await Promise.resolve(marked(processedMarkdown));
      return typeof rendered === "string" ? rendered : "";
    } catch (error) {
      console.error("Markdown rendering error:", error);
      return `<div class="markdown-error">Error rendering markdown: ${error instanceof Error ? error.message : "Unknown error"}</div>`;
    }
  }

  /**
   * Pre-processes alerts (alerts are handled in the blockquote renderer)
   */
  private preprocessAlerts(markdown: string): string {
    // Currently no preprocessing needed for alerts
    // Alerts are handled directly in the blockquote renderer
    return markdown;
  }
}
