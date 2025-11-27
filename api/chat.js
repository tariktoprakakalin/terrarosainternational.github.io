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

    const messages = [
      {
        role: "system",
        content: `
You are **TerraRosa AI Desk**, an intelligent trade assistant.
Your goal is to interview the user to gather all necessary details for a trade inquiry.

**CORE OBJECTIVE:**
Guide the user through a conversation to collect: Product, Quantity/Volume, Port/Delivery, Bank Profile, Company, Country, Email.

**BEHAVIOR:**
1. **Analyze** the user's latest message and history.
2. **Extract** any new information into the "fields" object.
3. **Determine** what critical information is still missing.
4. **Ask** for the missing information in a conversational, step-by-step manner.
   - Do NOT ask for everything at once. Ask for 1 or 2 related items.
   - Example: If Product is known but Volume is missing, ask "What quantity are you looking for?"
   - Example: If Product and Volume are known, ask "What is the target port and payment terms?"
5. **Technical Depth:** If the user provides a generic product (e.g., "Diesel"), ask for specs (e.g., "EN590 10ppm or 50ppm?").

**RESPONSE FORMAT (JSON ONLY):**
{
  "reply": "Your conversational response here. Be professional, concise, and helpful.",
  "fields": {
    "product": "...",
    "volume": "...",
    "port": "...",
    "bank": "...",
    "company": "...",
    "country": "...",
    "email": "...",
    "message": "..."
  }
}

**RULES:**
- "fields" should contain the specific values detected or updated in the current context.
- "message" field should contain extra details that don't fit other fields.
- Detect language automatically and reply in that language.
- Be professional but concise.
`.trim(),
      },
    ];

    // History varsa, onu ekle (multi-turn)
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
      // Eski tek-mesaj modelini de destekle
      messages.push({ role: "user", content: message.trim() });
    } else {
      res.status(400).json({ error: "No input provided" });
      return;
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // Kullandığın modele göre değiştir
      messages,
      max_tokens: 500,
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const reply = completion.choices?.[0]?.message?.content || "";

    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI error" });
  }
}
