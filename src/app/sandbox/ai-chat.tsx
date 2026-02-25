"use client";

import { useState, useRef, useEffect } from "react";
import type { SiteSettings } from "@/lib/settings";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  changes?: Partial<SiteSettings> | null;
  timestamp: Date;
}

interface AiChatProps {
  secret: string;
  onSettingsChange: (settings: SiteSettings) => void;
}

export default function AiChat({ secret, onSettingsChange }: AiChatProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = messages.map((m) => ({
      role: m.role,
      content: m.role === "assistant" ? JSON.stringify({ message: m.content, changes: m.changes || null }) : m.content,
    }));

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message || "Something went wrong.",
        changes: data.changes,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.currentSettings) {
        onSettingsChange(data.currentSettings);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Network error. Please check your connection and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const changeKeys = (changes: Partial<SiteSettings>) =>
    Object.entries(changes)
      .map(([k, v]) => `${formatKey(k)} → ${typeof v === "boolean" ? (v ? "on" : "off") : v}`)
      .join(", ");

  const formatKey = (key: string) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 active:scale-95 ${
          open
            ? "bg-[#71717a] text-white rotate-0"
            : "bg-[#0a0a0a] text-white hover:bg-[#171717] hover:shadow-xl hover:scale-105"
        }`}
        title="AI Assistant"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a8 8 0 0 1 8 8c0 3.3-2 6.2-5 7.5V20a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2.5C6 16.2 4 13.3 4 10a8 8 0 0 1 8-8z" />
            <line x1="10" y1="22" x2="14" y2="22" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed bottom-20 right-6 z-50 w-[380px] transition-all duration-300 origin-bottom-right ${
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bg-white border border-[#e4e4e7] rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: "520px" }}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#f4f4f5] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[14px] font-semibold tracking-tight">AI Assistant</span>
              <span className="text-[10px] text-[#a1a1aa] bg-[#f4f4f5] px-2 py-0.5 rounded-full ml-auto">llama 3.3</span>
            </div>
            <p className="text-[11px] text-[#a1a1aa] mt-1">Tell me what to change on your website</p>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-full bg-[#f4f4f5] flex items-center justify-center mx-auto mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a8 8 0 0 1 8 8c0 3.3-2 6.2-5 7.5V20a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2.5C6 16.2 4 13.3 4 10a8 8 0 0 1 8-8z" />
                  </svg>
                </div>
                <p className="text-[12px] text-[#a1a1aa] mb-4">Try saying:</p>
                <div className="space-y-2">
                  {[
                    "Change the headline to \"AI news, simplified.\"",
                    "Disable Reddit and enable Telegram",
                    "Set the send time to 9 AM UTC",
                    "What are the current settings?",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="block w-full text-left text-[12px] text-[#71717a] bg-[#fafafa] hover:bg-[#f4f4f5] px-3 py-2 rounded-lg transition-colors"
                    >
                      &ldquo;{s}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#0a0a0a] text-white rounded-br-md"
                      : "bg-[#f4f4f5] text-[#0a0a0a] rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.changes && Object.keys(msg.changes).length > 0 && (
                    <div className={`mt-2 pt-2 border-t text-[11px] ${
                      msg.role === "user" ? "border-white/20 text-white/70" : "border-[#e4e4e7] text-[#71717a]"
                    }`}>
                      <span className="font-medium">Changed:</span> {changeKeys(msg.changes)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#f4f4f5] px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a1a1aa] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a1a1aa] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a1a1aa] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-[#f4f4f5] shrink-0 bg-white">
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me to change something..."
                disabled={loading}
                className="flex-1 h-9 px-3 rounded-lg border border-[#e4e4e7] bg-[#fafafa] text-[13px] outline-none placeholder:text-[#a1a1aa] focus:border-[#0a0a0a] focus:ring-1 focus:ring-[#0a0a0a] focus:bg-white transition-all duration-200 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-9 w-9 rounded-lg bg-[#0a0a0a] text-white flex items-center justify-center shrink-0 hover:bg-[#171717] active:scale-95 transition-all duration-200 disabled:opacity-30 disabled:cursor-default"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
