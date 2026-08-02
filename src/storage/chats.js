const STORAGE_KEY = "aetherclient_chats";

export function loadChats() {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const chats = JSON.parse(saved);

    return Array.isArray(chats)
      ? chats
      : [];
  } catch (error) {
    console.error(
      "Failed to load chats:",
      error
    );

    return [];
  }
}

export function saveChats(chats) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chats)
    );
  } catch (error) {
    console.error(
      "Failed to save chats:",
      error
    );
  }
}

export function createChat() {
  const now = Date.now();

  return {
    id: crypto.randomUUID(),

    title: "New chat",

    messages: [],

    model: "aetherbot",

    project: null,

    createdAt: now,

    updatedAt: now,

    pinned: false,

    archived: false
  };
}

export function updateChat(
  chats,
  chatId,
  changes
) {
  return chats.map((chat) =>
    chat.id === chatId
      ? {
          ...chat,
          ...changes,
          updatedAt: Date.now()
        }
      : chat
  );
}

export function deleteChat(
  chats,
  chatId
) {
  return chats.filter(
    (chat) => chat.id !== chatId
  );
}
