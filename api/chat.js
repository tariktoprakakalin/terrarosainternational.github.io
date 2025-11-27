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
You are **TerraRosa AI Desk**, a smart trade assistant.
Your goal is to help the user fill out the inquiry form below by extracting data from their messages.

**INSTRUCTIONS:**
1. Analyze the user's input for trade details: Product, Quantity/Volume, Port/Delivery, Bank Profile, Company, Country, Email.
2. **ALWAYS** return a JSON object. Do NOT return plain text.
3. The JSON must have two keys:
   - "reply": A text response (in the user's language).
     - Confirm what you autofilled.
     - **CRITICAL:** Identify MISSING fields (Product, Volume, Port, Payment).
     - Ask specific **TECHNICAL** questions to fill these gaps.
       - Example (Fuel): "Target price? Origin preference? Sulphur content?"
       - Example (Agri): "GMO/Non-GMO? Moisture limits? Packaging (Bulk/Bags)?"
   - "fields": An object containing extracted data to autofill the form. Keys: "product", "volume", "port", "bank", "company", "country", "email", "message".

**JSON FORMAT:**
{
  "reply": "I've noted the EN590 request. What is the target price?",
  "fields": {
    "product": "EN590 10ppm",
    "volume": "50,000 MT x 12 months",
    "port": "Rotterdam",
    "bank": "Top 50 Bank",
    "message": "Target price: ..."
  }
}

**RULES:**
- If a field is not mentioned, do not include it in "fields" (or set to null).
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
