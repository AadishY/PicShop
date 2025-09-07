import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImageFile } from '../types';
import { Page } from '../App';
import { editImage, upscaleImage, generateContextualEditingPrompts } from '../services/geminiService';
import LoadingPlaceholder from './LoadingPlaceholder';
import LoadingSpinner from './LoadingSpinner';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Edit, ImageUp, Loader2, RefreshCw, Sparkles, Undo2, Redo2, Layers, GitCompareArrows } from 'lucide-react';


interface ImageEditorPageProps {
  navigate: (page: Page, image?: ImageFile) => void;
  initialImage: ImageFile | null;
}

const ImageEditorPage: React.FC<ImageEditorPageProps> = ({ navigate, initialImage }) => {
  const [history, setHistory] = useState<ImageFile[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentImage = history[historyIndex];

  useEffect(() => {
    if (initialImage) {
      setHistory([initialImage]);
      setHistoryIndex(0);
    } else {
      setHistory([]);
      setHistoryIndex(0);
    }
  }, [initialImage]);

  const fetchPrompts = useCallback(async () => {
    if (currentImage) {
      setLoadingPrompts(true);
      setError(null);
      try {
        const prompts = await generateContextualEditingPrompts(currentImage);
        setExamplePrompts(prompts);
      } catch (err) {
        setError((err as Error).message || "Could not load suggestions.");
      } finally {
        setLoadingPrompts(false);
      }
    }
  }, [currentImage]);

  useEffect(() => {
    if (currentImage) {
      fetchPrompts();
    }
  }, [fetchPrompts, currentImage]);


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        const newImage: ImageFile = {
          file,
          url: URL.createObjectURL(file),
          data: base64String,
          mimeType: file.type,
        };
        setHistory([newImage]);
        setHistoryIndex(0);
        setError(null);
        setPrompt('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!currentImage || !prompt.trim()) {
      setError('Please enter an editing instruction.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const editedImage = await editImage(currentImage, prompt);
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, editedImage]);
      setHistoryIndex(newHistory.length);
      setPrompt('');
    } catch (err) {
       setError((err as Error).message || 'An unknown error occurred.');
    } finally {
       setIsLoading(false);
    }
  };

  const handleUpscale = async () => {
    if (!currentImage) return;
    setIsUpscaling(true);
    setError(null);
    try {
        const upscaled = await upscaleImage(currentImage);
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, upscaled]);
        setHistoryIndex(newHistory.length);
    } catch (err) {
        setError((err as Error).message || 'An unknown error occurred during upscaling.');
    } finally {
        setIsUpscaling(false);
    }
  };

  const undo = () => historyIndex > 0 && setHistoryIndex(historyIndex - 1);
  const redo = () => historyIndex < history.length - 1 && setHistoryIndex(historyIndex + 1);

  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = `edited-image.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartNew = () => {
    setHistory([]);
    setHistoryIndex(0);
    setPrompt('');
    setError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const renderUploadView = () => (
    <div className="flex flex-col items-center justify-center h-[70vh]">
        <Card className="w-full max-w-md bg-slate-900/40 backdrop-blur-lg border-slate-700/80 text-white text-center p-8">
          <CardHeader>
            <div className="mx-auto bg-slate-800/60 rounded-full p-4 w-fit mb-4">
              <Edit className="w-12 h-12 text-indigo-300"/>
            </div>
            <CardTitle className="text-3xl">Image Editor</CardTitle>
            <CardDescription className="text-lg text-gray-400">Upload a photo to start editing with AI.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={() => fileInputRef.current?.click()}>
                <ImageUp className="w-5 h-5 mr-2"/>
                Upload Image
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </CardContent>
        </Card>
    </div>
  );

  if (!currentImage) {
    return renderUploadView();
  }

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-3xl font-bold text-white mb-6">Image Editor</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <Card className="bg-slate-900/40 backdrop-blur-lg border-slate-700/80 text-white flex flex-col">
          <CardHeader>
            <CardTitle>Editing Tools</CardTitle>
            <CardDescription>Use the tools below to modify your image.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="prompt">Editing Instruction</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Change the background to a futuristic city"
                className="bg-slate-900/60 border-slate-700"
                disabled={isLoading || isUpscaling}
              />
            </div>
             <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-400">Need inspiration?</h4>
                <Button variant="ghost" size="sm" onClick={fetchPrompts} disabled={loadingPrompts || isLoading || isUpscaling}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingPrompts ? 'animate-spin' : ''}`}/> Get Ideas
                </Button>
              </div>
              {loadingPrompts ? (
                <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /><span>Loading suggestions...</span></div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((p, i) => (
                    <Button key={i} variant="outline" size="sm" onClick={() => setPrompt(p)} className="bg-slate-900/60 border-slate-700 hover:bg-slate-800" disabled={isLoading || isUpscaling}>
                      {p}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleEdit} size="lg" disabled={!prompt.trim() || isLoading || isUpscaling}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
              {isLoading ? 'Applying Edit...' : 'Apply Edit'}
            </Button>
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-slate-700 pt-6 mt-auto">
            <div className="w-full grid grid-cols-2 gap-4">
                <Button variant="secondary" onClick={undo} disabled={historyIndex === 0 || isLoading || isUpscaling}><Undo2 className="w-4 h-4 mr-2" /> Undo</Button>
                <Button variant="secondary" onClick={redo} disabled={historyIndex === history.length - 1 || isLoading || isUpscaling}><Redo2 className="w-4 h-4 mr-2" /> Redo</Button>
                <Button variant="secondary" onClick={handleDownload} disabled={isLoading || isUpscaling}><Download className="w-4 h-4 mr-2" /> Download</Button>
                <Button variant="secondary" onClick={handleUpscale} disabled={isLoading || isUpscaling}>
                  {isUpscaling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {isUpscaling ? 'Upscaling...' : 'Upscale'}
                </Button>
            </div>
             <Button onClick={handleStartNew} variant="ghost" className="w-full">
                <Layers className="w-4 h-4 mr-2" /> New Session
            </Button>
          </CardFooter>
        </Card>

        <Card className="w-full aspect-square overflow-hidden bg-slate-900/40 backdrop-blur-lg border-slate-700/80 relative">
           {history.length > 1 && (
             <Button 
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 z-10"
                onMouseDown={() => setIsComparing(true)}
                onMouseUp={() => setIsComparing(false)}
                onTouchStart={() => setIsComparing(true)}
                onTouchEnd={() => setIsComparing(false)}
                disabled={isLoading || isUpscaling}
                title="Hold to Compare with original"
            >
               <GitCompareArrows className="w-4 h-4 mr-2" /> Compare
            </Button>
           )}
          <div className="w-full h-full rounded-lg flex items-center justify-center bg-black/20 overflow-hidden">
            {isLoading ? (
              <LoadingPlaceholder message="Editing in progress..." />
            ) : (
                <img src={isComparing ? history[0].url : currentImage.url} alt={isComparing ? "Original image" : "Edited image"} className="object-contain w-full h-full" />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ImageEditorPage;
