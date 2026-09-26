import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const cors = { ...corsHeaders, "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (b: unknown, status: number) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
  try {
    const { messages, language } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) return json({ error: "Invalid messages" }, 400);
    const clean = messages
      .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    const lang = typeof language === "string" && language.length < 40 ? language : "English";
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured" }, 500);

    const system = `You are AgriScan Assistant, a friendly farming expert helping farmers. Answer only agriculture-related questions (crops, soil, pests, plant diseases, fertilizers, irrigation, weather for farming, livestock, organic farming, market tips). If a question is not about agriculture, politely say you can only help with farming topics. Use simple, jargon-free words, short paragraphs and bullet points. When suggesting treatments, give safe organic options first, then chemical options with safety precautions. Always reply in ${lang}.`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      signal: req.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: system,
        input: clean,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
      }),
    });
    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("gateway error", upstream.status, t);
      const msg = upstream.status === 429 ? "Too many questions right now. Please wait a moment." :
        upstream.status === 402 ? "AI credits have run out. Please try again later." : "The assistant is unavailable right now.";
      return json({ error: msg }, upstream.status);
    }
    const headers = new Headers({ ...cors, "Content-Type": "text/event-stream" });
    const rid = upstream.headers.get("X-Lovable-AIG-Run-ID");
    if (rid) headers.set("X-Lovable-AIG-Run-ID", rid);
    return new Response(upstream.body, { headers });
  } catch (e) {
    if (req.signal.aborted) return new Response(null, { status: 499, headers: cors });
    console.error(e);
    return json({ error: "Something went wrong" }, 500);
  }
});
