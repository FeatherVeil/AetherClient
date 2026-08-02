export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed"
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {
    const body = await request.json();

    const messages = Array.isArray(
      body.messages
    )
      ? body.messages
      : [];

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No messages provided"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const apiKey =
      process.env.GROQ_API_KEY;

    const model =
      process.env.GROQ_MODEL;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "GROQ_API_KEY is not configured."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    if (!model) {
      return new Response(
        JSON.stringify({
          error:
            "GROQ_MODEL is not configured."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
          Authorization: `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error:
            data?.error?.message ||
            "Groq request failed."
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const message =
      data?.choices?.[0]?.message?.content ||
      "";

    return new Response(
      JSON.stringify({
        message
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error(
      "AetherBot error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "AetherBot could not process the request."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
