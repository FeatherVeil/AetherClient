import { useEffect, useMemo, useState } from "react";
import MessageContent from "./components/MessageContent";
import { sendToAI } from "./services/ai";
import {
  analyzeProjectMessage
} from "./services/project";
import {
  loadChats,
  saveChats
} from "./services/chatStorage";
import "./styles.css";

const MODELS = [
  {
    id: "auto",
    name: "Aether Auto"
  },
  {
    id: "groq",
    name: "AetherBot"
  },
  {
    id: "gemini",
    name: "AetherBotPro"
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
    projectSetbacks: 0,
    manuallyMarkedProject: false,
    manuallyMarkedDone: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function generateTitle(text) {
  const cleaned = text
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "New chat";
  }

  if (cleaned.length <= 45) {
    return cleaned;
  }

  return `${cleaned.slice(0, 45).trim()}...`;
}

function calculateProjectProgress(
  currentProgress,
  analysis,
  previousSetbacks
) {
  if (analysis.completed) {
    return 100;
  }

  if (!analysis.isProjectSignal) {
    return currentProgress;
  }

  let speed = 4;

  const setbackCount =
    previousSetbacks +
    (analysis.setback ? 1 : 0);

  if (setbackCount === 1) {
    speed = 3;
  } else if (setbackCount === 2) {
    speed = 2;
  } else if (setbackCount >= 3) {
    speed = 1;
  }

  return Math.min(
    99,
    currentProgress + speed
  );
}

function sortChats(chats) {
  return [...chats].sort(
    (a, b) =>
      (b.updatedAt || 0) -
      (a.updatedAt || 0)
  );
}

export default function App() {
  const [chats, setChats] = useState(
    () => sortChats(loadChats())
  );

  const [activeChatId, setActiveChatId] =
    useState(null);

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [input, setInput] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
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
    saveChats(chats);
  }, [chats]);

  function createNewChat() {
    if (isLoading) {
      return;
    }

    const chat = createChat();

    setChats((current) =>
      sortChats([
        chat,
        ...current
      ])
    );

    setActiveChatId(chat.id);
    setInput("");
    setError("");
    setProjectMenuOpen(false);
  }

  function selectChat(id) {
    if (isLoading) {
      return;
    }

    setActiveChatId(id);
    setInput("");
    setError("");
    setProjectMenuOpen(false);
  }

  function deleteChat(id) {
    if (isLoading) {
      return;
    }

    setChats((current) =>
      current.filter(
        (chat) =>
          chat.id !== id
      )
    );

    if (activeChatId === id) {
      setActiveChatId(null);
    }
  }

  function startRename(chat) {
    if (isLoading) {
      return;
    }

    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  }

  function saveRename(id) {
    const title =
      editingTitle.trim() ||
      "New chat";

    setChats((current) =>
      sortChats(
        current.map((chat) =>
          chat.id === id
            ? {
                ...chat,
                title,
                updatedAt:
                  Date.now()
              }
            : chat
        )
      )
    );

    setEditingChatId(null);
    setEditingTitle("");
  }

  function updateChat(
    chatId,
    changes
  ) {
    setChats((current) =>
      sortChats(
        current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                ...changes,
                updatedAt:
                  Date.now()
              }
            : chat
        )
      )
    );
  }

  function updateActiveChat(
    changes
  ) {
    if (!activeChatId) {
      return;
    }

    updateChat(
      activeChatId,
      changes
    );
  }

  function toggleProject() {
    if (!activeChat || isLoading) {
      return;
    }

    const nextValue =
      !activeChat.isProject;

    updateActiveChat({
      isProject: nextValue,
      manuallyMarkedProject:
        nextValue
    });

    setProjectMenuOpen(false);
  }

  function markProjectDone() {
    if (!activeChat || isLoading) {
      return;
    }

    updateActiveChat({
      isProject: true,
      projectProgress: 100,
      manuallyMarkedProject: true,
      manuallyMarkedDone: true
    });

    setProjectMenuOpen(false);
  }

  function changeModel(event) {
    if (isLoading) {
      return;
    }

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

  async function sendMessage() {
    const text = input.trim();

    if (!text || isLoading) {
      return;
    }

    setError("");

    let chatId = activeChatId;

    let chatForRequest =
      activeChat;

    if (!chatId) {
      const newChat =
        createChat();

      chatId = newChat.id;
      chatForRequest =
        newChat;

      setChats((current) =>
        sortChats([
          newChat,
          ...current
        ])
      );

      setActiveChatId(chatId);
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now()
    };

    const existingMessages =
      chatForRequest?.messages ||
      [];

    const requestMessages = [
      ...existingMessages,
      userMessage
    ];

    const selectedModel =
      chatForRequest?.model ||
      "auto";

    const projectAnalysis =
      analyzeProjectMessage(
        text
      );

    const previousProgress =
      chatForRequest?.projectProgress ||
      0;

    const previousSetbacks =
      chatForRequest?.projectSetbacks ||
      0;

    const automaticallyDetectedProject =
      projectAnalysis.isProjectSignal;

    const shouldBecomeProject =
      chatForRequest?.manuallyMarkedProject ||
      automaticallyDetectedProject ||
      chatForRequest?.isProject;

    const newSetbackCount =
      projectAnalysis.setback
        ? previousSetbacks + 1
        : previousSetbacks;

    const newProgress =
      chatForRequest?.manuallyMarkedDone
        ? 100
        : calculateProjectProgress(
            previousProgress,
            projectAnalysis,
            previousSetbacks
          );

    const updatedChat = {
      ...chatForRequest,

      title:
        chatForRequest.messages
          .length === 0
          ? generateTitle(text)
          : chatForRequest.title,

      messages: [
        ...chatForRequest.messages,
        userMessage
      ],

      isProject:
        shouldBecomeProject,

      projectProgress:
        projectAnalysis.completed
          ? 100
          : newProgress,

      projectSetbacks:
        newSetbackCount,

      updatedAt: Date.now()
    };

    setChats((current) =>
      sortChats(
        current.map((chat) =>
          chat.id === chatId
            ? updatedChat
            : chat
        )
      )
    );

    setInput("");
    setIsLoading(true);

    try {
      const aiResponse =
        await sendToAI(
          selectedModel,
          requestMessages
        );

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: aiResponse,
        createdAt: Date.now()
      };

      setChats((current) =>
        sortChats(
          current.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    assistantMessage
                  ],
                  updatedAt:
                    Date.now()
                }
              : chat
          )
        )
      );
    } catch (requestError) {
      console.error(
        "AI request failed:",
        requestError
      );

      setError(
        requestError?.message ||
          "Something went wrong while contacting the AI."
      );
    } finally {
      setIsLoading(false);
    }
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
            onClick={createNewChat}
          >
            <span>＋</span>
            <span>New chat</span>
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
              {chats.map(
                (chat) => (
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
                        onChange={(
                          event
                        ) =>
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
                )
              )}
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
                        {
                          activeChat.projectProgress
                        }
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
                      {activeChat.projectSetbacks >
                      0
                        ? "Progress continues at a reduced rate after setbacks."
                        : "AetherBot is tracking this project."}
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
                {activeChat.messages.length ===
                0 ? (
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
                      (
                        message
                      ) => (
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

                    {isLoading && (
                      <div className="message-row assistant">
                        <div className="message-bubble">
                          <div className="typing">
                            AetherBot is thinking...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div
                  style={{
                    position:
                      "absolute",
                    bottom:
                      "112px",
                    width:
                      "min(760px, calc(100% - 40px))",
                    left: "50%",
                    transform:
                      "translateX(-50%)",
                    padding:
                      "9px 12px",
                    border:
                      "1px solid #49353a",
                    borderRadius:
                      "9px",
                    background:
                      "#201619",
                    color:
                      "#e3aeb5",
                    fontSize:
                      "12px"
                  }}
                >
                  {error}
                </div>
              )}

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
                  disabled={isLoading}
                />

                <div className="composer-bottom">
                  <div className="composer-tools">
                    <button
                      title="Attach"
                      disabled={
                        isLoading
                      }
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
                      disabled={
                        isLoading
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
                      !input.trim() ||
                      isLoading
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
