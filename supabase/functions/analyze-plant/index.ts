import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256Base64(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function callLovableAI({
  lovableKey,
  imageDataUrl,
  imageId,
}: {
  lovableKey: string;
  imageDataUrl: string;
  imageId: string;
}) {
  const systemPrompt = `You are an expert agricultural scientist and plant pathologist.

You MUST analyze ONLY the provided image. Do not reuse previous answers. Treat every request as unique.

First, validate the input image:
- If no plant/leaf is visible OR the image is too blurry/dark/overexposed to inspect symptoms, respond as Unable to Analyze.

Return ONLY valid JSON (no markdown, no code blocks) in this shape:
{
  "problemName": string,
  "confidence": number (0-100),
  "cause": string,
  "organicTreatment": string,
  "chemicalTreatment": string,
  "preventionTips": string[],
  "severity": "low" | "medium" | "high"
}

CONFIDENCE SCORING RULES (critical - be realistic):
- 90-100%: Only for textbook-perfect symptoms with classic, unmistakable visual markers
- 75-89%: Clear symptoms present but could match 1-2 similar diseases
- 60-74%: Likely diagnosis but symptoms are partial or could indicate multiple issues
- 40-59%: Educated guess based on limited visible evidence
- 20-39%: Very uncertain, early/mild symptoms, or image quality affects clarity
- 0-19%: Unable to analyze or almost no confidence

Rules:
- If image is not analyzable: problemName MUST be "Unable to Analyze" and confidence MUST be 0
- If healthy: problemName MUST be "Healthy Plant", confidence should reflect how clearly healthy it appears (70-95%)
- For diseases: Be conservative. Do NOT default to high confidence. Evaluate actual symptom clarity.
- Be specific to visible symptoms in THIS image.`;

  const userPrompt = `Image ID: ${imageId}
Analyze this plant image. If it is not a clear plant/leaf photo, return Unable to Analyze with the reason and photo retake tips.`;

  // Retry a couple times on 429 to reduce "no more errors" experience.
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    });

    if (resp.status === 429 && attempt < maxAttempts) {
      const backoffMs = 800 * attempt;
      console.warn(`Lovable AI rate limited (429). Retrying in ${backoffMs}ms (attempt ${attempt}/${maxAttempts})`);
      await new Promise((r) => setTimeout(r, backoffMs));
      continue;
    }

    const text = await resp.text();

    if (!resp.ok) {
      console.error("Lovable AI error:", resp.status, text);
      if (resp.status === 429) {
        return {
          ok: false,
          status: 429,
          error: "Rate limit exceeded. Please try again in a moment.",
        };
      }
      if (resp.status === 402) {
        return {
          ok: false,
          status: 402,
          error: "AI credits required. Please add credits to continue.",
        };
      }
      return { ok: false, status: 500, error: "AI service error. Please try again." };
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse AI gateway JSON:", e, text.slice(0, 500));
      return { ok: false, status: 500, error: "AI response parsing error." };
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.error("No content in AI response:", JSON.stringify(data).slice(0, 800));
      return { ok: false, status: 500, error: "No response from AI model." };
    }

    return { ok: true, status: 200, content };
  }

  return { ok: false, status: 429, error: "Rate limit exceeded. Please try again in a moment." };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("Missing LOVABLE_API_KEY");
      return new Response(JSON.stringify({ error: "AI backend is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageId = await sha256Base64(imageBase64.slice(0, 2500));
    console.log("Analyze request imageId:", imageId);

    const ai = await callLovableAI({
      lovableKey: LOVABLE_API_KEY,
      imageDataUrl: imageBase64,
      imageId,
    });

    if (!ai.ok) {
      return new Response(
        JSON.stringify({
          error: ai.error,
          diagnosis: {
            problemName: "Unable to Analyze",
            confidence: 0,
            cause: ai.error,
            organicTreatment:
              "Please try again with a clear close-up photo in good lighting, focused on the leaf.",
            chemicalTreatment: "Unable to recommend treatment without analysis.",
            preventionTips: [
              "Use natural daylight",
              "Hold the camera steady",
              "Focus on the affected area",
              "Avoid shadows and glare",
              "Fill the frame with the leaf",
            ],
            severity: "low",
          },
        }),
        {
          status: ai.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse model JSON
    let diagnosis: any;
    try {
      let clean = String(ai.content).trim();
      if (clean.startsWith("```")) clean = clean.replace(/^```[a-zA-Z]*\n?/, "");
      if (clean.endsWith("```")) clean = clean.replace(/```\s*$/, "");
      diagnosis = JSON.parse(clean);
    } catch (e) {
      console.error("Failed to parse model JSON:", e, String(ai.content).slice(0, 800));
      diagnosis = {
        problemName: "Unable to Analyze",
        confidence: 0,
        cause: "Could not read the analysis. Please try again with a clearer image.",
        organicTreatment:
          "Retake the photo in good light, close-up, with the leaf in focus.",
        chemicalTreatment: "Unable to recommend treatment without a clear analysis.",
        preventionTips: [
          "Use natural daylight",
          "Hold the camera steady",
          "Focus on the affected area",
          "Avoid shadows and glare",
          "Fill the frame with the leaf",
        ],
        severity: "low",
      };
    }

    // Hard validation + normalize
    const normalized = {
      problemName: String(diagnosis?.problemName ?? "Unable to Analyze"),
      confidence: Number.isFinite(Number(diagnosis?.confidence))
        ? Math.max(0, Math.min(100, Number(diagnosis.confidence)))
        : 0,
      cause: String(diagnosis?.cause ?? ""),
      organicTreatment: String(diagnosis?.organicTreatment ?? ""),
      chemicalTreatment: String(diagnosis?.chemicalTreatment ?? ""),
      preventionTips: Array.isArray(diagnosis?.preventionTips)
        ? diagnosis.preventionTips.map((x: any) => String(x)).slice(0, 8)
        : [],
      severity: ((): "low" | "medium" | "high" => {
        const s = String(diagnosis?.severity ?? "low").toLowerCase();
        if (s === "medium" || s === "high") return s;
        return "low";
      })(),
    };

    if (normalized.problemName === "Unable to Analyze") {
      normalized.confidence = 0;
      if (!normalized.cause) {
        normalized.cause =
          "The image is not clear enough to identify plant symptoms. Please retake the photo.";
      }
    }

    return new Response(JSON.stringify({ diagnosis: normalized }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-plant function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        diagnosis: {
          problemName: "Unable to Analyze",
          confidence: 0,
          cause: "An error occurred while analyzing your image. Please try again.",
          organicTreatment:
            "Please try again with a clear photo in good lighting, focused on the leaf.",
          chemicalTreatment: "Unable to recommend treatment without analysis.",
          preventionTips: [
            "Use natural daylight",
            "Hold the camera steady",
            "Focus on the affected area",
            "Avoid shadows and glare",
            "Fill the frame with the leaf",
          ],
          severity: "low",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
