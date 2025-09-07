import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImageFile } from '../types';
import { Page } from '../App';
import { generateImage, generateGenericExamplePrompts, upscaleImage } from '../services/geminiService';
import LoadingPlaceholder from './LoadingPlaceholder';
import LoadingSpinner from './LoadingSpinner';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Edit, FileImage, Loader2, RefreshCw, Sparkles, WandSparkles } from 'lucide-react';


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

  const renderGeneratorForm = () => (
    <Card className="bg-slate-900/40 backdrop-blur-lg border-slate-700/80 text-white">
      <CardHeader>
        <CardTitle className="text-2xl">Image Generator</CardTitle>
        <CardDescription>Describe the image you want to create.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="prompt">Prompt</Label>
            <Button variant="ghost" size="sm" onClick={fetchPrompts} disabled={loadingPrompts || isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingPrompts ? 'animate-spin' : ''}`}/> Inspire Me
            </Button>
          </div>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A majestic lion wearing a crown, cinematic lighting"
            className="bg-slate-900/60 border-slate-700"
          />
        </div>

        <div>
            {loadingPrompts ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading examples...</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((p, i) => (
                  <Button key={i} variant="outline" size="sm" onClick={() => setPrompt(p)} className="bg-slate-900/60 border-slate-700 hover:bg-slate-800">
                    {p}
                  </Button>
                ))}
              </div>
            )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="aspectRatio">Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger id="aspectRatio" className="bg-slate-900/60 border-slate-700">
                <SelectValue placeholder="Select ratio" />
              </SelectTrigger>
              <SelectContent>
                {aspectRatios.map(ar => <SelectItem key={ar} value={ar}>{ar}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="style">Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger id="style" className="bg-slate-900/60 border-slate-700">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                {styles.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col">
        <Button size="lg" className="w-full" onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
          {isLoading ? loadingMessage : 'Generate Image'}
        </Button>
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
      </CardFooter>
    </Card>
  );

  const renderResultsView = () => (
     <Card className="bg-slate-900/40 backdrop-blur-lg border-slate-700/80 text-white flex flex-col">
      <CardHeader>
        <CardTitle className="text-2xl">Your Masterpiece</CardTitle>
        <CardDescription>Download your image, enhance its quality, or send it to the editor for more detailed changes.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow grid grid-cols-2 gap-4">
        <Button onClick={handleDownload} variant="secondary">
            <Download className="w-4 h-4 mr-2" /> Download
        </Button>
        <Button onClick={handleUpscale} variant="secondary" disabled={isUpscaling}>
            {isUpscaling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isUpscaling ? 'Upscaling...' : 'Upscale'}
        </Button>
        <Button onClick={() => navigate(Page.EDITOR, generatedImage)} className="col-span-2">
            <Edit className="w-4 h-4 mr-2" />
            Follow-up Edit
        </Button>
      </CardContent>
      <CardFooter>
        <Button onClick={handleStartNew} variant="ghost" className="w-full">
            Start New Session
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          {!generatedImage ? renderGeneratorForm() : renderResultsView()}
        </div>
        <Card className="w-full aspect-square overflow-hidden bg-slate-900/40 backdrop-blur-lg border-slate-700/80">
          <div className="w-full h-full rounded-lg flex items-center justify-center bg-black/20 overflow-hidden">
            {isLoading ? (
              <LoadingPlaceholder message={loadingMessage} />
            ) : generatedImage ? (
              <img src={generatedImage.url} alt={prompt || 'Generated image'} className="object-contain w-full h-full" />
            ) : (
              <div className="text-center text-gray-500 p-4 flex flex-col items-center justify-center">
                <FileImage className="w-16 h-16 mx-auto mb-4 text-gray-600"/>
                <p>Your generated image will appear here.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ImageGeneratorPage;