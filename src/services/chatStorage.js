const CHATS_KEY = "aetherbot_chats";

export function loadChats() {
  try {
    const saved = localStorage.getItem(CHATS_KEY);

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
      "AetherBot: unable to load chats.",
      error
    );

    return [];
  }
}

export function saveChats(chats) {
  try {
    localStorage.setItem(
      CHATS_KEY,
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

export function getChat(chatId) {
  const chats = loadChats();

  return (
    chats.find(
      (chat) => chat.id === chatId
    ) || null
  );
}

export function deleteChat(chatId) {
  const chats = loadChats();

  const updatedChats = chats.filter(
    (chat) => chat.id !== chatId
  );

  saveChats(updatedChats);

  return updatedChats;
}

export function clearAllChats() {
  try {
    localStorage.removeItem(CHATS_KEY);
  } catch (error) {
    console.error(
      "AetherBot: unable to clear chats.",
      error
    );
  }
}
