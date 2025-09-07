import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { ImageFile } from "../types";

// Initialize the Google Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateExamplePrompts = async (context: 'generation' | 'editing' | 'multi-editing', image?: {data: string, mimeType: string}): Promise<string[]> => {
    try {
        let systemInstruction = '';
        let userPrompt: any = '';

        switch(context) {
            case 'generation':
                systemInstruction = "You are an AI assistant that generates creative and diverse prompts for an image generation model. Provide 4 concise, interesting, and visually rich prompts. Do not use markdown or numbering. Each prompt should be on a new line.";
                userPrompt = "Give me 4 example prompts for generating images.";
                break;
            case 'editing':
                systemInstruction = "You are an AI assistant that generates creative and practical prompts for editing the provided photo. Provide 4 concise and clear editing instructions relevant to the image. Do not use markdown or numbering. Each prompt should be on a new line.";
                if (image) {
                     userPrompt = { parts: [
                        { inlineData: { data: image.data, mimeType: image.mimeType } },
                        { text: "Give me 4 example prompts for editing this photo." }
                    ]};
                } else {
                    userPrompt = "Give me 4 generic example prompts for editing a photo, like 'make it black and white' or 'change the background to a beach'.";
                }
                break;
            case 'multi-editing':
                systemInstruction = "You are an AI assistant that generates creative prompts for editing multiple images at once. The prompts should suggest actions that can be applied consistently across a set of images. Provide 4 concise examples. Do not use markdown or numbering. Each prompt should be on a new line.";
                userPrompt = "Give me 4 example prompts for editing a batch of photos, such as creating a collage or applying a uniform color grade.";
                break;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 1,
            },
        });

        const text = response.text;
        return text.trim().split('\n').filter(p => p.trim() !== '');

    } catch (error) {
        console.error("Error generating example prompts:", error);
        // Return fallback prompts on error
        return [
            "A cyberpunk cityscape at night, neon lights reflecting on wet streets.",
            "Make the sky look like a galaxy.",
            "Create a photo collage from the images.",
            "A surreal painting of a clock melting on a tree branch."
        ];
    }
}

export const generateImage = async (prompt: string, aspectRatio: string, style: string): Promise<ImageFile> => {
  try {
    const mimeType = 'image/png';
    const finalPrompt = style === 'none' ? prompt : `${prompt}, in the style of ${style}`;

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: mimeType,
          aspectRatio: aspectRatio,
        },
    });
    
    const generatedImage = response.generatedImages[0];
    const data = generatedImage.image.imageBytes;

    return {
        data,
        mimeType,
        url: `data:${mimeType};base64,${data}`
    };

  } catch (error) {
    console.error("Error generating image:", error);
    const errorCode = (error as any)?.code || 500;
    throw new Error(`AI service error (code: ${errorCode}). Please try again.`);
  }
};

export const editImage = async (
    prompt: string, 
    image: { data: string, mimeType: string },
    mask: { data: string, mimeType: string } | null = null
): Promise<{ text?: string, image?: ImageFile }> => {
  try {
    let finalPrompt = prompt;
    const parts: any[] = [{
      inlineData: {
        data: image.data,
        mimeType: image.mimeType,
      },
    }];

    if (mask) {
      parts.push({
        inlineData: {
          data: mask.data,
          mimeType: mask.mimeType,
        },
      });
      finalPrompt = `You are an expert photo editor. The user has provided an image, a black-and-white mask, and a prompt. Apply the edit request ONLY to the white area of the mask. Do not change any other part of the image. The black area of the mask must remain untouched. User's request: "${prompt}"`;
    }
    
    parts.push({ text: finalPrompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const result: { text?: string, image?: ImageFile} = {};
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        result.text = part.text;
      } else if (part.inlineData) {
        const mimeType = part.inlineData.mimeType;
        const data = part.inlineData.data;
        result.image = {
          data,
          mimeType,
          url: `data:${mimeType};base64,${data}`
        };
      }
    }
    return result;

  } catch (error) {
    console.error("Error editing image:", error);
    const errorCode = (error as any)?.code || 500;
    throw new Error(`AI service error (code: ${errorCode}). Please try again.`);
  }
};


export const editMultipleImages = async (prompt: string, images: { data: string, mimeType: string }[]): Promise<{ text?: string, image?: ImageFile }> => {
  try {
    const parts = [
      ...images.map(image => ({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      })),
      { text: prompt },
    ];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: parts,
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const result: { text?: string, image?: ImageFile } = {};
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        result.text = part.text;
      } else if (part.inlineData) {
        const mimeType = part.inlineData.mimeType;
        const data = part.inlineData.data;
        result.image = {
          data,
          mimeType,
          url: `data:${mimeType};base64,${data}`
        };
      }
    }
    return result;
  } catch (error) {
    console.error("Error editing multiple images:", error);
    const errorCode = (error as any)?.code || 500;
    throw new Error(`AI service error (code: ${errorCode}). Please try again.`);
  }
};