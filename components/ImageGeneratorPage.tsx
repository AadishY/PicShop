import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImageFile } from '../types';
import { Page } from '../App';
import { generateImage, generateGenericExamplePrompts, upscaleImage } from '../services/geminiService';
import LoadingPlaceholder from './LoadingPlaceholder';
import LoadingSpinner from './LoadingSpinner';
import { Button, Card } from './ui';
import { DownloadIcon, EditIcon, NewSessionIcon, ImageIcon, RefreshIcon, SparklesIcon } from './Icons';

const loadingMessages = [
    "Warming up the AI's imagination...",
    "Translating your prompt into a masterpiece...",
    "The AI is painting with pixels...",
    "Adding the finishing touches...",
    "Almost there, just polishing the details..."
];

interface ImageGeneratorPageProps {
  navigate: (page: Page, image?: ImageFile) => void;
}

const ImageGeneratorPage: React.FC<ImageGeneratorPageProps> = ({ navigate }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [style, setStyle] = useState('none');
  const [generatedImage, setGeneratedImage] = useState<ImageFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [error, setError] = useState<string | null>(null);
  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const messageIntervalRef = useRef<number | null>(null);

  const fetchPrompts = useCallback(async () => {
    setLoadingPrompts(true);
    setError(null);
    try {
        const prompts = await generateGenericExamplePrompts();
        setExamplePrompts(prompts);
    } catch (err) {
        setError((err as Error).message || 'Failed to load suggestions.');
    } finally {
        setLoadingPrompts(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  useEffect(() => {
    return () => {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
    };
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    setLoadingMessage(loadingMessages[0]);
    let messageIndex = 0;
    messageIntervalRef.current = window.setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 2500);

    try {
      const image = await generateImage(prompt, aspectRatio, style);
      setGeneratedImage(image);
    } catch (err) {
      setError((err as Error).message || 'An unknown error occurred.');
    } finally {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
      setIsLoading(false);
    }
  };
  
  const handleUpscale = async () => {
    if (!generatedImage) return;
    setIsUpscaling(true);
    setError(null);
    try {
        const upscaledImage = await upscaleImage(generatedImage);
        setGeneratedImage(upscaledImage);
    } catch (err) {
        setError((err as Error).message || 'Upscaling failed.');
    } finally {
        setIsUpscaling(false);
    }
  };

  const handleStartNew = () => {
    setGeneratedImage(null);
    setPrompt('');
    setError(null);
  };
  
  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage.url;
    link.download = 'generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
  const styles = ['none', 'photorealistic', 'cinematic', 'anime', 'watercolor', 'fantasy', 'surrealism', 'steampunk', 'minimalist'];

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Image Generator</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <Card className="p-6 sm:p-8 flex flex-col gap-6">
          {!generatedImage ? (
            <>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">Prompt</label>
                  <Button variant="ghost" size="sm" onClick={fetchPrompts} disabled={loadingPrompts || isLoading}>
                      <RefreshIcon className={`w-4 h-4 mr-2 ${loadingPrompts ? 'animate-spin' : ''}`}/> Inspire Me
                  </Button>
                </div>
                <textarea
                  id="prompt"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg text-white p-3 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition placeholder:text-gray-500"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A majestic lion wearing a crown, cinematic lighting"
                />
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Or try an example:</h4>
                {loadingPrompts ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <LoadingSpinner className="w-4 h-4" />
                    <span>Loading examples...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.map((p, i) => (
                      <button key={i} onClick={() => setPrompt(p)} className="text-sm bg-white/10 hover:bg-white/20 text-gray-200 px-3 py-1.5 rounded-full transition-colors">
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                  <select
                    id="aspectRatio"
                    className="w-full bg-white/5 border border-white/10 rounded-lg text-white p-3 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                  >
                    {aspectRatios.map(ar => <option key={ar} value={ar} className="bg-[#0B0F19]">{ar}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="style" className="block text-sm font-medium text-gray-300 mb-2">Style</label>
                  <select
                    id="style"
                    className="w-full bg-white/5 border border-white/10 rounded-lg text-white p-3 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  >
                    {styles.map(s => <option key={s} value={s} className="capitalize bg-[#0B0F19]">{s}</option>)}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                isLoading={isLoading}
                loadingText={loadingMessage}
                className="w-full mt-2"
                size="lg"
              >
                Generate Image
              </Button>
              {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
            </>
          ) : (
            <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-white">Your Masterpiece</h3>
                <p className="text-gray-300">Download your image, enhance its quality, or send it to the editor for more detailed changes.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <Button onClick={handleDownload} variant="secondary" disabled={isLoading || isUpscaling}>
                        <DownloadIcon className="w-5 h-5 mr-2" /> Download
                    </Button>
                    <Button 
                        onClick={handleUpscale} 
                        variant="secondary" 
                        className="relative" 
                        isLoading={isUpscaling} 
                        loadingText="Upscaling..." 
                        disabled={isLoading || isUpscaling}
                    >
                       <SparklesIcon className="w-5 h-5 mr-2" /> Upscale
                       <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">BETA</span>
                    </Button>
                    <Button onClick={() => navigate(Page.EDITOR, generatedImage)} className="sm:col-span-2" disabled={isLoading || isUpscaling}>
                        <EditIcon className="w-5 h-5 mr-2" />
                        Follow-up Edit
                    </Button>
                </div>
                 <Button onClick={handleStartNew} variant="ghost" className="w-full mt-2" disabled={isLoading || isUpscaling}>
                    <NewSessionIcon className="w-5 h-5 mr-2" />
                    Start New Session
                </Button>
            </div>
          )}
        </Card>

        <Card className="w-full aspect-square overflow-hidden p-2">
          <div className="w-full h-full rounded-lg flex items-center justify-center bg-black/20 overflow-hidden">
            {isLoading ? (
              <LoadingPlaceholder message={loadingMessage} />
            ) : generatedImage ? (
              <img src={generatedImage.url} alt={prompt || 'Generated image'} className="object-contain w-full h-full" />
            ) : (
              <div className="text-center text-gray-500 p-4">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-600"/>
                Your generated image will appear here.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ImageGeneratorPage;