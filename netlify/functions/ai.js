const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const SYSTEM_PROMPT = `
You are AetherBot, an AI assistant inside AetherClient.

Be helpful, accurate, clear, and concise.

Use Markdown for formatting.

When writing code:
- Use fenced code blocks.
- Specify the programming language when possible.
- Keep code complete and copyable.

When explaining mathematics:
- Use LaTeX notation when appropriate.
- Use inline math for short expressions.
- Use display math for larger formulas.

If a conversation appears to involve a goal that requires multiple
steps or ongoing work, recognize it as a possible project.

Do not claim that an action was completed unless the user has actually
confirmed that it happened.
`;

function getGroqMessages(messages) {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPT
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
    process.env.GROQ_API_KEY;

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
          "llama-3.3-70b-versatile",
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
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured."
    );
  }

  const model =
    "gemini-2.0-flash";

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
                SYSTEM_PROMPT
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

export default async function handler(
  request
) {
  if (request.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        error:
          "Method not allowed."
      })
    };
  }

  try {
    const body =
      typeof request.body === "string"
        ? JSON.parse(request.body)
        : request.body;

    const messages =
      body?.messages;

    const model =
      body?.model || "auto";

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          error:
            "Messages are required."
        })
      };
    }

    let response;

    if (model === "gemini") {
      response =
        await callGemini(
          messages
        );
    } else if (model === "groq") {
      response =
        await callGroq(
          messages
        );
    } else {
      try {
        response =
          await callGroq(
            messages
          );
      } catch {
        response =
          await callGemini(
            messages
          );
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        response
      })
    };
  } catch (error) {
    console.error(
      "Aether AI function error:",
      error
    );

    return {
      statusCode: 500,
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        error:
          error?.message ||
          "AI request failed."
      })
    };
  }
}
