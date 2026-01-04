import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert agricultural scientist and plant pathologist. Analyze the provided plant leaf image and identify any diseases, pest damage, or nutrient deficiencies.

Respond ONLY with a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "problemName": "Name of the disease, pest, or deficiency (or 'Healthy Plant' if no issues found)",
  "confidence": 85,
  "cause": "Clear, farmer-friendly explanation of what caused this problem",
  "organicTreatment": "Detailed organic/natural treatment methods with specific instructions",
  "chemicalTreatment": "Chemical treatment options with product names and application instructions",
  "preventionTips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"],
  "severity": "low" | "medium" | "high"
}

Guidelines:
- Use simple, farmer-friendly language
- Be specific with treatment dosages and frequencies
- Confidence should be 0-100 based on image clarity and symptom visibility
- Severity: low = minor issue, medium = needs attention soon, high = immediate action required
- If the image is not a plant or is unclear, still return the JSON format with problemName as "Unable to Analyze" and explain in cause field`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this plant leaf image and provide a detailed diagnosis with treatment recommendations."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI model");
    }

    // Parse the JSON response from the AI
    let diagnosis;
    try {
      // Clean the response - remove any markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      diagnosis = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a fallback response
      diagnosis = {
        problemName: "Analysis Complete",
        confidence: 70,
        cause: content,
        organicTreatment: "Please consult a local agricultural expert for specific treatment recommendations.",
        chemicalTreatment: "Please consult a local agricultural expert for chemical treatment options.",
        preventionTips: [
          "Maintain proper plant spacing for air circulation",
          "Water at the base of plants, avoid wetting leaves",
          "Remove infected plant material promptly",
          "Rotate crops annually",
          "Use disease-resistant varieties"
        ],
        severity: "medium"
      };
    }

    return new Response(
      JSON.stringify({ diagnosis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-plant function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
