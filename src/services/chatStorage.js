const STORAGE_KEY = "aetherbot_chats";

export function loadChats() {
  try {
    const stored =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      return [];
    }

    const chats = JSON.parse(stored);

    if (!Array.isArray(chats)) {
      return [];
    }

    return chats;
  } catch (error) {
    console.error(
      "AetherBot: unable to load chats.",
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

    return true;
  } catch (error) {
    console.error(
      "AetherBot: unable to save chats.",
      error
    );

    return false;
  }
}

export function deleteStoredChat(
  chatId
) {
  const chats = loadChats();

  const updated =
    chats.filter(
      (chat) =>
        chat.id !== chatId
    );

  saveChats(updated);

  return updated;
}

export function clearStoredChats() {
  localStorage.removeItem(
    STORAGE_KEY
  );
}

export function exportChats() {
  const chats = loadChats();

  return JSON.stringify(
    chats,
    null,
    2
  );
      }
