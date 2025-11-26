// api/chat.js
// Vercel Serverless Function – TerraRosa basit AI endpoint

export default async function handler(req, res) {
  // Sadece POST kabul ediyoruz
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Only POST is allowed" });
  }

  try {
    // Vercel bazen body'yi direkt obje, bazen string geçebiliyor
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // parse edilemezse olduğu gibi bırak
      }
    }

    const userMessage = body?.message;
    if (!userMessage || typeof userMessage !== "string") {
      return res
        .status(400)
        .json({ error: "Field 'message' (string) is required in JSON body." });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set");
      return res
        .status(500)
        .json({ error: "Server misconfigured (no OPENAI_API_KEY)" });
    }

    // Sistem rolü: TerraRosa AI
    const messages = [
      {
        role: "system",
        content: `
You are TerraRosa AI Desk. 
- Detect the user's language and answer in that language (TR/EN or others).
- Your job is to quickly understand:
  - product
  - volume
  - origin/destination
  - payment method
  - timing
  - is the user buyer, seller, or broker
- Do NOT give prices or binding offers.
- Be short, clear, and neutral.
      `.trim(),
      },
      { role: "user", content: userMessage },
    ];

    // OpenAI Chat API çağrısı
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // istersen sonra değiştirirsin
          messages,
          temperature: 0.4,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI error:", errText);
      return res.status(500).json({ error: "OpenAI request failed" });
    }

    const data = await openaiResponse.json();
    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      "Şu an yanıt üretilemiyor, lütfen daha sonra tekrar deneyin.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
