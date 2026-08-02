const STORAGE_KEY = "aetherclient_chats";

function generateId() {
  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function generateChatTitle(text) {
  const cleaned = text
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "New chat";
  }

  const lower = cleaned.toLowerCase();

  const topicRules = [
    {
      words: [
        "website",
        "web site",
        "webpage",
        "frontend",
        "react",
        "html",
        "css"
      ],
      title: "Web Development"
    },
    {
      words: [
        "python",
        "javascript",
        "typescript",
        "program",
        "programming",
        "code",
        "coding",
        "bug",
        "error"
      ],
      title: "Programming"
    },
    {
      words: [
        "homework",
        "assignment",
        "exam",
        "study",
        "school",
        "learn"
      ],
      title: "Study & Learning"
    },
    {
      words: [
        "project",
        "build",
        "create",
        "make"
      ],
      title: "Project"
    },
    {
      words: [
        "story",
        "novel",
        "character",
        "fiction",
        "poem",
        "writing"
      ],
      title: "Creative Writing"
    },
    {
      words: [
        "math",
        "equation",
        "algebra",
        "geometry",
        "calculus"
      ],
      title: "Mathematics"
    },
    {
      words: [
        "science",
        "physics",
        "chemistry",
        "biology"
      ],
      title: "Science"
    },
    {
      words: [
        "travel",
        "trip",
        "vacation",
        "holiday"
      ],
      title: "Travel Planning"
    },
    {
      words: [
        "game",
        "gaming",
        "unity",
        "unreal"
      ],
      title: "Game Development"
    }
  ];

  const matchedRule =
    topicRules.find((rule) =>
      rule.words.some((word) =>
        lower.includes(word)
      )
    );

  if (matchedRule) {
    const firstSentence =
      cleaned.split(/[.!?]/)[0].trim();

    if (
      firstSentence.length > 10 &&
      firstSentence.length <= 55
    ) {
      return firstSentence;
    }

    return matchedRule.title;
  }

  const words = cleaned
    .split(" ")
    .filter(Boolean)
    .slice(0, 7);

  let title = words.join(" ");

  if (title.length > 48) {
    title = title.slice(0, 48).trim();
  }

  if (
    title.length > 0 &&
    title.length < cleaned.length
  ) {
    title += "…";
  }

  return (
    title.charAt(0).toUpperCase() +
    title.slice(1)
  );
}

export function createChat() {
  return {
    id: generateId(),

    title: "New chat",

    model: "aetherbot",

    type: "chat",

    project: {
      enabled: false,
      progress: 0,
      completed: false,
      steps: []
    },

    messages: [],

    createdAt: Date.now(),

    updatedAt: Date.now()
  };
}

export function loadChats() {
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
      "Could not load chats:",
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
      "Could not save chats:",
      error
    );
  }
}

export function updateChat(
  chats,
  chatId,
  changes
) {
  return chats.map((chat) => {
    if (chat.id !== chatId) {
      return chat;
    }

    return {
      ...chat,
      ...changes,
      updatedAt: Date.now()
    };
  });
}

export function deleteChat(
  chats,
  chatId
) {
  return chats.filter(
    (chat) => chat.id !== chatId
  );
}
