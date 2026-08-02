const MODEL_ENDPOINTS = {
  groq: "/api/groq",
  gemini: "/api/gemini"
};

function cleanMessages(messages) {
  return messages
    .filter(
      (message) =>
        message &&
        (message.role === "user" ||
          message.role === "assistant")
    )
    .map((message) => ({
      role: message.role,
      content: String(message.content || "")
    }));
}

async function requestModel(endpoint, messages) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: cleanMessages(messages)
    })
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `AI request failed with status ${response.status}.`
    );
  }

  if (!data?.content) {
    throw new Error(
      "The AI returned an empty response."
    );
  }

  return data.content;
}

export async function sendToAI(
  model,
  messages
) {
  if (!Array.isArray(messages)) {
    throw new Error(
      "Invalid message history."
    );
  }

  if (model === "groq") {
    return requestModel(
      MODEL_ENDPOINTS.groq,
      messages
    );
  }

  if (model === "gemini") {
    return requestModel(
      MODEL_ENDPOINTS.gemini,
      messages
    );
  }

  if (model === "auto") {
    try {
      return await requestModel(
        MODEL_ENDPOINTS.groq,
        messages
      );
    } catch (groqError) {
      console.warn(
        "AetherBot Auto: Groq failed. Trying Gemini.",
        groqError
      );

      return requestModel(
        MODEL_ENDPOINTS.gemini,
        messages
      );
    }
  }

  throw new Error(
    "Unknown AI model selected."
  );
}
