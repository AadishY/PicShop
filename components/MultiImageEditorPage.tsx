import React, { useState, useEffect, useRef } from 'react';
import { ImageFile } from '../types';
import { Page } from '../App';
import { editMultipleImages, generateExamplePrompts } from '../services/geminiService';
import LoadingPlaceholder from './LoadingPlaceholder';
import LoadingSpinner from './LoadingSpinner';
import { Button } from './ui';
import { PlusIcon, TrashIcon, DownloadIcon, NewSessionIcon, EditIcon } from './Icons';

interface MultiImageEditorPageProps {
  navigate: (page: Page) => void;
}

const MultiImageEditorPage: React.FC<MultiImageEditorPageProps> = ({ navigate }) => {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [result, setResult] = useState<{ image?: ImageFile, text?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPrompts = async () => {
      setLoadingPrompts(true);
      const prompts = await generateExamplePrompts('multi-editing');
      setExamplePrompts(prompts);
      setLoadingPrompts(false);
    };
    fetchPrompts();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setResult(null);
      const newImages: ImageFile[] = [];
      const promises = Array.from(files).map(file => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            newImages.push({
              file,
              url: URL.createObjectURL(file),
              data: base64String,
              mimeType: file.type,
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      });
      Promise.all(promises).then(() => {
        setImages(prev => [...prev, ...newImages]);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleEdit = async () => {
    if (!prompt.trim()) {
      setError('Please enter an editing instruction.');
      return;
    }
    if (images.length < 2) {
      setError('Please upload at least two images.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await editMultipleImages(prompt, images);
      setResult(res);
    } catch (err) {
      setError((err as Error).message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStartNew = () => {
    setImages([]);
    setResult(null);
    setPrompt('');
    setError(null);
  };
  
  const handleDownload = () => {
    if (!result?.image) return;
    const link = document.createElement('a');
    link.href = result.image.url;
    link.download = 'multi-edit-result.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Multi-Image Editor <span className="text-sm bg-yellow-400 text-yellow-900 font-bold px-2 py-1 rounded-full align-middle">BETA</span></h2>
      <p className="text-gray-400 mb-6">Upload multiple images and apply a single edit to all of them, like creating a collage or applying a consistent style.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Controls and Input Images */}
        <div className="flex flex-col gap-6">
          {!result ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Input Images ({images.length})</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img src={image.url} alt={`upload-${index}`} className="w-full h-full object-cover rounded-md" />
                      <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all focus:opacity-100">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} className="w-full aspect-square bg-gray-800/50 rounded-lg flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-600 hover:border-indigo-500 hover:text-indigo-400 transition-colors">
                    <PlusIcon className="w-8 h-8"/>
                  </button>
                </div>
              </div>
              <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

              {images.length > 0 && (
                <>
                  <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Editing Instructions</label>
                    <textarea
                      id="prompt"
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-600 rounded-md text-white p-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., Create a vibrant collage with these images."
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
                          <button key={i} onClick={() => setPrompt(p)} className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-full transition-colors">
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button onClick={handleEdit} isLoading={isLoading} loadingText="Processing..." size="lg">
                    <EditIcon className="w-5 h-5 mr-2" />
                    Process Images
                  </Button>
                  {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                </>
              )}
            </>
          ) : (
             <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-white">Result</h3>
                <p className="text-gray-300">Your combined result is ready. You can now download it or start a new session.</p>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                     <Button onClick={handleDownload} variant="secondary" className="w-full">
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Download
                    </Button>
                    <Button onClick={handleStartNew} className="w-full">
                        <NewSessionIcon className="w-5 h-5 mr-2" />
                        Start New Session
                    </Button>
                </div>
            </div>
          )}
        </div>

        {/* Result Display */}
        <div className="w-full aspect-square rounded-lg flex items-center justify-center bg-gray-800/50 border border-dashed border-gray-600 overflow-hidden">
          {isLoading ? (
            <LoadingPlaceholder message="Combining your images..." />
          ) : result ? (
            <div className="w-full h-full flex flex-col gap-4 p-4">
              {result.image && <img src={result.image.url} alt="Result" className="rounded-lg object-contain w-full h-full" />}
              {result.text && <div className="p-4 bg-gray-800 rounded-lg text-gray-300 text-sm">{result.text}</div>}
            </div>
          ) : (
            <div className="text-center text-gray-500 p-4">
              Your result will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiImageEditorPage;