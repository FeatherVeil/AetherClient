import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
                rel="noreferrer"
              >
                {children}
              </a>
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
                ) || "";

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

            async function copyCode() {
              try {
                await navigator.clipboard.writeText(
                  codeText
                );
              } catch (error) {
                console.error(
                  "Could not copy code:",
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
                    onClick={
                      copyCode
                    }
                  >
                    Copy
                  </button>
                </div>

                <pre>
                  <code
                    className={
                      className || ""
                    }
                  >
                    {children}
                  </code>
                </pre>
              </div>
            );
          },

          h1({ children }) {
            return (
              <h1>{children}</h1>
            );
          },

          h2({ children }) {
            return (
              <h2>{children}</h2>
            );
          },

          h3({ children }) {
            return (
              <h3>{children}</h3>
            );
          },

          ul({ children }) {
            return (
              <ul>{children}</ul>
            );
          },

          ol({ children }) {
            return (
              <ol>{children}</ol>
            );
          },

          blockquote({
            children
          }) {
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
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
          }
