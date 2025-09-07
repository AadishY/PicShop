import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImageFile } from '../types';
import { Page } from '../App';
import { editImage, upscaleImage, generateContextualEditingPrompts } from '../services/geminiService';
import { Button, Card } from './ui';
import { UploadIcon, DownloadIcon, NewSessionIcon, ImageIcon, RefreshIcon, UndoIcon, RedoIcon, SparklesIcon, CompareIcon } from './Icons';
import LoadingPlaceholder from './LoadingPlaceholder';
import LoadingSpinner from './LoadingSpinner';

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

  // Initialize with passed image or clear history
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
    // This allows re-uploading the same file
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const renderUploadView = () => (
    <div className="flex flex-col items-center justify-center h-[50vh]">
        <Card className="p-8 sm:p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-600 mb-4"/>
            <h2 className="text-2xl font-bold text-white mb-2">Image Editor</h2>
            <p className="text-gray-400 mb-6">Upload a photo to start editing.</p>
            <Button onClick={() => fileInputRef.current?.click()}>
                <UploadIcon className="w-5 h-5 mr-2"/>
                Upload Image
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        </Card>
    </div>
  );

  if (!currentImage) {
    return renderUploadView();
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Image Editor</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <Card className="p-6 sm:p-8 flex flex-col gap-6">
           <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Editing Instruction</label>
            <textarea
              id="prompt"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg text-white p-3 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition placeholder:text-gray-500"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Change the background to a futuristic city"
              disabled={isLoading || isUpscaling}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-400">Need inspiration?</h4>
              <Button variant="ghost" size="sm" onClick={fetchPrompts} disabled={loadingPrompts || isLoading || isUpscaling}>
                  <RefreshIcon className={`w-4 h-4 mr-2 ${loadingPrompts ? 'animate-spin' : ''}`}/> Get Ideas
              </Button>
            </div>
            {loadingPrompts ? (
              <div className="flex items-center gap-2 text-sm text-gray-400"><LoadingSpinner className="w-4 h-4" /><span>Loading suggestions...</span></div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((p, i) => (
                  <button key={i} onClick={() => setPrompt(p)} className="text-sm bg-white/10 hover:bg-white/20 text-gray-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50" disabled={isLoading || isUpscaling}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleEdit} isLoading={isLoading} loadingText="Applying Edit..." className="w-full mt-2" size="lg" disabled={!prompt.trim() || isUpscaling}>
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
            </div>
             <Button onClick={handleStartNew} variant="ghost" className="w-full mt-4" disabled={isLoading || isUpscaling}>
                <NewSessionIcon className="w-5 h-5 mr-2" /> New Session
            </Button>
          </div>
        </Card>

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
                title="Hold to Compare with original"
            >
               <CompareIcon className="w-4 h-4 mr-2" /> Compare
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
