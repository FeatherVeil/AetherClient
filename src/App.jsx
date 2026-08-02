import { useState } from "react";

export default function App() {
  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  return (
    <div className="aether-app">
      <aside
        className={`aether-sidebar ${
          sidebarOpen ? "open" : "closed"
        }`}
      >
        <div className="sidebar-header">
          <div className="aether-logo">
            A
          </div>

          {sidebarOpen && (
            <div>
              <h1>AetherClient</h1>
              <span>AI workspace</span>
            </div>
          )}
        </div>

        <button className="new-chat-button">
          <span>＋</span>

          {sidebarOpen && (
            <span>New chat</span>
          )}
        </button>

        {sidebarOpen && (
          <div className="sidebar-section">
            <div className="sidebar-label">
              Chats
            </div>

            <div className="empty-chat-list">
              No conversations yet
            </div>
          </div>
        )}

        <div className="sidebar-bottom">
          <button>
            ⚙
            {sidebarOpen && (
              <span>Settings</span>
            )}
          </button>

          <button>
            💻
            {sidebarOpen && (
              <span>AetherCode</span>
            )}
          </button>
        </div>
      </aside>

      <main className="aether-main">
        <header className="aether-header">
          <button
            className="menu-button"
            onClick={() =>
              setSidebarOpen(
                (open) => !open
              )
            }
            title="Toggle sidebar"
          >
            ☰
          </button>

          <div className="header-title">
            <span>AetherClient</span>
          </div>

          <div className="header-actions">
            <button title="Search">
              ⌕
            </button>

            <button title="New chat">
              ＋
            </button>
          </div>
        </header>

        <section className="chat-workspace">
          <div className="welcome-screen">
            <div className="welcome-logo">
              A
            </div>

            <h2>
              What can I help you with?
            </h2>

            <p>
              Ask a question, start a project,
              or open AetherCode.
            </p>
          </div>

          <div className="message-composer">
            <textarea
              placeholder="Message AetherBot..."
              rows="1"
            />

            <div className="composer-bottom">
              <div className="composer-tools">
                <button title="Attach">
                  ＋
                </button>

                <button title="AI model">
                  AetherBot ▾
                </button>
              </div>

              <button
                className="send-button"
                title="Send"
              >
                ↑
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
