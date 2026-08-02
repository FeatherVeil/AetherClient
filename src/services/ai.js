const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const DEFAULT_SYSTEM_PROMPT = `
You are AetherBot, an AI assistant inside AetherClient.

Be helpful, accurate, clear, and concise.

Use Markdown for formatting.

When writing code:
- Always use fenced code blocks.
- Specify the programming language when possible.
- Keep code complete and copyable.

When explaining mathematics:
- Use LaTeX notation when appropriate.
- Use inline math for short expressions.
- Use display math for larger formulas.

If the conversation appears to involve a goal that requires multiple
steps or ongoing work, recognize it as a possible project.

Do not claim that an action was completed unless the user has actually
confirmed that it happened.
`;

function getModelName(model) {
  if (model === "gemini") {
    return "gemini-2.0-flash";
  }

  return "llama-3.3-70b-versatile";
}

function getGroqMessages(messages) {
  return [
    {
      role: "system",
      content: DEFAULT_SYSTEM_PROMPT
    },
    ...messages.map((message) => ({
      role:
        message.role === "assistant"
          ? "assistant"
          : "user",
      content: message.content
    }))
  ];
}

function getGeminiContents(messages) {
  return messages.map((message) => ({
    role:
      message.role === "assistant"
        ? "model"
        : "user",
    parts: [
      {
        text: message.content
      }
    ]
  }));
}

async function callGroq(messages) {
  const apiKey =
    import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Groq API key is not configured."
    );
  }

  const response = await fetch(
    GROQ_API_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${apiKey}`
      },

      body: JSON.stringify({
        model:
          getModelName("groq"),

        messages:
          getGroqMessages(
            messages
          ),

        temperature: 0.7,

        max_tokens: 4096
      })
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Groq request failed (${response.status}): ${errorText}`
    );
  }

  const data =
    await response.json();

  const content =
    data?.choices?.[0]?.message
      ?.content;

  if (!content) {
    throw new Error(
      "Groq returned an empty response."
    );
  }

  return content;
}

async function callGemini(messages) {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured."
    );
  }

  const model =
    getModelName("gemini");

  const url =
    `${GEMINI_API_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response =
    await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                DEFAULT_SYSTEM_PROMPT
            }
          ]
        },

        contents:
          getGeminiContents(
            messages
          ),

        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      })
    });

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Gemini request failed (${response.status}): ${errorText}`
    );
  }

  const data =
    await response.json();

  const content =
    data?.candidates?.[0]
      ?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("");

  if (!content) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  return content;
}

export async function sendToAI(
  model,
  messages
) {
  if (!messages?.length) {
    throw new Error(
      "No messages were provided."
    );
  }

  if (model === "gemini") {
    return callGemini(messages);
  }

  if (model === "groq") {
    return callGroq(messages);
  }

  if (model === "auto") {
    try {
      return await callGroq(
        messages
      );
    } catch (groqError) {
      console.warn(
        "Groq failed. Trying Gemini.",
        groqError
      );

      return callGemini(messages);
    }
  }

  throw new Error(
    `Unsupported AI model: ${model}`
  );
          }
