// Minimal Gemini Flash 2.5 wrapper for the in-app chatbot.
// We hit the public REST endpoint directly from the browser using
// the API key embedded in the Vite build. For a hackathon / jury
// demo this is fine; for real production move it behind a backend
// proxy so the key isn't exposed.

const KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are "Saathi", the friendly assistant for Tribal Mart — an Indian online marketplace that connects tribal cooperatives (Bhil, Santhal, Munda, Gond, Toda, Lambani and others) with conscious buyers. The platform has 4 portals (Customer, Agency, Agent, Admin), supports English + Hindi, uses Razorpay for payments, and gives the platform 10% commission and the agent 5%.

Behaviour rules:
- Reply in 1-3 short sentences unless the user asks for detail.
- If the user asks to track an order, ask for their Order ID.
- If the user mentions "gift", "present", "birthday", "anniversary", or "for someone", suggest they say "show me gifts" and the bot will display curated products from the marketplace.
- If the user asks about prices, returns, payments — give clear, helpful answers grounded in: 7-day return policy, Razorpay UPI/cards/COD, 10% platform commission, free shipping over ₹999.
- Be warm, respectful of tribal artisan communities, and never pretend to be human.
- If the user types in Hindi, reply in Hindi (Devanagari script).
- Don't invent products or order statuses — those come from the marketplace data, not from you.`;

export const isGeminiConfigured = () => Boolean(KEY);

/**
 * Ask Gemini a question. `history` is an array of { role, text } where
 * role is 'user' or 'model'. Returns the model's text reply.
 */
export const askGemini = async (userMessage, history = []) => {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key is not set in frontend/.env');
  }

  // Build the chat in Gemini's expected format
  const contents = [];
  for (const m of history) {
    contents.push({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    });
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 350,
    },
  };

  const url = `${ENDPOINT}?key=${KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      detail = j?.error?.message || detail;
    } catch (_) {}
    throw new Error(`Gemini: ${detail}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  return text.trim() || "I'm here — could you rephrase that?";
};

/**
 * Run a one-shot prompt with no system instruction. Use this when you
 * need structured / deterministic output (e.g. a JSON array of IDs)
 * and don't want Saathi's chatty persona wrapping the answer.
 */
export const askGeminiRaw = async (prompt) => {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key is not set in frontend/.env');
  }
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
  };
  const res = await fetch(`${ENDPOINT}?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const j = await res.json(); detail = j?.error?.message || detail; } catch (_) {}
    throw new Error(`Gemini: ${detail}`);
  }
  const data = await res.json();
  return (data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '').trim();
};

export default askGemini;
