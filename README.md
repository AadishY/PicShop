# Aadish's AI PicShop 🎨

Welcome to the AI PicShop, a web application that leverages the power of Google's Gemini AI to provide a suite of powerful tools for image generation and editing. Unleash your creativity by transforming text into stunning visuals, editing your photos with simple instructions, and combining multiple images into new creations.

## ✨ Features

- **AI Image Generation:** Create unique images from text descriptions. Just type your idea, and the AI will bring it to life. You can also provide reference images to guide the generation process.
- **AI Image Editing:** Upload a photo and use simple text prompts to perform powerful edits. Change backgrounds, add objects, alter styles, and more. Use reference images to guide the edits.
- **Multi-Image Editing:** Upload multiple images and apply a single prompt to all of them at once, perfect for creating collages or applying a consistent style across a batch of photos.
- **Free-Form Cropping:** A flexible, free-form cropping tool allows you to select the exact area of an image you want to work with.
- **Follow-up Editing:** Take the result from the image generator or the multi-image editor and send it directly to the single image editor for further refinement.
- **AI-Powered Examples:** Don't know where to start? The app analyzes your uploaded images and provides creative, context-aware example prompts to inspire you.
- **Modern UI:** A clean, responsive, and modern user interface with glassmorphism effects for a beautiful user experience.

## 🚀 Getting Started

To get the AI PicShop running on your local machine, follow these simple steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or later is recommended)
- `npm` or a compatible package manager

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/AadishY/PicShop.git
    cd PicShop
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your API Key:**
    This project requires a Google Gemini API key to function.
    - Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    - In the root of the project, create a new file named `.env.local`.
    - Open the `example.env` file, copy its content, and paste it into your new `.env.local` file.
    - Replace `YOUR_API_KEY` with your actual Gemini API key. The file should look like this:
      ```
      VITE_GEMINI_API_KEY=YOUR_API_KEY
      ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running at `http://localhost:5173`.

## Usage

- **Image Generator:** Navigate to the generator, type a descriptive prompt, add optional reference images, choose an aspect ratio and style, and click "Generate Image".
- **Image Editor:** Upload an image, and then use the controls to provide editing instructions. You can use text, reference images, and style presets to guide the AI. Use the crop tool to focus on a specific area.
- **Multi-Image Editor:** Upload two or more images, provide a prompt for how to combine or edit them, and let the AI create a new result.

---

Enjoy creating with the AI PicShop!
