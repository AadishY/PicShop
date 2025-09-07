import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImageFile } from '../types';
import { Page } from '../App';
import { editWithMultipleImages, editImage, upscaleImage, generateMultiImageExamplePrompts } from '../services/geminiService';
import { Button, Card } from './ui';
import { UploadIcon, TrashIcon, DownloadIcon, NewSessionIcon, ImageIcon, PlusIcon, RefreshIcon, UndoIcon, RedoIcon, SparklesIcon, CompareIcon } from './Icons';
import LoadingPlaceholder from './LoadingPlaceholder';
import LoadingSpinner from './LoadingSpinner';

interface MultiImageEditorPageProps {
  navigate: (page: Page) => void;
}

const MultiImageEditorPage: React.FC<MultiImageEditorPageProps> = ({ navigate }) => {
  // State for initial image uploads
  const [images, setImages] = useState<ImageFile[]>([]);
  
  // State for editing history
  const [history, setHistory] = useState<ImageFile[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // State for follow-up editing
  const [imageToMix, setImageToMix] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState('');
  
  // UI and loading states
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
    // Only fetch prompts in the initial stage
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
      e.target.value = ''; // Reset file input
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
      <Card className="p-4 sm:p-6">
        <h3 className="font-bold text-white mb-4">Uploaded Images ({images.length})</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group aspect-square">
              <img src={image.url} alt={`upload-${index}`} className="w-full h-full object-cover rounded-md" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => removeImage(index)} className="text-white bg-red-600/80 hover:bg-red-500 rounded-full p-1.5" title="Remove Image">
                  <TrashIcon className="w-5 h-5"/>
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => initialFileInputRef.current?.click()}
            className="aspect-square flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-white/20 rounded-md hover:bg-white/10 hover:border-white/30 transition-colors"
            disabled={isLoading}
          >
            <PlusIcon className="w-8 h-8 mb-1" />
            <span className="text-xs font-semibold">Add More</span>
          </button>
        </div>
        <input type="file" ref={initialFileInputRef} onChange={(e) => handleImageUpload(e, false)} accept="image/*" className="hidden" multiple />
      </Card>

      {images.length > 0 && (
        <Card className="p-6 sm:p-8 flex flex-col gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">Editing Instruction</label>
                {images.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={fetchPrompts} disabled={loadingPrompts || isLoading}>
                      <RefreshIcon className={`w-4 h-4 mr-2 ${loadingPrompts ? 'animate-spin' : ''}`}/> Inspire Me
                  </Button>
                )}
            </div>
            <textarea
              id="prompt"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg text-white p-3 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition placeholder:text-gray-500"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Combine these images into a surreal collage"
              disabled={isLoading}
            />
          </div>

          {images.length > 1 && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Or try an example:</h4>
              {loadingPrompts ? (
                <div className="flex items-center gap-2 text-sm text-gray-400"><LoadingSpinner className="w-4 h-4" /><span>Loading ideas...</span></div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((p, i) => (
                    <button key={i} onClick={() => setPrompt(p)} className="text-sm bg-white/10 hover:bg-white/20 text-gray-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50" disabled={isLoading}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button onClick={handleInitialGenerate} isLoading={isLoading} loadingText="Generating..." className="w-full" size="lg" disabled={isLoading || images.length < 2 || !prompt.trim()}>
            Generate
          </Button>
          {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
        </Card>
      )}
    </div>
  );

  const renderFollowUpView = () => (
     <Card className="p-6 sm:p-8 flex flex-col gap-6">
        <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Follow-up Instruction</label>
            <textarea
              id="prompt"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg text-white p-3 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition placeholder:text-gray-500"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Now make it black and white"
              disabled={isLoading || isUpscaling}
            />
        </div>
        
        {imageToMix && (
            <div className="p-3 rounded-lg bg-white/10">
                <p className="text-sm font-medium text-gray-300 mb-2">Image to Mix In:</p>
                <div className="flex items-center gap-4">
                    <img src={imageToMix.url} alt="image to mix" className="w-16 h-16 object-cover rounded-md" />
                    <p className="text-sm text-gray-400 flex-1 truncate">{imageToMix.file?.name}</p>
                    <button onClick={() => setImageToMix(null)} className="text-gray-400 hover:text-white transition-colors" title="Clear Image">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        )}

        <Button onClick={handleFollowUpEdit} isLoading={isLoading} loadingText="Applying..." className="w-full" size="lg" disabled={!prompt.trim() || isUpscaling}>
            Apply Edit
        </Button>
        {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}

        <div className="border-t border-white/10 pt-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white">Tools</h3>
            <div className="grid grid-cols-2 gap-4">
                <Button variant="secondary" onClick={undo} disabled={historyIndex === 0 || isLoading || isUpscaling}><UndoIcon className="w-5 h-5 mr-2" /> Undo</Button>
                <Button variant="secondary" onClick={redo} disabled={historyIndex === history.length - 1 || isLoading || isUpscaling}><RedoIcon className="w-5 h-5 mr-2" /> Redo</Button>
                <Button variant="secondary" onClick={handleDownload} disabled={isLoading || isUpscaling}><DownloadIcon className="w-5 h-5 mr-2" /> Download</Button>
                <Button onClick={handleUpscale} variant="secondary" className="relative" isLoading={isUpscaling} loadingText="Upscaling..." disabled={isLoading || isUpscaling}>
                    <SparklesIcon className="w-5 h-5 mr-2" /> Upscale
                    <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">BETA</span>
                </Button>
                <Button variant="secondary" className="col-span-2" onClick={() => mixFileInputRef.current?.click()} disabled={isLoading || isUpscaling}>
                    <UploadIcon className="w-5 h-5 mr-2" /> Add Image to Mix
                </Button>
                <input type="file" ref={mixFileInputRef} onChange={(e) => handleImageUpload(e, true)} accept="image/*" className="hidden" />
            </div>
            <Button onClick={handleStartNew} variant="ghost" className="w-full mt-4" disabled={isLoading || isUpscaling}>
                <NewSessionIcon className="w-5 h-5 mr-2" /> Start New Session
            </Button>
        </div>
     </Card>
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Multi-Image Mixer</h2>
      <p className="text-gray-400 mb-6">Combine, merge, or edit multiple images with a single prompt.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {history.length === 0 ? renderInitialView() : renderFollowUpView()}

        <Card className="w-full aspect-square overflow-hidden p-2 relative">
           {history.length > 1 && (
             <Button 
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 z-10 backdrop-blur-sm"
                onMouseDown={() => setIsComparing(true)}
                onMouseUp={() => setIsComparing(false)}
                onTouchStart={() => setIsComparing(true)}
                onTouchEnd={() => setIsComparing(false)}
                disabled={isLoading || isUpscaling}
                title="Hold to Compare with first result"
            >
               <CompareIcon className="w-4 h-4 mr-2" /> Compare
            </Button>
           )}
          <div className="w-full h-full rounded-lg flex items-center justify-center bg-black/20 overflow-hidden">
            {isLoading ? (
              <LoadingPlaceholder message="Mixing your images..." />
            ) : currentImage ? (
                <img src={isComparing ? history[0].url : currentImage.url} alt={isComparing ? "Original result" : "Edited result"} className="object-contain w-full h-full" />
            ) : (
              <div className="text-center text-gray-500 p-4">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-600"/>
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