import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ImageFile } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Generates an image based on a text prompt.
 * @param prompt The user's text description.
 * @param aspectRatio The desired aspect ratio for the image.
 * @param style The artistic style to apply.
 * @returns A promise that resolves to the generated ImageFile.
 */
export const generateImage = async (prompt: string, aspectRatio: string, style: string): Promise<ImageFile> => {
  let fullPrompt = prompt;
  const styleEnhancers: { [key: string]: string } = {
    'photorealistic': 'photorealistic, hyper-detailed, 8k, high quality',
    'cinematic': 'cinematic lighting, dramatic atmosphere, epic, high quality',
    'anime': 'anime style, vibrant, studio quality',
    'watercolor': 'watercolor painting, soft wash, delicate',
    'fantasy': 'epic fantasy art, detailed, mythical, enchanting',
    'surrealism': 'surrealist painting, dreamlike, bizarre, imaginative',
    'steampunk': 'steampunk style, intricate gears and cogs, victorian futurism',
    'minimalist': 'minimalist design, clean lines, simple, elegant',
  };

  if (style !== 'none' && styleEnhancers[style]) {
    fullPrompt = `${prompt}, ${styleEnhancers[style]}`;
  }

  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error('Image generation failed: No image returned from API.');
    }

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    const url = `data:image/png;base64,${base64ImageBytes}`;

    return {
      url,
      data: base64ImageBytes,
      mimeType: 'image/png',
    };
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image. Please check the prompt or try again later.");
  }
};

/**
 * Edits a single image based on a text prompt.
 * @param image The image to be edited.
 * @param prompt The editing instruction.
 * @returns A promise that resolves to the edited ImageFile.
 */
export const editImage = async (image: ImageFile, prompt: string): Promise<ImageFile> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          { inlineData: { data: image.data, mimeType: image.mimeType } },
          { text: prompt },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
          systemInstruction: "You are a world-class AI photo editor. The user provides an image and a text prompt. Your primary goal is to execute the user's instruction precisely while preserving the original image's realism and style, unless explicitly asked to change it. Focus on photorealistic modifications. Strictly output only the edited image in the required modality. Do not add any conversational text, descriptions, or apologies in the text part of the response. If you cannot fulfill the request, you may explain why in a short text response instead of providing an image."
      },
    });

    const editedImagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (!editedImagePart || !editedImagePart.inlineData) {
      const textResponse = response.text;
      const errorMessage = textResponse ? `Editing failed: ${textResponse}` : 'Editing failed: No image returned from API.';
      throw new Error(errorMessage);
    }
    
    const base64ImageBytes: string = editedImagePart.inlineData.data;
    const mimeType = editedImagePart.inlineData.mimeType;
    const url = `data:${mimeType};base64,${base64ImageBytes}`;

    return { url, data: base64ImageBytes, mimeType };
  } catch (error) {
    console.error("Error editing image:", error);
    if (error instanceof Error) throw error;
    throw new Error("Failed to edit image. The model might not be able to fulfill this request.");
  }
};

/**
 * Upscales an image to a higher resolution and enhances details.
 * @param image The image to be upscaled.
 * @returns A promise that resolves to the upscaled ImageFile.
 */
export const upscaleImage = async (image: ImageFile): Promise<ImageFile> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          { inlineData: { data: image.data, mimeType: image.mimeType } },
          { text: "Upscale this image, enhancing its resolution and sharpening details. Do not change the content or style." },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
          systemInstruction: "You are an AI image upscaling and enhancement specialist. The user provides an image. Your task is to increase its resolution, sharpen details, and improve overall clarity and quality. You must preserve the original image's content, composition, and artistic style perfectly. Do not add, remove, or alter any elements. Strictly output only the enhanced image in the required modality. Do not include any text in the response."
      },
    });

    const editedImagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (!editedImagePart || !editedImagePart.inlineData) {
      const textResponse = response.text;
      const errorMessage = textResponse ? `Upscaling failed: ${textResponse}` : 'Upscaling failed: No image returned from API.';
      throw new Error(errorMessage);
    }
    
    const base64ImageBytes: string = editedImagePart.inlineData.data;
    const mimeType = editedImagePart.inlineData.mimeType;
    const url = `data:${mimeType};base64,${base64ImageBytes}`;

    return { url, data: base64ImageBytes, mimeType };
  } catch (error) {
    console.error("Error upscaling image:", error);
    if (error instanceof Error) throw error;
    throw new Error("Failed to upscale image. The model might not be able to fulfill this request.");
  }
};


/**
 * Edits and combines MULTIPLE images based on a text prompt into a single image.
 * @param images An array of images to be processed.
 * @param prompt The instruction for combining or editing the images.
 * @returns A promise that resolves to the final composed ImageFile.
 */
export const editWithMultipleImages = async (images: ImageFile[], prompt: string): Promise<ImageFile> => {
    try {
        const imageParts = images.map(image => ({
            inlineData: { data: image.data, mimeType: image.mimeType }
        }));

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [ ...imageParts, { text: prompt } ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                systemInstruction: "You are a master digital artist specializing in photo composition. The user will provide multiple images and a text prompt. Your task is to creatively combine, blend, or composite these images into a single, cohesive new image based on the user's request. Pay close attention to lighting, perspective, and style to ensure the final result is seamless. Strictly output only the final composed image in the required modality. Do not add any conversational text, descriptions, or apologies in the text part of the response. If the request is impossible, you may explain why in a short text response."
            },
        });

        const editedImagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

        if (!editedImagePart || !editedImagePart.inlineData) {
            const textResponse = response.text;
            const errorMessage = textResponse ? `Editing failed: ${textResponse}` : 'Editing failed: No image returned from API.';
            throw new Error(errorMessage);
        }

        const base64ImageBytes: string = editedImagePart.inlineData.data;
        const mimeType = editedImagePart.inlineData.mimeType;
        const url = `data:${mimeType};base64,${base64ImageBytes}`;

        return { url, data: base64ImageBytes, mimeType };
    } catch (error) {
        console.error("Error editing with multiple images:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to process images. The model might not be able to fulfill this request.");
    }
};

/**
 * A helper function to generate prompts and parse the expected JSON output.
 * @param prompt The system prompt for the AI.
 * @param contents Optional content (like images) to send along with the prompt.
 * @returns A promise that resolves to an array of string prompts.
 */
const generateJsonPrompts = async (prompt: string, contents?: { parts: any[] }): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents || prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { prompts: { type: Type.ARRAY, items: { type: Type.STRING } } },
                    required: ['prompts'],
                },
            },
        });
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed.prompts && Array.isArray(parsed.prompts) ? parsed.prompts.slice(0, 4) : [];
    } catch (error) {
        console.error("Error generating example prompts:", error);
        return []; // Return empty on error to avoid showing fallback prompts that might be irrelevant
    }
}

/**
 * Generates a list of generic example prompts for image generation.
 */
export const generateGenericExamplePrompts = async (): Promise<string[]> => {
    const fallback = [
        "A majestic griffin soaring over a futuristic city, cinematic lighting",
        "An enchanted library inside a giant, ancient tree, fantasy art",
        "A cute robot serving tea to a cat in a steampunk cafe",
        "Abstract painting of a jazz musician's soul, vibrant colors",
    ];
    const prompts = await generateJsonPrompts("Generate 4 diverse, imaginative, and visually descriptive prompts for an AI image generator. Each prompt must be a short phrase. Include a mix of styles like photorealistic, fantasy, sci-fi, and abstract art.");
    return prompts.length > 0 ? prompts : fallback;
};

/**
 * Generates contextual editing prompts based on an image's content.
 */
export const generateContextualEditingPrompts = async (image: ImageFile): Promise<string[]> => {
    const fallback = [
        "Make the sky look like a galaxy",
        "Add a small, friendly dragon on the shoulder",
        "Change the season to autumn",
        "Turn this into a vintage photograph",
    ];
    const contents = {
        parts: [
            { inlineData: { data: image.data, mimeType: image.mimeType } },
            { text: "Analyze this image's main subject, setting, and style. Generate 4 creative, short editing prompts that are highly relevant to the image content. Suggestions should be actionable and interesting (e.g., 'change the season to winter', 'add a reflection in the water', 'make the lighting more dramatic')." }
        ]
    };
    const prompts = await generateJsonPrompts("", contents);
    return prompts.length > 0 ? prompts : fallback;
};


/**
 * Generates example prompts for multi-image editing scenarios.
 */
export const generateMultiImageExamplePrompts = async (): Promise<string[]> => {
    const fallback = [
        "Create a collage of these images",
        "Merge these photos into a single landscape",
        "Take the person from the first image and add them to the second",
        "Blend these images together with a dreamlike effect"
    ];
    const prompts = await generateJsonPrompts("Generate 4 short, creative prompts for combining multiple images. The prompts should suggest actions like creating a seamless photo-merge, building a narrative collage, swapping faces or objects, or blending textures and styles between the images.");
    return prompts.length > 0 ? prompts : fallback;
};