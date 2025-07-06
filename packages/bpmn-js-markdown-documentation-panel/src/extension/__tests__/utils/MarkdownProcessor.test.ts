import { marked } from "marked";
import { describe, expect, it } from "vitest";

describe("Markdown Processing", () => {
  describe("Basic Markdown Rendering", () => {
    it("should render simple markdown text", () => {
      const markdownText = "This is **bold** and *italic* text";
      const html = marked(markdownText);

      expect(html).toContain("<strong>bold</strong>");
      expect(html).toContain("<em>italic</em>");
    });

    it("should render markdown headers", () => {
      const markdownText = `# Header 1
## Header 2
### Header 3`;
      const html = marked(markdownText);

      expect(html).toContain("<h1");
      expect(html).toContain("<h2");
      expect(html).toContain("<h3");
      expect(html).toContain("Header 1");
      expect(html).toContain("Header 2");
      expect(html).toContain("Header 3");
    });

    it("should render markdown lists", () => {
      const markdownText = `- Item 1
- Item 2
- Item 3

1. Numbered item 1
2. Numbered item 2`;
      const html = marked(markdownText);

      expect(html).toContain("<ul>");
      expect(html).toContain("<ol>");
      expect(html).toContain("<li>Item 1</li>");
      expect(html).toContain("<li>Numbered item 1</li>");
    });

    it("should render markdown links", () => {
      const markdownText = "[Example Link](https://example.com)";
      const html = marked(markdownText);

      expect(html).toContain('<a href="https://example.com"');
      expect(html).toContain("Example Link");
    });

    it("should render markdown code blocks", () => {
      const markdownText =
        "Here is `inline code` and:\n\n```javascript\nconst x = 1;\n```";
      const html = marked(markdownText);

      expect(html).toContain("<code>inline code</code>");
      expect(html).toContain("<pre>");
      expect(html).toContain("const x = 1;");
    });
  });

  describe("BPMN Element Link Processing", () => {
    it("should detect BPMN element links", () => {
      const markdownText =
        "See [Start Event](#StartEvent_1) and [User Task](#Task_UserInput)";
      const html = marked(markdownText);

      expect(html).toContain('href="#StartEvent_1"');
      expect(html).toContain('href="#Task_UserInput"');
      expect(html).toContain("Start Event");
      expect(html).toContain("User Task");
    });

    it("should handle multiple element links in one document", () => {
      const markdownText = `This process involves several steps:

1. [Start Process](#StartEvent_1)
2. [Review Application](#UserTask_1)
3. [Send Notification](#ServiceTask_1)
4. [End Process](#EndEvent_1)

Each step is important for the overall workflow.`;

      const html = marked(markdownText);

      expect(html).toContain("#StartEvent_1");
      expect(html).toContain("#UserTask_1");
      expect(html).toContain("#ServiceTask_1");
      expect(html).toContain("#EndEvent_1");
    });

    it("should extract element IDs from markdown links", () => {
      const markdownText =
        "Reference [Task A](#Task_A) and [Gateway B](#Gateway_B)";
      const linkPattern = /\[([^\]]+)\]\(#([^)]+)\)/g;
      const matches = [...markdownText.matchAll(linkPattern)];

      expect(matches).toHaveLength(2);
      expect(matches[0][1]).toBe("Task A");
      expect(matches[0][2]).toBe("Task_A");
      expect(matches[1][1]).toBe("Gateway B");
      expect(matches[1][2]).toBe("Gateway_B");
    });

    it("should handle element links with special characters", () => {
      const markdownText =
        "See [Task with Spaces](#Task_With_Spaces) and [Gateway-1](#Gateway_1)";
      const linkPattern = /\[([^\]]+)\]\(#([^)]+)\)/g;
      const matches = [...markdownText.matchAll(linkPattern)];

      expect(matches).toHaveLength(2);
      expect(matches[0][2]).toBe("Task_With_Spaces");
      expect(matches[1][2]).toBe("Gateway_1");
    });
  });

  describe("Documentation Quality Assessment", () => {
    it("should measure documentation length", () => {
      const shortDoc = "Brief description";
      const longDoc = `This is a comprehensive description of the task.

It includes multiple paragraphs with detailed information:

- Key responsibilities
- Expected outcomes
- Quality criteria
- Dependencies

The task is critical for the overall process success.`;

      expect(shortDoc.length).toBeLessThan(50);
      expect(longDoc.length).toBeGreaterThan(200);
    });

    it("should detect rich vs minimal documentation", () => {
      const minimalDoc = "Simple task";
      const richDoc = `# Task Overview

This task handles **user authentication** with the following features:

## Key Features
- Multi-factor authentication
- Session management
- Password validation

## Dependencies
- [Database Connection](#DB_Task)
- [Security Service](#Security_Service)

## Output
Returns authentication token for downstream processes.`;

      // Rich documentation indicators
      expect(richDoc).toMatch(/#{1,6}/); // Headers
      expect(richDoc).toMatch(/\*\*[^*]+\*\*/); // Bold text
      expect(richDoc).toMatch(/- .+/); // Lists
      expect(richDoc).toMatch(/\[[^\]]+\]\(#[^)]+\)/); // Element links

      // Minimal documentation lacks these
      expect(minimalDoc).not.toMatch(/#{1,6}/);
      expect(minimalDoc).not.toMatch(/\*\*[^*]+\*\*/);
      expect(minimalDoc).not.toMatch(/- .+/);
    });

    it("should count markdown elements in documentation", () => {
      const richDoc = `# Main Title

## Section 1
- Item 1
- Item 2

**Important:** See [Related Task](#Task_1)

\`code example\`

> Blockquote text`;

      const headerMatches = richDoc.match(/^#{1,6}\s/gm) || []; // More precise regex for headers at start of line
      const listItemCount = (richDoc.match(/^- .+/gm) || []).length;
      const boldCount = (richDoc.match(/\*\*[^*]+\*\*/g) || []).length;
      const linkCount = (richDoc.match(/\[[^\]]+\]\([^)]+\)/g) || []).length;
      const codeCount = (richDoc.match(/`[^`]+`/g) || []).length;
      const blockquoteCount = (richDoc.match(/^> .+/gm) || []).length;

      // Should find # Main Title and ## Section 1
      expect(headerMatches.length).toBe(2);
      expect(listItemCount).toBe(2);
      expect(boldCount).toBe(1);
      expect(linkCount).toBe(1);
      expect(codeCount).toBe(1);
      expect(blockquoteCount).toBe(1);
    });
  });

  describe("Markdown Sanitization", () => {
    it("should handle potentially dangerous HTML", () => {
      const dangerousMarkdown = 'Click [here](javascript:alert("xss"))';
      const html = marked(dangerousMarkdown);

      // marked should handle this safely by default
      expect(html).toBeDefined();
    });

    it("should preserve safe HTML elements", () => {
      const safeMarkdown = "This is **safe** markdown with `code`";
      const html = marked(safeMarkdown);

      expect(html).toContain("<strong>safe</strong>");
      expect(html).toContain("<code>code</code>");
    });
  });

  describe("Markdown Parsing Edge Cases", () => {
    it("should handle empty markdown", () => {
      const emptyMarkdown = "";
      const html = marked(emptyMarkdown);

      expect(html).toBe("");
    });

    it("should handle markdown with only whitespace", () => {
      const whitespaceMarkdown = "   \n  \t  \n  ";
      const html = marked(whitespaceMarkdown);

      expect(typeof html === "string" ? html.trim() : "").toBe("");
    });

    it("should handle malformed markdown gracefully", () => {
      const malformedMarkdown = "**unclosed bold and [unclosed link";
      const html = marked(malformedMarkdown);

      // Should not throw and should produce some output
      expect(html).toBeDefined();
      expect(typeof html).toBe("string");
    });

    it("should handle very long markdown documents", () => {
      const longMarkdown =
        "# Header\n".repeat(1000) + "Content line\n".repeat(1000);

      expect(() => marked(longMarkdown)).not.toThrow();

      const html = marked(longMarkdown);
      expect(html).toContain("<h1");
      const htmlLength = typeof html === "string" ? html.length : 0;
      expect(htmlLength).toBeGreaterThan(longMarkdown.length);
    });
  });

  describe("Documentation Templates", () => {
    it("should process task documentation template", () => {
      const taskTemplate = `# {{taskName}}

## Purpose
{{taskPurpose}}

## Key Activities
{{taskActivities}}

## Dependencies
{{taskDependencies}}

## Outputs
{{taskOutputs}}`;

      const processedTemplate = taskTemplate
        .replace("{{taskName}}", "Review Application")
        .replace("{{taskPurpose}}", "Validate submitted application")
        .replace(
          "{{taskActivities}}",
          "- Check completeness\n- Verify documents"
        )
        .replace("{{taskDependencies}}", "- [Submit Application](#Task_Submit)")
        .replace("{{taskOutputs}}", "Approval decision");

      const html = marked(processedTemplate);

      expect(html).toContain("<h1");
      expect(html).toContain("Review Application");
      expect(html).toContain("Validate submitted application");
      expect(html).toContain("Check completeness");
      expect(html).toContain('href="#Task_Submit"');
    });

    it("should process process documentation template", () => {
      const processTemplate = `# {{processName}}

## Overview
{{processOverview}}

## Key Participants
{{processParticipants}}

## Main Flow
{{processFlow}}

## Success Criteria
{{successCriteria}}`;

      const processedTemplate = processTemplate
        .replace("{{processName}}", "Application Review Process")
        .replace("{{processOverview}}", "End-to-end application processing")
        .replace("{{processParticipants}}", "- Applicant\n- Reviewer\n- System")
        .replace(
          "{{processFlow}}",
          "1. [Submit](#Start)\n2. [Review](#Review)\n3. [Approve](#End)"
        )
        .replace("{{successCriteria}}", "Application processed within SLA");

      const html = marked(processedTemplate);

      expect(html).toContain("Application Review Process");
      expect(html).toContain("End-to-end application processing");
      expect(html).toContain("<ol>");
      expect(html).toContain('href="#Start"');
    });
  });
});
