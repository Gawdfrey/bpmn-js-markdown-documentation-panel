import { describe, expect, it } from "vitest";
import { MarkdownRenderer } from "../../utils/MarkdownRenderer";

describe("Incomplete Code Block Handling", () => {
  it("should handle unclosed code block gracefully", async () => {
    const renderer = new MarkdownRenderer();
    
    const markdownWithUnclosedCodeBlock = `
# Title

Some text before code block

\`\`\`javascript
function test() {
  console.log("hello");

This text should not be treated as part of the code block
    `.trim();

    const result = await renderer.render(markdownWithUnclosedCodeBlock);
    
    expect(result).toContain("<h1>Title</h1>");
    expect(result).toContain("<p>Some text before code block</p>");
    expect(result).toContain("function test()");
    expect(result).toContain('This text should not be treated as part of the code block');
    // When code block is not properly closed, it gets treated as regular paragraphs
    expect(result).toContain("<p>function test()");
  });

  it("should not affect properly closed code blocks", async () => {
    const renderer = new MarkdownRenderer();
    
    const markdownWithClosedCodeBlock = `
# Title

\`\`\`javascript
function test() {
  console.log("hello");
}
\`\`\`

This text is after the code block
    `.trim();

    const result = await renderer.render(markdownWithClosedCodeBlock);
    
    expect(result).toContain("<h1>Title</h1>");
    expect(result).toContain('<span class="markdown-code-language">text</span>');
    expect(result).toContain("function test()");
    expect(result).toContain('<p>This text is after the code block</p>');
  });

  it("should handle multiple unclosed code blocks", async () => {
    const renderer = new MarkdownRenderer();
    
    const markdownWithMultipleUnclosed = `
First code block:
\`\`\`javascript
console.log("first");

Second code block:
\`\`\`python
print("second")

Regular text at the end
    `.trim();

    const result = await renderer.render(markdownWithMultipleUnclosed);
    
    expect(result).toContain('<span class="markdown-code-language">text</span>');
    expect(result).toContain('console.log("first");');
    // Multiple unclosed blocks get merged into one, so we expect all content in a single code block
    expect(result).toContain('Second code block:');
    expect(result).toContain('print("second")');
    expect(result).toContain('Regular text at the end');
  });

  it("should handle just ``` without content", async () => {
    const renderer = new MarkdownRenderer();
    
    const markdownWithJustTicks = `
Some text

\`\`\`

More text after
    `.trim();

    const result = await renderer.render(markdownWithJustTicks);
    
    expect(result).toContain('<p>Some text</p>');
    expect(result).toContain('<p>More text after</p>');
    // Should not create a code block for empty content
  });
});