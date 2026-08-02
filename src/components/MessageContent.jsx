import { useState } from "react";

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightCode(code, language) {
  let highlighted = escapeHtml(code);

  const keywords = {
    javascript:
      /\b(const|let|var|function|return|if|else|for|while|import|from|export|async|await|new|class|extends|try|catch|throw)\b/g,
    js:
      /\b(const|let|var|function|return|if|else|for|while|import|from|export|async|await|new|class|extends|try|catch|throw)\b/g,
    typescript:
      /\b(const|let|var|function|return|if|else|for|while|import|from|export|async|await|new|class|extends|interface|type|public|private)\b/g,
    ts:
      /\b(const|let|var|function|return|if|else|for|while|import|from|export|async|await|new|class|extends|interface|type|public|private)\b/g,
    python:
      /\b(def|return|if|elif|else|for|while|in|import|from|as|class|try|except|with|lambda|True|False|None)\b/g,
    css:
      /\b(display|position|relative|absolute|flex|grid|color|background|margin|padding|width|height|font-size)\b/g,
    html:
      /(&lt;\/?[a-zA-Z0-9]+|&gt;)/g
  };

  const pattern =
    keywords[language?.toLowerCase()];

  if (pattern) {
    highlighted = highlighted.replace(
      pattern,
      '<span class="code-keyword">$1</span>'
    );
  }

  highlighted = highlighted.replace(
    /(["'`])(?:(?!\1).)*\1/g,
    '<span class="code-string">$&</span>'
  );

  highlighted = highlighted.replace(
    /\b(\d+(?:\.\d+)?)\b/g,
    '<span class="code-number">$1</span>'
  );

  return highlighted;
}

function CodeBlock({
  language,
  code
}) {
  const [copied, setCopied] =
    useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(
        code
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Unable to copy code:",
        error
      );
    }
  }

  return (
    <div className="code-block">
      <div className="code-header">
        <span>
          {language || "code"}
        </span>

        <button
          onClick={copyCode}
          className="copy-code-button"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <pre>
        <code
          dangerouslySetInnerHTML={{
            __html: highlightCode(
              code,
              language
            )
          }}
        />
      </pre>
    </div>
  );
}

function renderInline(text) {
  let result = escapeHtml(text);

  result = result.replace(
    /`([^`]+)`/g,
    '<code class="inline-code">$1</code>'
  );

  result = result.replace(
    /\*\*([^*]+)\*\*/g,
    "<strong>$1</strong>"
  );

  result = result.replace(
    /\*([^*]+)\*/g,
    "<em>$1</em>"
  );

  result = result.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return result;
}

function MarkdownContent({
  content
}) {
  const lines = content.split("\n");

  const elements = [];
  let codeLines = [];
  let codeLanguage = "";
  let insideCode = false;

  function flushCode() {
    if (!insideCode) {
      return;
    }

    elements.push(
      <CodeBlock
        key={`code-${elements.length}`}
        language={codeLanguage}
        code={codeLines.join("\n")}
      />
    );

    codeLines = [];
    codeLanguage = "";
    insideCode = false;
  }

  lines.forEach((line, index) => {
    const fenceMatch =
      line.match(/^```(\w*)\s*$/);

    if (fenceMatch) {
      if (insideCode) {
        flushCode();
      } else {
        insideCode = true;
        codeLanguage =
          fenceMatch[1] || "";
      }

      return;
    }

    if (insideCode) {
      codeLines.push(line);
      return;
    }

    if (/^###\s+/.test(line)) {
      elements.push(
        <h3 key={index}>
          <span
            dangerouslySetInnerHTML={{
              __html: renderInline(
                line.replace(
                  /^###\s+/,
                  ""
                )
              )
            }}
          />
        </h3>
      );

      return;
    }

    if (/^##\s+/.test(line)) {
      elements.push(
        <h2 key={index}>
          <span
            dangerouslySetInnerHTML={{
              __html: renderInline(
                line.replace(
                  /^##\s+/,
                  ""
                )
              )
            }}
          />
        </h2>
      );

      return;
    }

    if (/^#\s+/.test(line)) {
      elements.push(
        <h1 key={index}>
          <span
            dangerouslySetInnerHTML={{
              __html: renderInline(
                line.replace(
                  /^#\s+/,
                  ""
                )
              )
            }}
          />
        </h1>
      );

      return;
    }

    if (/^[-*]\s+/.test(line)) {
      elements.push(
        <div
          className="markdown-list-item"
          key={index}
        >
          <span className="list-bullet">
            •
          </span>

          <span
            dangerouslySetInnerHTML={{
              __html: renderInline(
                line.replace(
                  /^[-*]\s+/,
                  ""
                )
              )
            }}
          />
        </div>
      );

      return;
    }

    if (/^\d+\.\s+/.test(line)) {
      const number =
        line.match(
          /^(\d+)\.\s+/
        )?.[1];

      elements.push(
        <div
          className="markdown-list-item"
          key={index}
        >
          <span className="list-number">
            {number}.
          </span>

          <span
            dangerouslySetInnerHTML={{
              __html: renderInline(
                line.replace(
                  /^\d+\.\s+/,
                  ""
                )
              )
            }}
          />
        </div>
      );

      return;
    }

    if (!line.trim()) {
      elements.push(
        <div
          className="markdown-spacer"
          key={index}
        />
      );

      return;
    }

    elements.push(
      <p key={index}>
        <span
          dangerouslySetInnerHTML={{
            __html: renderInline(
              line
            )
          }}
        />
      </p>
    );
  });

  if (insideCode) {
    flushCode();
  }

  return (
    <div className="markdown-content">
      {elements}
    </div>
  );
}

export default function MessageContent({
  content
}) {
  return (
    <MarkdownContent
      content={content || ""}
    />
  );
}
