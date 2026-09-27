import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { apiUrl } from "../lib/api";

const STARTERS = [
  "What has the biggest carbon footprint in my weekly shopping?",
  "Why is beef so much worse than chicken?",
  "Is a recycled aluminum can really better than glass?",
  "How much CO₂ does one tree absorb in a year?",
];

async function ask(messages, context, signal) {
  const response = await fetch(apiUrl("/api/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context }),
    signal,
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The assistant is unavailable. Please try again.");
  }
  if (!response.ok) throw new Error(data.error || "The assistant failed. Please try again.");
  return data.reply;
}

export default function ChatPage() {
  const { current } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef(null);
  const end = useRef(null);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const context = current
    ? `${current.name} (${current.category}): ` +
      `${current.impact.co2.toFixed(2)} kg CO2, ${current.impact.water.toFixed(0)} L water, ` +
      `${current.impact.waste.toFixed(2)} kg waste, ${current.impact.energy.toFixed(1)} MJ energy per unit.`
    : "";

  const send = async (text) => {
    const question = text.trim();
    if (!question || busy) return;
    const next = [...messages, { role: "user", text: question }];
    setMessages(next);
    setInput("");
    setError("");
    setBusy(true);
    const c = new AbortController();
    controller.current = c;
    try {
      const reply = await ask(next, context, c.signal);
      setMessages([...next, { role: "model", text: reply }]);
    } catch (err) {
      if (!c.signal.aborted) setError(err.message);
    } finally {
      if (controller.current === c) setBusy(false);
    }
  };

  return (
    <div className="card chat">
      <h2>🌿 Ask me about carbon</h2>
      <p className="mute">
        Learn how emissions work and what your choices change.
        {current && <> Answers can use your last scan: <span className="chip">{current.emoji} {current.name}</span></>}
      </p>

      <div className="chat-log" aria-live="polite">
        {!messages.length && (
          <div className="starters">
            {STARTERS.map((s) => (
              <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role === "user" ? "me" : "bot"}`}>{m.text}</div>
        ))}
        {busy && <div className="bubble bot typing" role="status" aria-label="Assistant is typing"><i /><i /><i /></div>}
        {error && <p role="alert" className="bad">{error}</p>}
        <div ref={end} />
      </div>

      <form className="row chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <input
          className="grow" type="text" value={input} maxLength={500} placeholder="Ask anything about emissions…"
          aria-label="Your question" onChange={(e) => setInput(e.target.value)}
        />
        <button className="primary" type="submit" disabled={busy || !input.trim()}>Send</button>
      </form>
      <p className="mute">AI answers can be wrong. Check important figures against the cited factors in each product's evidence panel.</p>
    </div>
  );
}
