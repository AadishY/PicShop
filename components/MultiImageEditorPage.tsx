import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImageFile } from '../types';
import { Page } from '../App';
import { editWithMultipleImages, editImage, upscaleImage, generateMultiImageExamplePrompts } from '../services/geminiService';
import LoadingPlaceholder from './LoadingPlaceholder';
import LoadingSpinner from './LoadingSpinner';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Edit, ImageUp, Loader2, RefreshCw, Sparkles, Undo2, Redo2, Layers, GitCompareArrows, Trash2, PlusCircle, WandSparkles } from 'lucide-react';

interface MultiImageEditorPageProps {
  navigate: (page: Page) => void;
}

const MultiImageEditorPage: React.FC<MultiImageEditorPageProps> = ({ navigate }) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [history, setHistory] = useState<ImageFile[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [imageToMix, setImageToMix] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  
  const initialFileInputRef = useRef<HTMLInputElement>(null);
  const mixFileInputRef = useRef<HTMLInputElement>(null);

  const currentImage = history[historyIndex];

  const fetchPrompts = useCallback(async () => {
    if (images.length > 1) {
      setLoadingPrompts(true);
      setError(null);
      try {
        const prompts = await generateMultiImageExamplePrompts();
        setExamplePrompts(prompts);
      } catch (err) {
        setError((err as Error).message || 'Failed to load suggestions.');
      } finally {
        setLoadingPrompts(false);
      }
    } else {
      setExamplePrompts([]);
    }
  }, [images.length]);

  useEffect(() => {
    if (history.length === 0) {
      fetchPrompts();
    }
  }, [fetchPrompts, history.length]);


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isFollowUp: boolean = false) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        const newImage: ImageFile = {
          file,
          url: URL.createObjectURL(file),
          data: base64String,
          mimeType: file.type,
        };
        if (isFollowUp) {
          setImageToMix(newImage);
        } else {
          setImages(prev => [...prev, newImage]);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };
  
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleInitialGenerate = async () => {
    if (images.length < 2) {
      setError("Please upload at least two images.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter an editing instruction.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const result = await editWithMultipleImages(images, prompt);
      setHistory([result]);
      setHistoryIndex(0);
      setPrompt('');
      setExamplePrompts([]);
    } catch (err) {
      setError((err as Error).message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFollowUpEdit = async () => {
    if (!currentImage || !prompt.trim()) {
      setError('Please enter a follow-up instruction.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      let editedImage;
      if (imageToMix) {
        editedImage = await editWithMultipleImages([currentImage, imageToMix], prompt);
      } else {
        editedImage = await editImage(currentImage, prompt);
      }
      
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, editedImage]);
      setHistoryIndex(newHistory.length);
      setPrompt('');
      setImageToMix(null);

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
    link.download = `mixed-image.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartNew = () => {
    setImages([]);
    setHistory([]);
    setHistoryIndex(0);
    setImageToMix(null);
    setPrompt('');
    setError(null);
  };

  const renderInitialView = () => (
    <div className="flex flex-col gap-6">
      <Card className="bg-slate-900/40 backdrop-blur-lg border-slate-700/80 text-white">
        <CardHeader>
          <CardTitle>Upload Images</CardTitle>
          <CardDescription>Add at least two images to combine or edit.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group aspect-square">
                <img src={image.url} alt={`upload-${index}`} className="w-full h-full object-cover rounded-md" />
                <Button variant="destructive" size="icon" onClick={() => removeImage(index)} className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-4 w-4"/>
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => initialFileInputRef.current?.click()}
              className="aspect-square flex flex-col items-center justify-center text-center text-gray-400 border-dashed h-full w-full bg-slate-900/60 border-slate-700 hover:bg-slate-800 hover:text-gray-300"
              disabled={isLoading}
            >
              <PlusCircle className="w-8 h-8 mb-1" />
              <span className="text-xs font-semibold">Add More</span>
            </Button>
          </div>
          <input type="file" ref={initialFileInputRef} onChange={(e) => handleImageUpload(e, false)} accept="image/*" className="hidden" multiple />
        </CardContent>
      </Card>

      {images.length > 0 && (
        <Card className="bg-slate-900/40 backdrop-blur-lg border-slate-700/80 text-white">
          <CardContent className="pt-6 grid gap-6">
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                  <Label htmlFor="prompt">Editing Instruction</Label>
                  {images.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={fetchPrompts} disabled={loadingPrompts || isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loadingPrompts ? 'animate-spin' : ''}`}/> Inspire Me
                    </Button>
                  )}
              </div>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Combine these images into a surreal collage"
                className="bg-slate-900/60 border-slate-700"
                disabled={isLoading}
              />
            </div>

            {images.length > 1 && (
              <div>
                {loadingPrompts ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /><span>Loading ideas...</span></div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.map((p, i) => (
                      <Button key={i} variant="outline" size="sm" onClick={() => setPrompt(p)} className="bg-slate-900/60 border-slate-700 hover:bg-slate-800" disabled={isLoading}>
                        {p}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleInitialGenerate} size="lg" className="w-full" disabled={isLoading || images.length < 2 || !prompt.trim()}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
              {isLoading ? 'Generating...' : 'Generate'}
            </Button>
            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          </CardFooter>
        </Card>
      )}
    </div>
  );

  const renderFollowUpView = () => (
     <Card className="bg-slate-900/40 backdrop-blur-lg border-slate-700/80 text-white flex flex-col">
        <CardHeader>
          <CardTitle>Follow-up Edit</CardTitle>
          <CardDescription>Continue editing your creation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="prompt">Follow-up Instruction</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Now make it black and white"
                className="bg-slate-900/60 border-slate-700"
                disabled={isLoading || isUpscaling}
              />
            </div>

            {imageToMix && (
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700">
                    <p className="text-sm font-medium text-gray-300 mb-2">Image to Mix In:</p>
                    <div className="flex items-center gap-4">
                        <img src={imageToMix.url} alt="image to mix" className="w-16 h-16 object-cover rounded-md" />
                        <p className="text-sm text-gray-400 flex-1 truncate">{imageToMix.file?.name}</p>
                        <Button variant="ghost" size="icon" onClick={() => setImageToMix(null)} title="Clear Image">
                            <Trash2 className="w-5 h-5"/>
                        </Button>
                    </div>
                </div>
            )}

            <Button onClick={handleFollowUpEdit} size="lg" disabled={!prompt.trim() || isLoading || isUpscaling}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
              {isLoading ? 'Applying...' : 'Apply Edit'}
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
                <Button variant="secondary" className="col-span-2" onClick={() => mixFileInputRef.current?.click()} disabled={isLoading || isUpscaling}>
                    <ImageUp className="w-4 h-4 mr-2" /> Add Image to Mix
                </Button>
                <input type="file" ref={mixFileInputRef} onChange={(e) => handleImageUpload(e, true)} accept="image/*" className="hidden" />
            </div>
            <Button onClick={handleStartNew} variant="ghost" className="w-full">
                <Layers className="w-4 h-4 mr-2" /> Start New Session
            </Button>
        </CardFooter>
     </Card>
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Multi-Image Mixer</h2>
        <p className="text-gray-400">Combine, merge, or edit multiple images with a single prompt.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          {history.length === 0 ? renderInitialView() : renderFollowUpView()}
        </div>

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
                title="Hold to Compare with first result"
            >
               <GitCompareArrows className="w-4 h-4 mr-2" /> Compare
            </Button>
           )}
          <div className="w-full h-full rounded-lg flex items-center justify-center bg-black/20 overflow-hidden">
            {isLoading ? (
              <LoadingPlaceholder message="Mixing your images..." />
            ) : currentImage ? (
                <img src={isComparing ? history[0].url : currentImage.url} alt={isComparing ? "Original result" : "Edited result"} className="object-contain w-full h-full" />
            ) : (
              <div className="text-center text-gray-500 p-4 flex flex-col items-center justify-center">
                <Layers className="w-16 h-16 mx-auto mb-4 text-gray-600"/>
                <h3 className="text-xl font-bold text-white mb-2">Your Creation Will Appear Here</h3>
                 {images.length < 2 ? (
                    <p>Upload at least two images to get started.</p>
                 ) : (
                    <p>Write a prompt to combine your images.</p>
                 )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MultiImageEditorPage;