export async function sendToAI(
  model,
  messages
) {
  if (!Array.isArray(messages) || !messages.length) {
    throw new Error(
      "No messages were provided."
    );
  }

  const response = await fetch(
    "/.netlify/functions/ai",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        model,
        messages
      })
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The AI server returned an invalid response."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "The AI request failed."
    );
  }

  if (!data?.response) {
    throw new Error(
      "The AI returned an empty response."
    );
  }

  return data.response;
}
