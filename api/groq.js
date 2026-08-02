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

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "Groq API key is not configured."
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Groq request failed."
      });
    }

    const content =
      data?.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({
        error: "Groq returned no response."
      });
    }

    return res.status(200).json({
      content
    });
  } catch (error) {
    console.error("Groq API error:", error);

    return res.status(500).json({
      error: "Unable to contact Groq."
    });
  }
}
