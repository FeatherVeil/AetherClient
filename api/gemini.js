export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Messages must be an array."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is not configured."
      });
    }

    const contents = messages.map((message) => ({
      role:
        message.role === "assistant"
          ? "model"
          : "user",
      parts: [
        {
          text: String(
            message.content || ""
          )
        }
      ]
    }));

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key":
            process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini request failed."
      });
    }

    const content =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("") || "";

    if (!content) {
      return res.status(502).json({
        error: "Gemini returned no response."
      });
    }

    return res.status(200).json({
      content
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    return res.status(500).json({
      error: "Unable to contact Gemini."
    });
  }
}
