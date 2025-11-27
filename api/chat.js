// api/chat.js

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { message, history } = req.body || {};

    // Mesaj listesini oluştur
    const messages = [
      {
        role: "system",
        content: `
You are TerraRosa AI Desk.

- Automatically detect the user's language and reply in the same language (TR/EN or any other).
- Your job:
  - Understand: product, quantity & period, origin/destination, payment method, timing, and whether the user is buyer/seller/broker.
  - Help the user structure a clear, concise inquiry (mini-LOI style).
- Do NOT give prices or binding offers.
- If the user asks vague things, ask specific follow-up questions.
- Be short, clear, neutral, and professional.
`.trim(),
      },
    ];

    // Frontend'den gelen history'yi ekle (varsa)
    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history) {
        if (
          msg &&
          (msg.role === "user" || msg.role === "assistant") &&
          typeof msg.content === "string"
        ) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    } else if (typeof message === "string" && message.trim()) {
      // Eski tek-mesaj modeli de bozulmasın
      messages.push({ role: "user", content: message.trim() });
    } else {
      res.status(400).json({ error: "No input provided" });
      return;
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      max_tokens: 400,
      temperature: 0.4,
    });

    const reply = completion.choices?.[0]?.message?.content || "";

    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI error" });
  }
}
