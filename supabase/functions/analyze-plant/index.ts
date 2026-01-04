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
      console.error("No image provided in request");
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_CLOUD_PROJECT_ID = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID");
    const GOOGLE_CLOUD_REGION = Deno.env.get("GOOGLE_CLOUD_REGION") || "us-central1";
    const GOOGLE_CLOUD_API_KEY = Deno.env.get("GOOGLE_CLOUD_API_KEY");

    if (!GOOGLE_CLOUD_PROJECT_ID || !GOOGLE_CLOUD_API_KEY) {
      console.error("Missing Google Cloud credentials");
      throw new Error("Google Cloud credentials are not configured");
    }

    // Extract base64 data and mime type from data URL
    let base64Data = imageBase64;
    let mimeType = "image/jpeg";
    
    if (imageBase64.startsWith("data:")) {
      const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }

    console.log("Processing image with mime type:", mimeType);
    console.log("Image data length:", base64Data.length);

    // Vertex AI Gemini API endpoint
    const vertexEndpoint = `https://${GOOGLE_CLOUD_REGION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT_ID}/locations/${GOOGLE_CLOUD_REGION}/publishers/google/models/gemini-1.5-flash:generateContent?key=${GOOGLE_CLOUD_API_KEY}`;

    const systemPrompt = `You are an expert agricultural scientist and plant pathologist with decades of experience. Your task is to carefully analyze the provided plant leaf image.

CRITICAL INSTRUCTIONS:
1. First, verify if the image actually contains a plant leaf or plant part that can be analyzed.
2. If the image is blurry, too dark, too bright, or the plant is not clearly visible, you MUST indicate this.
3. If the image does not contain a plant at all (e.g., random objects, animals, text), you MUST indicate this.
4. Analyze the SPECIFIC visible symptoms in THIS particular image - do NOT give generic responses.
5. Look for specific patterns: color changes, spots, wilting, holes, discoloration patterns, texture changes.

RESPONSE FORMAT - You MUST respond with a valid JSON object (no markdown, no code blocks):

If the image IS analyzable and contains a plant with visible issues:
{
  "isAnalyzable": true,
  "problemName": "Specific disease/pest/deficiency name based on visible symptoms",
  "confidence": [0-100 based on symptom clarity and your certainty],
  "cause": "Clear explanation of what caused this specific problem based on visible symptoms",
  "organicTreatment": "Detailed organic treatment with specific instructions",
  "chemicalTreatment": "Chemical options with product recommendations and application methods",
  "preventionTips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"],
  "severity": "low" | "medium" | "high"
}

If the plant appears healthy with no issues:
{
  "isAnalyzable": true,
  "problemName": "Healthy Plant",
  "confidence": [confidence level],
  "cause": "No visible signs of disease, pest damage, or nutrient deficiency detected",
  "organicTreatment": "Continue current care practices. Maintain proper watering and nutrition.",
  "chemicalTreatment": "No chemical treatment needed for healthy plants.",
  "preventionTips": ["Regular monitoring", "Proper watering schedule", "Adequate sunlight", "Balanced fertilization", "Good air circulation"],
  "severity": "low"
}

If the image is NOT analyzable (blurry, dark, no plant visible, wrong subject):
{
  "isAnalyzable": false,
  "problemName": "Unable to Analyze",
  "confidence": 0,
  "cause": "[Specific reason - e.g., 'The image is too blurry to identify plant features' OR 'No plant is visible in this image' OR 'The image is too dark to see the plant clearly' OR 'This appears to be [non-plant object] rather than a plant']",
  "organicTreatment": "Please take a new photo with: good lighting, close-up of the affected leaf, camera in focus",
  "chemicalTreatment": "Unable to recommend treatment without a clear plant image",
  "preventionTips": ["Use natural daylight", "Hold camera steady", "Focus on the affected area", "Include both healthy and affected parts if possible", "Avoid shadows on the leaf"],
  "severity": "low"
}

Remember: Analyze ONLY what you can SEE in this specific image. Be accurate and specific.`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: systemPrompt
            },
            {
              text: "Analyze this plant leaf image carefully. Describe exactly what you see and provide an accurate diagnosis based on the visible symptoms. If you cannot analyze it properly, explain why."
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };

    console.log("Sending request to Vertex AI...");
    
    const response = await fetch(vertexEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Vertex AI response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vertex AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "Authentication failed. Please check your Google Cloud credentials." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Vertex AI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Vertex AI response received");
    
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("No content in Vertex AI response:", JSON.stringify(data));
      throw new Error("No response from AI model");
    }

    console.log("AI Response content:", content.substring(0, 500));

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
      cleanContent = cleanContent.trim();
      
      diagnosis = JSON.parse(cleanContent);
      console.log("Successfully parsed diagnosis:", diagnosis.problemName, "Confidence:", diagnosis.confidence);
      
      // Validate required fields
      if (!diagnosis.problemName || diagnosis.confidence === undefined) {
        throw new Error("Missing required fields in AI response");
      }
      
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, "Content:", content);
      // Return a fallback "unable to analyze" response
      diagnosis = {
        isAnalyzable: false,
        problemName: "Unable to Analyze",
        confidence: 0,
        cause: "We encountered an issue processing the image. Please try uploading a different photo with clear visibility of the plant leaf.",
        organicTreatment: "Please take a new photo with good lighting and ensure the leaf is in focus.",
        chemicalTreatment: "Unable to provide recommendations without a clear analysis.",
        preventionTips: [
          "Use natural daylight for best results",
          "Hold the camera steady to avoid blur",
          "Get close to the affected area",
          "Ensure the leaf fills most of the frame",
          "Try from a different angle"
        ],
        severity: "low"
      };
    }

    // Remove the isAnalyzable field from the response to match the expected interface
    const { isAnalyzable, ...diagnosisResult } = diagnosis;

    return new Response(
      JSON.stringify({ diagnosis: diagnosisResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-plant function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        diagnosis: {
          problemName: "Analysis Error",
          confidence: 0,
          cause: "An error occurred while analyzing your image. Please try again.",
          organicTreatment: "Please try uploading a different image or check your internet connection.",
          chemicalTreatment: "Unable to provide recommendations due to analysis error.",
          preventionTips: [
            "Ensure you have a stable internet connection",
            "Try a smaller image file",
            "Make sure the image is in JPG or PNG format",
            "Refresh the page and try again"
          ],
          severity: "low"
        }
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
