import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  Prism as SyntaxHighlighter
} from "react-syntax-highlighter";

import {
  vscDarkPlus
} from "react-syntax-highlighter/dist/esm/styles/prism";

export default function MessageContent({
  content,
  role
}) {
  if (role === "user") {
    return (
      <div className="plain-message">
        {content}
      </div>
    );
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(
        code
      );
    } catch (error) {
      console.error(
        "Unable to copy code:",
        error
      );
    }
  }

  return (
    <div className="markdown-message">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ children, href }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },

          h1({ children }) {
            return <h1>{children}</h1>;
          },

          h2({ children }) {
            return <h2>{children}</h2>;
          },

          h3({ children }) {
            return <h3>{children}</h3>;
          },

          ul({ children }) {
            return <ul>{children}</ul>;
          },

          ol({ children }) {
            return <ol>{children}</ol>;
          },

          blockquote({ children }) {
            return (
              <blockquote>
                {children}
              </blockquote>
            );
          },

          table({ children }) {
            return (
              <div className="table-wrapper">
                <table>
                  {children}
                </table>
              </div>
            );
          },

          code({
            inline,
            className,
            children
          }) {
            const language =
              className
                ?.replace(
                  "language-",
                  ""
                )
                .toLowerCase() || "";

            const codeText =
              String(children).replace(
                /\n$/,
                ""
              );

            if (inline) {
              return (
                <code className="inline-code">
                  {children}
                </code>
              );
            }

            return (
              <div className="code-block">
                <div className="code-header">
                  <span>
                    {language ||
                      "code"}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      copyCode(
                        codeText
                      )
                    }
                  >
                    Copy
                  </button>
                </div>

                <SyntaxHighlighter
                  language={
                    language ||
                    "text"
                  }
                  style={
                    vscDarkPlus
                  }
                  PreTag="pre"
                  customStyle={{
                    margin: 0,
                    padding:
                      "14px",
                    background:
                      "transparent",
                    fontSize:
                      "12px",
                    lineHeight:
                      "1.55",
                    overflowX:
                      "auto"
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily:
                        '"SFMono-Regular", Consolas, "Liberation Mono", monospace'
                    }
                  }}
                >
                  {codeText}
                </SyntaxHighlighter>
              </div>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
