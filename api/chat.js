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

    // Mesaj listesi
    const messages = [
      {
        role: "system",
        content: `
You are **TerraRosa AI Desk**, assisting with global commodity sourcing (EN590, Jet A1, corn, rice, urea, BLCO, etc.).

Your goals:
1. Automatically detect the user's language and always reply in the SAME language (TR, EN or any other).
2. Never just repeat what the user said. Always ADD VALUE:
   - Summarize what they wrote in a cleaner, structured way.
   - Point out missing or unclear information.
   - Ask 2–5 short, concrete follow-up questions to move the deal forward.
3. Think like a trade assistant, not a seller:
   - Clarify: product, quantity & period, delivery port/Incoterm, payment method, bank profile, timing, and user's role (buyer / seller / broker).
   - Do NOT give prices or binding offers.
   - If procedures look unrealistic or high-risk, gently warn about it, but stay neutral.
4. Output FORMAT (adapt to the user's language, but keep this structure):

- Quick acknowledgement (1 short sentence).
- "Summary:" section with bullet points of what they want.
- "Missing / unclear:" section listing missing data (even if it's just 1–2 items).
- "Next questions:" numbered list of follow-up questions.

Example (in Turkish):
- Özet:
  - Ürün: EN590
  - Miktar: 10.000MT x 12 ay
  - Teslim: Fas, CIF
- Eksik / net olmayan:
  - Banka profili
  - Ödeme enstrümanı
- Sonraki sorular:
  1. Bankanız hangi ülkede ve yaklaşık ölçeği nedir?
  2. Ödeme aracı olarak DLC, SBLC veya başka bir şey mi düşünüyorsunuz?

Do not be wordy. Be clear, concise and practical.
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
    });

    const reply = completion.choices?.[0]?.message?.content || "";

    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI error" });
  }
}
