import { useEffect, useMemo, useState } from "react";
import MessageContent from "./components/MessageContent";
import Settings from "./components/Settings";
import { sendToAI } from "./services/ai";
import { analyzeProjectMessage } from "./services/project";
import { loadChats, saveChats } from "./services/chatStorage";
import { loadSettings } from "./services/settings";
import "./styles.css";

const MODELS = [
  { id: "auto", name: "Aether Auto" },
  { id: "groq", name: "AetherBot" },
  { id: "gemini", name: "AetherBotPro" }
];

const AETHERCODE_STORAGE_KEY =
  "aetherbot_code_workspace";

const DEFAULT_FILES = [
  {
    id: crypto.randomUUID(),
    name: "main.js",
    type: "file",
    content:
      '// Welcome to AetherCode\n\nconsole.log("Hello from AetherCode!");'
  },
  {
    id: crypto.randomUUID(),
    name: "README.md",
    type: "file",
    content:
      "# AetherCode\n\nYour browser-based coding workspace."
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
  const cleaned = text.replace(/\s+/g, " ").trim();

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
    previousSetbacks + (analysis.setback ? 1 : 0);

  if (setbackCount === 1) {
    speed = 3;
  } else if (setbackCount === 2) {
    speed = 2;
  } else if (setbackCount >= 3) {
    speed = 1;
  }

  return Math.min(99, currentProgress + speed);
}

function sortChats(chats) {
  return [...chats].sort(
    (a, b) =>
      (b.updatedAt || 0) -
      (a.updatedAt || 0)
  );
}

function loadCodeWorkspace() {
  try {
    const saved = localStorage.getItem(
      AETHERCODE_STORAGE_KEY
    );

    if (!saved) {
      return DEFAULT_FILES;
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return DEFAULT_FILES;
    }

    return parsed;
  } catch {
    return DEFAULT_FILES;
  }
}

function saveCodeWorkspace(files) {
  try {
    localStorage.setItem(
      AETHERCODE_STORAGE_KEY,
      JSON.stringify(files)
    );
  } catch (error) {
    console.error(
      "Unable to save AetherCode workspace:",
      error
    );
  }
}

function getFileExtension(name) {
  const parts = name.split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts.pop().toLowerCase();
}

function getLanguage(name) {
  const extension =
    getFileExtension(name);

  const languages = {
    js: "JavaScript",
    jsx: "React JSX",
    ts: "TypeScript",
    tsx: "TypeScript JSX",
    css: "CSS",
    html: "HTML",
    json: "JSON",
    md: "Markdown",
    py: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    cs: "C#",
    xml: "XML",
    txt: "Text"
  };

  return languages[extension] || "Text";
}

function runCodePreview(file) {
  const extension =
    getFileExtension(file.name);

  if (
    extension !== "js" &&
    extension !== "mjs"
  ) {
    return {
      success: false,
      message:
        "AetherCode currently previews JavaScript files only."
    };
  }

  const logs = [];

  try {
    const safeConsole = {
      log: (...values) => {
        logs.push(
          values
            .map((value) => {
              if (
                typeof value ===
                "object"
              ) {
                try {
                  return JSON.stringify(
                    value,
                    null,
                    2
                  );
                } catch {
                  return String(value);
                }
              }

              return String(value);
            })
            .join(" ")
        );
      }
    };

    const execute = new Function(
      "console",
      `"use strict";\n${file.content}`
    );

    execute(safeConsole);

    return {
      success: true,
      message:
        logs.length > 0
          ? logs.join("\n")
          : "Code executed successfully with no console output."
    };
  } catch (error) {
    return {
      success: false,
      message:
        error?.message ||
        "Code execution failed."
    };
  }
}

function AetherCode({
  onClose,
  onAskAI
}) {
  const [files, setFiles] =
    useState(loadCodeWorkspace);

  const [activeFileId, setActiveFileId] =
    useState(() => {
      const initial =
        loadCodeWorkspace();

      return initial[0]?.id || null;
    });

  const [output, setOutput] = useState(
    "Run JavaScript to see the output here."
  );

  const [renamingFileId, setRenamingFileId] =
    useState(null);

  const [renameValue, setRenameValue] =
    useState("");

  const activeFile = useMemo(
    () =>
      files.find(
        (file) =>
          file.id === activeFileId
      ) || null,
    [files, activeFileId]
  );

  useEffect(() => {
    saveCodeWorkspace(files);
  }, [files]);

  function createFile() {
    const name =
      `file-${files.length + 1}.js`;

    const file = {
      id: crypto.randomUUID(),
      name,
      type: "file",
      content: ""
    };

    setFiles((current) => [
      ...current,
      file
    ]);

    setActiveFileId(file.id);
  }

  function deleteFile(id) {
    if (files.length <= 1) {
      return;
    }

    const remaining =
      files.filter(
        (file) => file.id !== id
      );

    setFiles(remaining);

    if (id === activeFileId) {
      setActiveFileId(
        remaining[0]?.id || null
      );
    }
  }

  function updateFileContent(content) {
    if (!activeFileId) {
      return;
    }

    setFiles((current) =>
      current.map((file) =>
        file.id === activeFileId
          ? {
              ...file,
              content
            }
          : file
      )
    );
  }

  function beginRename(file) {
    setRenamingFileId(file.id);
    setRenameValue(file.name);
  }

  function finishRename() {
    if (!renamingFileId) {
      return;
    }

    const cleanName =
      renameValue.trim();

    if (!cleanName) {
      setRenamingFileId(null);
      return;
    }

    setFiles((current) =>
      current.map((file) =>
        file.id === renamingFileId
          ? {
              ...file,
              name: cleanName
            }
          : file
      )
    );

    setRenamingFileId(null);
    setRenameValue("");
  }

  function runCurrentFile() {
    if (!activeFile) {
      return;
    }

    const result =
      runCodePreview(activeFile);

    setOutput(
      result.success
        ? result.message
        : `Error: ${result.message}`
    );
  }

  function askAIForCode() {
    if (!activeFile) {
      return;
    }

    onAskAI(
      `I am working in AetherCode on the file "${activeFile.name}". Please help me with this code:\n\n${activeFile.content}`
    );

    onClose();
  }

  return (
    <div className="aethercode-overlay">
      <div className="aethercode-window">
        <header className="aethercode-header">
          <div className="aethercode-brand">
            <div className="aethercode-logo">
              A
            </div>

            <div>
              <strong>AetherCode</strong>
              <span>
                Coding workspace
              </span>
            </div>
          </div>

          <div className="aethercode-actions">
            <button
              onClick={askAIForCode}
              title="Ask AetherBot for help"
            >
              Ask AI
            </button>

            <button
              onClick={onClose}
              title="Close AetherCode"
            >
              ×
            </button>
          </div>
        </header>

        <div className="aethercode-body">
          <aside className="aethercode-files">
            <div className="aethercode-files-header">
              <span>EXPLORER</span>

              <button
                onClick={createFile}
                title="New file"
              >
                +
              </button>
            </div>

            <div className="aethercode-file-list">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`aethercode-file ${
                    file.id ===
                    activeFileId
                      ? "active"
                      : ""
                  }`}
                >
                  {renamingFileId ===
                  file.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(event) =>
                        setRenameValue(
                          event.target.value
                        )
                      }
                      onBlur={
                        finishRename
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          finishRename();
                        }

                        if (
                          event.key ===
                          "Escape"
                        ) {
                          setRenamingFileId(
                            null
                          );
                        }
                      }}
                    />
                  ) : (
                    <>
                      <button
                        className="aethercode-file-select"
                        onClick={() =>
                          setActiveFileId(
                            file.id
                          )
                        }
                        onDoubleClick={() =>
                          beginRename(
                            file
                          )
                        }
                      >
                        <span>
                          {getFileExtension(
                            file.name
                          ) === "js"
                            ? "JS"
                            : "•"}
                        </span>

                        {file.name}
                      </button>

                      <button
                        className="aethercode-file-delete"
                        onClick={() =>
                          deleteFile(
                            file.id
                          )
                        }
                        title="Delete file"
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </aside>

          <section className="aethercode-editor-area">
            {activeFile ? (
              <>
                <div className="aethercode-tab">
                  <span>
                    {activeFile.name}
                  </span>

                  <small>
                    {getLanguage(
                      activeFile.name
                    )}
                  </small>
                </div>

                <div className="aethercode-editor">
                  <div className="aethercode-line-numbers">
                    {activeFile.content
                      .split("\n")
                      .map(
                        (_, index) => (
                          <span
                            key={index}
                          >
                            {index + 1}
                          </span>
                        )
                      )}
                  </div>

                  <textarea
                    value={
                      activeFile.content
                    }
                    onChange={(event) =>
                      updateFileContent(
                        event.target
                          .value
                      )
                    }
                    spellCheck={false}
                    aria-label="Code editor"
                  />
                </div>

                <div className="aethercode-output">
                  <div className="aethercode-output-header">
                    <span>
                      OUTPUT
                    </span>

                    <button
                      onClick={
                        runCurrentFile
                      }
                    >
                      Run
                    </button>
                  </div>

                  <pre>{output}</pre>
                </div>
              </>
            ) : (
              <div className="aethercode-empty">
                Create a file to begin.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [chats, setChats] =
    useState(() =>
      sortChats(loadChats())
    );

  const [activeChatId, setActiveChatId] =
    useState(null);

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [input, setInput] =
    useState("");

  const [searchQuery, setSearchQuery] =
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

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [aetherCodeOpen, setAetherCodeOpen] =
    useState(false);

  const [settings, setSettings] =
    useState(loadSettings);

  const activeChat = useMemo(
    () =>
      chats.find(
        (chat) =>
          chat.id === activeChatId
      ) || null,
    [chats, activeChatId]
  );

  const filteredChats = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    if (!query) {
      return chats;
    }

    return chats.filter((chat) => {
      const titleMatch =
        chat.title
          ?.toLowerCase()
          .includes(query);

      const messageMatch =
        chat.messages?.some(
          (message) =>
            message.content
              ?.toLowerCase()
              .includes(query)
        );

      return (
        titleMatch || messageMatch
      );
    });
  }, [chats, searchQuery]);

  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  useEffect(() => {
    document.documentElement.dataset.theme =
      settings.theme;

    document.documentElement.dataset.accent =
      settings.accent;

    document.documentElement.classList.toggle(
      "compact-mode",
      Boolean(settings.compactMode)
    );

    document.documentElement.classList.toggle(
      "reduce-motion",
      !Boolean(settings.animations)
    );
  }, [settings]);

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
    setSearchQuery("");
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
        (chat) => chat.id !== id
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
      !event.shiftKey &&
      settings.enterToSend
    ) {
      event.preventDefault();
      sendMessage();
    }
  }

  function askAIFromCode(message) {
    setAetherCodeOpen(false);

    setInput(message);

    setTimeout(() => {
      const composer =
        document.querySelector(
          ".message-composer textarea"
        );

      if (composer) {
        composer.focus();
      }
    }, 50);
  }

  async function sendMessage() {
    const text = input.trim();

    if (!text || isLoading) {
      return;
    }

    setError("");

    let chatId = activeChatId;
    let chatForRequest = activeChat;

    if (!chatId) {
      const newChat = createChat();

      chatId = newChat.id;
      chatForRequest = newChat;

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
      analyzeProjectMessage(text);

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
          <>
            <button
              className="new-chat-button"
              onClick={
                createNewChat
              }
            >
              <span>＋</span>
              <span>New chat</span>
            </button>

            <div className="chat-search">
              <span>⌕</span>

              <input
                value={
                  searchQuery
                }
                onChange={(event) =>
                  setSearchQuery(
                    event.target
                      .value
                  )
                }
                placeholder="Search chats"
                aria-label="Search chats"
              />

              {searchQuery && (
                <button
                  onClick={() =>
                    setSearchQuery(
                      ""
                    )
                  }
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </>
        )}

        <div className="sidebar-section">
          {sidebarOpen && (
            <div className="sidebar-label">
              {searchQuery
                ? `Results (${filteredChats.length})`
                : "Chats"}
            </div>
          )}

          {filteredChats.length ===
          0 ? (
            sidebarOpen && (
              <div className="empty-chat-list">
                {searchQuery
                  ? "No matching chats."
                  : "Your chats will appear here."}
              </div>
            )
          ) : (
            <div className="chat-list">
              {filteredChats.map(
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
                            event
                              .target
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
            <button
              onClick={() =>
                setSettingsOpen(
                  true
                )
              }
            >
              ⚙
              <span>Settings</span>
            </button>

            <button
              onClick={() =>
                setAetherCodeOpen(
                  true
                )
              }
            >
              ◇
              <span>AetherCode</span>
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
                How can AetherBot
                help?
              </h2>

              <p>
                Start a conversation
                and your chats will
                be saved automatically.
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
              {activeChat.isProject &&
                settings.showProjectProgress && (
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
                {activeChat.messages
                  .length === 0 ? (
                  <div className="conversation-empty">
                    <h2>
                      {
                        activeChat.title
                      }
                    </h2>

                    <p>
                      Send a message
                      to begin.
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

                    {isLoading && (
                      <div className="message-row assistant">
                        <div className="message-bubble">
                          <div className="typing">
                            AetherBot is
                            thinking...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="aether-error">
                  {error}
                </div>
              )}

              <div className="message-composer">
                <textarea
                  value={input}
                  onChange={(event) =>
                    setInput(
                      event.target
                        .value
                    )
                  }
                  onKeyDown={
                    handleComposerKeyDown
                  }
                  placeholder="Message AetherBot..."
                  rows={1}
                  disabled={
                    isLoading
                  }
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

      {settingsOpen && (
        <Settings
          onClose={() =>
            setSettingsOpen(
              false
            )
          }
          onSettingsChange={
            setSettings
          }
        />
      )}

      {aetherCodeOpen && (
        <AetherCode
          onClose={() =>
            setAetherCodeOpen(
              false
            )
          }
          onAskAI={
            askAIFromCode
          }
        />
      )}
    </div>
  );
}
