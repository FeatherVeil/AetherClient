import { useEffect, useState } from "react";

import {
  loadChats,
  saveChats,
  createChat,
  updateChat,
  deleteChat
} from "./storage/chats.js";

export default function App() {
  const [chats, setChats] = useState(
    () => loadChats()
  );

  const [activeChatId, setActiveChatId] =
    useState(null);

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  function handleNewChat() {
    const newChat = createChat();

    setChats((currentChats) => [
      newChat,
      ...currentChats
    ]);

    setActiveChatId(newChat.id);
  }

  function handleDeleteChat(chatId) {
    setChats((currentChats) =>
      deleteChat(currentChats, chatId)
    );

    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  }

  function handleRenameChat(
    chatId,
    title
  ) {
    const trimmedTitle =
      title.trim();

    if (!trimmedTitle) return;

    setChats((currentChats) =>
      updateChat(
        currentChats,
        chatId,
        {
          title: trimmedTitle
        }
      )
    );
  }

  const activeChat =
    chats.find(
      (chat) =>
        chat.id === activeChatId
    ) || null;

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

        <button
          className="new-chat-button"
          onClick={handleNewChat}
        >
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

            {chats.length === 0 ? (
              <div className="empty-chat-list">
                No conversations yet
              </div>
            ) : (
              <div className="chat-list">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`chat-list-item ${
                      activeChatId === chat.id
                        ? "active"
                        : ""
                    }`}
                  >
                    <button
                      className="chat-select"
                      onClick={() =>
                        setActiveChatId(
                          chat.id
                        )
                      }
                    >
                      {chat.title}
                    </button>

                    <button
                      className="chat-delete"
                      onClick={() =>
                        handleDeleteChat(
                          chat.id
                        )
                      }
                      title="Delete chat"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            <span>
              {activeChat
                ? activeChat.title
                : "AetherClient"}
            </span>
          </div>

          <div className="header-actions">
            <button title="Search">
              ⌕
            </button>

            <button
              title="New chat"
              onClick={handleNewChat}
            >
              ＋
            </button>
          </div>
        </header>

        <section className="chat-workspace">
          {!activeChat ? (
            <div className="welcome-screen">
              <div className="welcome-logo">
                A
              </div>

              <h2>
                What can I help you with?
              </h2>

              <p>
                Start a conversation or create
                a project.
              </p>

              <button
                className="welcome-new-chat"
                onClick={handleNewChat}
              >
                ＋ Start a new chat
              </button>
            </div>
          ) : (
            <div className="chat-placeholder">
              <h2>
                {activeChat.title}
              </h2>

              <p>
                Your conversation will appear
                here.
              </p>
            </div>
          )}

          <div className="message-composer">
            <textarea
              placeholder={
                activeChat
                  ? "Message AetherBot..."
                  : "Start a new chat..."
              }
              rows="1"
              disabled={!activeChat}
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
                disabled={!activeChat}
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
