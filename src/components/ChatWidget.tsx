import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Loader2, Mic, MicOff } from "lucide-react";
import botLogo from "@/assets/chatbot-logo.png";
import { languages, LangCode } from "@/i18n/translations";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";

type Msg = { role: "user" | "assistant"; content: string };

const URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/agri-chat`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const SPEECH: Record<LangCode, string> = {
  en: "en-IN", hi: "hi-IN", bn: "bn-IN", es: "es-ES", ta: "ta-IN", te: "te-IN", mr: "mr-IN", gu: "gu-IN",
  kn: "kn-IN", ml: "ml-IN", pa: "pa-IN", or: "or-IN", as: "as-IN", ur: "ur-IN",
};

const ChatWidget = () => {
  const { aiLanguageName, lang } = useLanguage();
  const [voiceLang, setVoiceLang] = useState<LangCode>(lang);
  const [listening, setListening] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState("");
  const recRef = useRef<any>(null);
  useEffect(() => { setVoiceLang(lang); }, [lang]);

  const toggleMic = () => {
    if (listening) { recRef.current?.stop(); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setVoiceMsg("Voice input isn't supported in this browser. Try Chrome."); return; }
    const rec = new SR();
    rec.lang = SPEECH[voiceLang];
    rec.interimResults = true;
    rec.continuous = false;
    const base = input ? input.trim() + " " : "";
    rec.onresult = (e: any) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInput(base + t);
    };
    rec.onerror = (e: any) => {
      setVoiceMsg(e.error === "not-allowed" ? "Please allow microphone access to speak." :
        e.error === "no-speech" ? "Didn't hear anything. Tap the mic and try again." : "Couldn't hear you. Please try again.");
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setVoiceMsg("");
    setListening(true);
    rec.start();
  };
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "🌱 Hi! I'm your farming assistant. Ask me anything about crops, soil, pests, fertilizers or irrigation." },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const history: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    const setLast = (content: string) =>
      setMessages((m) => [...m.slice(0, -1), { role: "assistant", content }]);
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ messages: history.slice(1).slice(-20), language: aiLanguageName }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        setLast(`⚠️ ${err.error ?? "The assistant is unavailable right now. Please try again."}`);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", out = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const ev = JSON.parse(data);
            if (ev.type === "response.output_text.delta" && ev.delta) {
              out += ev.delta;
              setLast(out);
            } else if (ev.type === "response.failed" || ev.type === "error") {
              setLast(out || "⚠️ Sorry, I couldn't answer that. Please try again.");
            }
          } catch { /* partial */ }
        }
      }
      if (!out) setLast("⚠️ Sorry, I couldn't answer that. Please try again.");
    } catch {
      setLast("⚠️ Couldn't connect. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[70vh] max-h-[560px] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground">
              <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center overflow-hidden">
                <img src={botLogo} alt="" width={36} height={36} className="w-9 h-9 object-contain" />
              </div>
              <div className="flex-1">
                <p className="font-semibold leading-tight">Farming Assistant</p>
                <p className="text-xs opacity-80">Ask any farming question</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="p-1 rounded hover:bg-primary-foreground/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3 py-2 text-sm"
                        : "max-w-[90%] text-sm text-foreground prose prose-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0"
                    }
                  >
                    {m.role === "assistant" && !m.content ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : m.role === "assistant" ? (
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="flex items-center gap-2 px-3 pt-2 bg-card text-xs text-muted-foreground border-t border-border">
              <label htmlFor="voice-lang">🎙️ Speak in:</label>
              <select
                id="voice-lang"
                value={voiceLang}
                onChange={(e) => setVoiceLang(e.target.value as LangCode)}
                className="rounded-md border border-input bg-background px-2 py-1 text-foreground"
              >
                {languages.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
              </select>
              {listening && <span className="text-primary font-medium animate-pulse">Listening...</span>}
            </div>
            {voiceMsg && <p className="px-3 pt-1 text-xs text-destructive bg-card">{voiceMsg}</p>}
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex items-end gap-2 p-3 bg-card"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                maxLength={2000}
                placeholder="Type your question..."
                className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-28"
              />
              <Button
                type="button"
                size="icon"
                variant={listening ? "destructive" : "outline"}
                onClick={toggleMic}
                aria-label={listening ? "Stop listening" : "Speak your question"}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close farming assistant" : "Open farming assistant"}
        className="fixed bottom-5 right-4 sm:right-6 z-50 w-16 h-16 rounded-full bg-card border-2 border-primary shadow-xl flex items-center justify-center overflow-hidden"
      >
        {open ? <X className="w-6 h-6 text-primary" /> : <img src={botLogo} alt="" width={56} height={56} className="w-14 h-14 object-contain" />}
      </motion.button>
    </>
  );
};

export default ChatWidget;
