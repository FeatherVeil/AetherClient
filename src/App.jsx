import { useEffect, useMemo, useState } from "react";
import MessageContent from "./components/MessageContent";
import "./styles.css";

const STORAGE_KEY = "aetherbot_chats";

const MODELS = [
  {
    id: "groq",
    name: "AetherBot",
    provider: "Groq"
  },
  {
    id: "gemini",
    name: "AetherBotPro",
    provider: "Gemini"
  },
  {
    id: "auto",
    name: "Aether Auto",
    provider: "Auto"
  }
];

function createChat() {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    model: "auto",
    isProject: false,
    projectProgress: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function loadChats() {
  try {
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error(
      "Unable to load chats:",
      error
    );

    return [];
  }
}

export default function App() {
  const [chats, setChats] =
    useState(loadChats);

  const [activeChatId, setActiveChatId] =
    useState(null);

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [input, setInput] =
    useState("");

  const [projectMenuOpen, setProjectMenuOpen] =
    useState(false);

  const [editingChatId, setEditingChatId] =
    useState(null);

  const [editingTitle, setEditingTitle] =
    useState("");

  const activeChat = useMemo(
    () =>
      chats.find(
        (chat) =>
          chat.id === activeChatId
      ) || null,
    [chats, activeChatId]
  );

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chats)
    );
  }, [chats]);

  function createNewChat() {
    const chat = createChat();

    setChats((current) => [
      chat,
      ...current
    ]);

    setActiveChatId(chat.id);
    setInput("");
    setProjectMenuOpen(false);
  }

  function selectChat(id) {
    setActiveChatId(id);
    setInput("");
    setProjectMenuOpen(false);
  }

  function deleteChat(id) {
    setChats((current) =>
      current.filter(
        (chat) => chat.id !== id
      )
    );

    if (activeChatId === id) {
      setActiveChatId(null);
    }
  }

  function startRename(chat) {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  }

  function saveRename(id) {
    const title =
      editingTitle.trim() ||
      "New chat";

    setChats((current) =>
      current.map((chat) =>
        chat.id === id
          ? {
              ...chat,
              title,
              updatedAt: Date.now()
            }
          : chat
      )
    );

    setEditingChatId(null);
    setEditingTitle("");
  }

  function updateActiveChat(changes) {
    if (!activeChatId) {
      return;
    }

    setChats((current) =>
      current.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              ...changes,
              updatedAt: Date.now()
            }
          : chat
      )
    );
  }

  function toggleProject() {
    if (!activeChat) {
      return;
    }

    updateActiveChat({
      isProject: !activeChat.isProject
    });

    setProjectMenuOpen(false);
  }

  function markProjectDone() {
    if (!activeChat) {
      return;
    }

    updateActiveChat({
      isProject: true,
      projectProgress: 100
    });

    setProjectMenuOpen(false);
  }

  function changeModel(event) {
    updateActiveChat({
      model: event.target.value
    });
  }

  function handleComposerKeyDown(
    event
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  }

  function sendMessage() {
    const text = input.trim();

    if (!text) {
      return;
    }

    let chatId = activeChatId;

    if (!chatId) {
      const newChat = createChat();

      chatId = newChat.id;

      setChats((current) => [
        newChat,
        ...current
      ]);

      setActiveChatId(chatId);
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now()
    };

    setChats((current) =>
      current.map((chat) => {
        if (chat.id !== chatId) {
          return chat;
        }

        const messages = [
          ...chat.messages,
          userMessage
        ];

        const title =
          chat.messages.length === 0
            ? generateTitle(text)
            : chat.title;

        return {
          ...chat,
          title,
          messages,
          updatedAt: Date.now()
        };
      })
    );

    setInput("");
  }

  function generateTitle(text) {
    const cleaned = text
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) {
      return "New chat";
    }

    if (cleaned.length <= 40) {
      return cleaned;
    }

    return (
      cleaned.slice(0, 40).trim() +
      "..."
    );
  }

  return (
    <div className="aether-app">
      <aside
        className={`aether-sidebar ${
          sidebarOpen
            ? "open"
            : "closed"
        }`}
      >
        <div className="sidebar-header">
          <div className="aether-logo">
            A
          </div>

          {sidebarOpen && (
            <div>
              <h1>AetherBot</h1>
              <span>
                AI workspace
              </span>
            </div>
          )}
        </div>

        {sidebarOpen && (
          <button
            className="new-chat-button"
            onClick={
              createNewChat
            }
          >
            <span>＋</span>
            <span>
              New chat
            </span>
          </button>
        )}

        <div className="sidebar-section">
          {sidebarOpen && (
            <div className="sidebar-label">
              Chats
            </div>
          )}

          {chats.length === 0 ? (
            sidebarOpen && (
              <div className="empty-chat-list">
                Your chats will appear here.
              </div>
            )
          ) : (
            <div className="chat-list">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-list-item ${
                    chat.id ===
                    activeChatId
                      ? "active"
                      : ""
                  }`}
                >
                  {editingChatId ===
                  chat.id ? (
                    <input
                      autoFocus
                      className="chat-title-input"
                      value={
                        editingTitle
                      }
                      onChange={(event) =>
                        setEditingTitle(
                          event.target
                            .value
                        )
                      }
                      onBlur={() =>
                        saveRename(
                          chat.id
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          saveRename(
                            chat.id
                          );
                        }

                        if (
                          event.key ===
                          "Escape"
                        ) {
                          setEditingChatId(
                            null
                          );
                        }
                      }}
                    />
                  ) : (
                    <>
                      <button
                        className="chat-select"
                        onClick={() =>
                          selectChat(
                            chat.id
                          )
                        }
                        onDoubleClick={() =>
                          startRename(
                            chat
                          )
                        }
                        title="Double-click to rename"
                      >
                        {sidebarOpen
                          ? chat.title
                          : "•"}
                      </button>

                      {sidebarOpen && (
                        <button
                          className="chat-delete"
                          onClick={() =>
                            deleteChat(
                              chat.id
                            )
                          }
                          title="Delete chat"
                        >
                          ×
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div className="sidebar-bottom">
            <button>
              ⚙
              <span>
                Settings
              </span>
            </button>

            <button>
              ◇
              <span>
                AetherCode
              </span>
            </button>
          </div>
        )}
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
            {activeChat
              ? activeChat.title
              : "AetherBot"}
          </div>

          <div className="header-actions">
            {activeChat && (
              <div className="project-menu-wrapper">
                <button
                  onClick={() =>
                    setProjectMenuOpen(
                      (open) =>
                        !open
                    )
                  }
                  title="Project options"
                >
                  ◇
                </button>

                {projectMenuOpen && (
                  <div className="project-menu">
                    <div className="project-menu-status">
                      <span>
                        Project
                      </span>

                      <span>
                        {activeChat
                          .projectProgress}
                        %
                      </span>
                    </div>

                    <button
                      onClick={
                        toggleProject
                      }
                    >
                      {activeChat.isProject
                        ? "Remove project mode"
                        : "Mark as project"}
                    </button>

                    <button
                      onClick={
                        markProjectDone
                      }
                    >
                      Mark project as done
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <section className="chat-workspace">
          {!activeChat ? (
            <div className="welcome-screen">
              <div className="welcome-logo">
                A
              </div>

              <h2>
                How can AetherBot help?
              </h2>

              <p>
                Start a conversation and
                your chats will be saved
                automatically.
              </p>

              <button
                className="welcome-new-chat"
                onClick={
                  createNewChat
                }
              >
                Start a new chat
              </button>
            </div>
          ) : (
            <>
              {activeChat.isProject && (
                <div className="project-progress">
                  <div className="project-progress-header">
                    <div>
                      <span className="project-icon">
                        ◇
                      </span>

                      <span className="project-label">
                        Project
                      </span>
                    </div>

                    <span className="project-percent">
                      {
                        activeChat.projectProgress
                      }
                      %
                    </span>
                  </div>

                  <div className="project-progress-track">
                    <div
                      className="project-progress-fill"
                      style={{
                        width: `${activeChat.projectProgress}%`
                      }}
                    />
                  </div>

                  <div className="project-progress-footer">
                    <span>
                      Progress is tracked
                      separately from chat
                    </span>

                    {activeChat.projectProgress <
                      100 && (
                      <button
                        onClick={
                          markProjectDone
                        }
                      >
                        Mark done
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="conversation">
                {activeChat.messages
                  .length === 0 ? (
                  <div className="conversation-empty">
                    <h2>
                      {activeChat.title}
                    </h2>

                    <p>
                      Send a message to
                      begin.
                    </p>
                  </div>
                ) : (
                  <div className="message-list">
                    {activeChat.messages.map(
                      (message) => (
                        <div
                          key={
                            message.id
                          }
                          className={`message-row ${message.role}`}
                        >
                          <div className="message-bubble">
                            <MessageContent
                              content={
                                message.content
                              }
                              role={
                                message.role
                              }
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="message-composer">
                <textarea
                  value={input}
                  onChange={(event) =>
                    setInput(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleComposerKeyDown
                  }
                  placeholder="Message AetherBot..."
                  rows={1}
                />

                <div className="composer-bottom">
                  <div className="composer-tools">
                    <button
                      title="Attach"
                    >
                      ＋
                    </button>

                    <select
                      className="model-selector"
                      value={
                        activeChat.model
                      }
                      onChange={
                        changeModel
                      }
                    >
                      {MODELS.map(
                        (model) => (
                          <option
                            key={
                              model.id
                            }
                            value={
                              model.id
                            }
                          >
                            {
                              model.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <button
                    className="send-button"
                    onClick={
                      sendMessage
                    }
                    disabled={
                      !input.trim()
                    }
                    title="Send"
                  >
                    ↑
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
