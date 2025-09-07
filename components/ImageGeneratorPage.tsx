import React, { useState, useEffect } from 'react';
import { ImageFile } from '../types';
import { Page } from '../App';
import { generateImage, generateExamplePrompts } from '../services/geminiService';
import LoadingPlaceholder from './LoadingPlaceholder';
import LoadingSpinner from './LoadingSpinner';
import { Button } from './ui';
import { DownloadIcon, EditIcon, NewSessionIcon, SparklesIcon } from './Icons';

interface ImageGeneratorPageProps {
  navigate: (page: Page, image?: ImageFile) => void;
}

const ImageGeneratorPage: React.FC<ImageGeneratorPageProps> = ({ navigate }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [style, setStyle] = useState('none');
  const [generatedImage, setGeneratedImage] = useState<ImageFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);

  useEffect(() => {
    const fetchPrompts = async () => {
      setLoadingPrompts(true);
      const prompts = await generateExamplePrompts('generation');
      setExamplePrompts(prompts);
      setLoadingPrompts(false);
    };
    fetchPrompts();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const image = await generateImage(prompt, aspectRatio, style);
      setGeneratedImage(image);
    } catch (err) {
      setError((err as Error).message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
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
        <div className="flex flex-col gap-6">
          {!generatedImage ? (
            <>
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                <textarea
                  id="prompt"
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-600 rounded-md text-white p-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="e.g., A cat wearing a spacesuit, sitting on the moon"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Try an example:</h4>
                {loadingPrompts ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <LoadingSpinner className="w-4 h-4" />
                    <span>Loading examples...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.map((p, i) => (
                      <button key={i} onClick={() => setPrompt(p)} className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-full transition-colors">
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
                    className="w-full bg-gray-800 border border-gray-600 rounded-md text-white p-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                  >
                    {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="style" className="block text-sm font-medium text-gray-300 mb-2">Style</label>
                  <select
                    id="style"
                    className="w-full bg-gray-800 border border-gray-600 rounded-md text-white p-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  >
                    {styles.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                isLoading={isLoading}
                loadingText="Generating..."
                className="w-full"
                size="lg"
              >
                <SparklesIcon className="w-5 h-5 mr-2" />
                Generate Image
              </Button>
              {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
            </>
          ) : (
            <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-white">Your Masterpiece</h3>
                <p className="text-gray-300">Download your image, start a new session, or send it to the editor for more detailed changes.</p>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                     <Button onClick={handleDownload} variant="secondary" className="w-full">
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Download
                    </Button>
                    <Button onClick={() => navigate(Page.EDITOR, generatedImage)} className="w-full">
                        <EditIcon className="w-5 h-5 mr-2" />
                        Follow-up Edit
                    </Button>
                </div>
                 <Button onClick={handleStartNew} variant="ghost" className="w-full mt-2">
                    <NewSessionIcon className="w-5 h-5 mr-2" />
                    Start New Session
                </Button>
            </div>
          )}
        </div>

        <div className="w-full aspect-square rounded-lg flex items-center justify-center bg-gray-800/50 border border-dashed border-gray-600 overflow-hidden">
          {isLoading ? (
            <LoadingPlaceholder message="Conjuring pixels..." />
          ) : generatedImage ? (
            <img src={generatedImage.url} alt={prompt} className="object-contain w-full h-full" />
          ) : (
            <div className="text-center text-gray-500 p-4 flex flex-col items-center justify-center">
              <SparklesIcon className="w-12 h-12 mb-4 text-gray-600" />
              <h3 className="font-bold text-lg text-white">Your generated image will appear here</h3>
              <p className="text-sm">Let your imagination run wild!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGeneratorPage;