import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { ImageFile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = {
  prompts: 'gemini-2.5-flash',
  images: 'imagen-4.0-generate-001',
  vision: 'gemini-2.5-flash-image-preview',
};

const handleApiError = (error: unknown, context: string): never => {
  console.error(`Error in ${context}:`, error);
  const errorCode = (error as any)?.code || 'UNKNOWN';
  throw new Error(`AI service error in ${context} (code: ${errorCode}). Please try again.`);
};

/**
 * Generates a list of example prompts for a given context.
 * @param context The context for which to generate prompts.
 * @param image Optional image data for context-specific prompts.
 * @returns A promise that resolves to an array of prompt strings.
 */
export const generateExamplePrompts = async (
  context: 'generation' | 'editing' | 'multi-editing',
  image?: { data: string; mimeType: string }
): Promise<string[]> => {
  try {
    let systemInstruction = '';
    let userPrompt: any = '';

    switch (context) {
      case 'generation':
        systemInstruction = "You are an AI assistant that generates creative and diverse prompts for an image generation model. Provide 4 concise, interesting, and visually rich prompts. Do not use markdown or numbering. Each prompt should be on a new line.";
        userPrompt = "Give me 4 example prompts for generating images.";
        break;
      case 'editing':
        systemInstruction = "You are an expert AI photo analyst. Your task is to analyze the provided image and suggest 4 creative and interesting editing ideas. The suggestions should be concise, inspiring, and directly applicable as prompts for an image editing AI. Examples: 'Turn the sky into a swirling galaxy', 'Add a majestic dragon flying in the background', 'Apply a vintage, sepia-toned filter', 'Make it look like a detailed watercolor painting'. Do not use markdown or numbering. Each prompt must be on a new line.";
        userPrompt = image
          ? { parts: [{ inlineData: { data: image.data, mimeType: image.mimeType } }, { text: "Analyze this photo and give me 4 creative editing prompts." }] }
          : "Give me 4 generic example prompts for editing a photo, like 'make it black and white' or 'change the background to a beach'.";
        break;
      case 'multi-editing':
        systemInstruction = "You are an AI assistant that generates creative prompts for editing multiple images at once. The prompts should suggest actions that can be applied consistently across a set of images, like applying a uniform style or creating a themed collage. Provide 4 concise examples. Examples: 'Apply a consistent vintage film look to all images', 'Create a futuristic sci-fi poster from these images', 'Turn them all into black and white charcoal sketches', 'Arrange them into a dynamic comic book layout'. Do not use markdown or numbering. Each prompt must be on a new line.";
        userPrompt = "Give me 4 example prompts for editing a batch of photos, such as creating a collage or applying a uniform color grade.";
        break;
    }

    const response = await ai.models.generateContent({
      model: models.prompts,
      contents: userPrompt,
      config: { systemInstruction, temperature: 1 },
    });

    return response.text.trim().split('\n').filter(p => p.trim() !== '');
  } catch (error) {
    console.error("Error generating example prompts:", error);
    return [
      "A cyberpunk cityscape at night, neon lights reflecting on wet streets.",
      "Make the sky look like a galaxy.",
      "Create a photo collage from the images.",
      "A surreal painting of a clock melting on a tree branch."
    ];
  }
};

/**
 * Generates an image based on a prompt, aspect ratio, and style.
 * @param prompt The text prompt for image generation.
 * @param aspectRatio The desired aspect ratio of the image.
 * @param style The artistic style to apply.
 * @returns A promise that resolves to the generated ImageFile.
 */
export const generateImage = async (prompt: string, aspectRatio: string, style: string): Promise<ImageFile> => {
  try {
    const mimeType = 'image/png';
    const finalPrompt = style === 'none' ? prompt : `${prompt}, in the style of ${style}`;

    const response = await ai.models.generateImages({
      model: models.images,
      prompt: finalPrompt,
      config: { numberOfImages: 1, outputMimeType: mimeType, aspectRatio },
    });
    
    const { image } = response.generatedImages[0];
    return { data: image.imageBytes, mimeType, url: `data:${mimeType};base64,${image.imageBytes}` };
  } catch (error) {
    handleApiError(error, 'image generation');
  }
};

/**
 * Edits an image based on a prompt and an optional mask.
 * @param prompt The editing instruction.
 * @param image The image to edit.
 * @param mask An optional mask to specify the editing area.
 * @returns A promise that resolves to an object containing the edited image and/or text.
 */
export const editImage = async (
  prompt: string,
  image: { data: string; mimeType: string },
  mask: { data: string; mimeType: string } | null = null
): Promise<{ text?: string; image?: ImageFile }> => {
  try {
    const parts: any[] = [{ inlineData: { data: image.data, mimeType: image.mimeType } }];
    let finalPrompt = prompt;

    if (mask) {
      parts.push({ inlineData: { data: mask.data, mimeType: mask.mimeType } });
      finalPrompt = `You are an expert photo editor. The user has provided an image, a black-and-white mask, and a prompt. Apply the edit request ONLY to the white area of the mask. Do not change any other part of the image. The black area of the mask must remain untouched. User's request: "${prompt}"`;
    }
    
    parts.push({ text: finalPrompt });

    const response = await ai.models.generateContent({
      model: models.vision,
      contents: { parts },
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    const result: { text?: string; image?: ImageFile } = {};
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        result.text = part.text;
      } else if (part.inlineData) {
        const { mimeType, data } = part.inlineData;
        result.image = { data, mimeType, url: `data:${mimeType};base64,${data}` };
      }
    }
    return result;
  } catch (error) {
    handleApiError(error, 'image editing');
  }
};

/**
 * Edits multiple images based on a single prompt.
 * @param prompt The editing instruction to apply to all images.
 * @param images An array of images to edit.
 * @returns A promise that resolves to an object containing the edited image and/or text.
 */
export const editMultipleImages = async (
  prompt: string,
  images: { data: string; mimeType: string }[]
): Promise<{ text?: string; image?: ImageFile }> => {
  try {
    const parts = [
      ...images.map(image => ({ inlineData: { data: image.data, mimeType: image.mimeType } })),
      { text: prompt },
    ];

    const response = await ai.models.generateContent({
      model: models.vision,
      contents: { parts },
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    const result: { text?: string; image?: ImageFile } = {};
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        result.text = part.text;
      } else if (part.inlineData) {
        const { mimeType, data } = part.inlineData;
        result.image = { data, mimeType, url: `data:${mimeType};base64,${data}` };
      }
    }
    return result;
  } catch (error) {
    handleApiError(error, 'multiple image editing');
  }
};