import { useEffect, useState } from "react";

import {
  loadChats,
  saveChats,
  createChat,
  updateChat,
  deleteChat
} from "./storage/chats.js";

import ModelSelector from "./components/ModelSelector.jsx";

export default function App() {
  const [chats, setChats] = useState(
    () => loadChats()
  );

  const [activeChatId, setActiveChatId] =
    useState(null);

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [editingChatId, setEditingChatId] =
    useState(null);

  const [editingTitle, setEditingTitle] =
    useState("");

  const [messageText, setMessageText] =
    useState("");

  const [isSending, setIsSending] =
    useState(false);

  const [selectedModel, setSelectedModel] =
    useState("aetherbot");

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
    setSelectedModel(newChat.model);
  }

  function handleSelectChat(chat) {
    setActiveChatId(chat.id);

    setSelectedModel(
      chat.model || "aetherbot"
    );
  }

  function handleDeleteChat(chatId) {
    setChats((currentChats) =>
      deleteChat(currentChats, chatId)
    );

    if (activeChatId === chatId) {
      setActiveChatId(null);
    }

    if (editingChatId === chatId) {
      setEditingChatId(null);
      setEditingTitle("");
    }
  }

  function startEditingChat(chat) {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  }

  function cancelEditing() {
    setEditingChatId(null);
    setEditingTitle("");
  }

  function saveChatTitle(chatId) {
    const trimmedTitle =
      editingTitle.trim();

    if (!trimmedTitle) {
      cancelEditing();
      return;
    }

    setChats((currentChats) =>
      updateChat(
        currentChats,
        chatId,
        {
          title: trimmedTitle
        }
      )
    );

    cancelEditing();
  }

  function handleTitleKeyDown(
    event,
    chatId
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveChatTitle(chatId);
    }

    if (event.key === "Escape") {
      cancelEditing();
    }
  }

  function handleModelChange(modelId) {
    setSelectedModel(modelId);

    if (!activeChatId) {
      return;
    }

    setChats((currentChats) =>
      updateChat(
        currentChats,
        activeChatId,
        {
          model: modelId
        }
      )
    );
  }

  function updateActiveChatMessages(
    messages
  ) {
    if (!activeChatId) return;

    setChats((currentChats) =>
      updateChat(
        currentChats,
        activeChatId,
        {
          messages
        }
      )
    );
  }

  async function handleSendMessage() {
    const text = messageText.trim();

    if (
      !text ||
      !activeChatId ||
      isSending
    ) {
      return;
    }

    const activeChat = chats.find(
      (chat) =>
        chat.id === activeChatId
    );

    if (!activeChat) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now()
    };

    const updatedMessages = [
      ...activeChat.messages,
      userMessage
    ];

    updateActiveChatMessages(
      updatedMessages
    );

    setMessageText("");
    setIsSending(true);

    try {
      const response = await fetch(
        "/.netlify/functions/aetherbot",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            model: selectedModel,

            messages:
              updatedMessages.map(
                (message) => ({
                  role: message.role,
                  content:
                    message.content
                })
              )
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "AetherBot request failed."
        );
      }

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          data.message ||
          "I didn't receive a response.",
        createdAt: Date.now()
      };

      updateActiveChatMessages([
        ...updatedMessages,
        assistantMessage
      ]);
    } catch (error) {
      console.error(error);

      const errorMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Sorry, AetherBot could not respond right now.",
        createdAt: Date.now()
      };

      updateActiveChatMessages([
        ...updatedMessages,
        errorMessage
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleComposerKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  const activeChat =
    chats.find(
      (chat) => chat.id === activeChatId
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
                    {editingChatId ===
                    chat.id ? (
                      <input
                        className="chat-title-input"
                        value={editingTitle}
                        onChange={(event) =>
                          setEditingTitle(
                            event.target.value
                          )
                        }
                        onKeyDown={(event) =>
                          handleTitleKeyDown(
                            event,
                            chat.id
                          )
                        }
                        onBlur={() =>
                          saveChatTitle(
                            chat.id
                          )
                        }
                        autoFocus
                      />
                    ) : (
                      <button
                        className="chat-select"
                        onClick={() =>
                          handleSelectChat(
                            chat
                          )
                        }
                        onDoubleClick={() =>
                          startEditingChat(
                            chat
                          )
                        }
                        title="Double-click to rename"
                      >
                        {chat.title}
                      </button>
                    )}

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
            <div className="conversation">
              {activeChat.messages.length ===
              0 ? (
                <div className="conversation-empty">
                  <h2>
                    {activeChat.title}
                  </h2>

                  <p>
                    Start the conversation.
                  </p>
                </div>
              ) : (
                <div className="message-list">
                  {activeChat.messages.map(
                    (message) => (
                      <div
                        key={message.id}
                        className={`message-row ${
                          message.role
                        }`}
                      >
                        <div className="message-bubble">
                          {message.content}
                        </div>
                      </div>
                    )
                  )}

                  {isSending && (
                    <div className="message-row assistant">
                      <div className="message-bubble typing">
                        AetherBot is thinking...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="message-composer">
            <textarea
              value={messageText}
              onChange={(event) =>
                setMessageText(
                  event.target.value
                )
              }
              onKeyDown={
                handleComposerKeyDown
              }
              placeholder={
                activeChat
                  ? "Message AetherBot..."
                  : "Start a new chat..."
              }
              rows="1"
              disabled={
                !activeChat ||
                isSending
              }
            />

            <div className="composer-bottom">
              <div className="composer-tools">
                <button title="Attach">
                  ＋
                </button>

                <ModelSelector
                  selectedModel={
                    selectedModel
                  }
                  onChange={
                    handleModelChange
                  }
                />
              </div>

              <button
                className="send-button"
                title="Send"
                onClick={
                  handleSendMessage
                }
                disabled={
                  !activeChat ||
                  !messageText.trim() ||
                  isSending
                }
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
