import React, { useState, useEffect, useRef } from 'react';
import { ImageFile } from '../types';
import { Page } from '../App';
import { editImage, generateExamplePrompts } from '../services/geminiService';
import LoadingPlaceholder from './LoadingPlaceholder';
import LoadingSpinner from './LoadingSpinner';
import { Button } from './ui';
import { UploadIcon, UndoIcon, RedoIcon, DownloadIcon, CompareIcon, NewSessionIcon, EditIcon, CropIcon } from './Icons';

/**
 * Uses the Canvas API to crop an image file to a specific aspect ratio.
 * The crop is always centered.
 * @param imageFile The original image to crop.
 * @param aspectRatio The target aspect ratio (width / height).
 * @returns A Promise that resolves to a new, cropped ImageFile.
 */
const cropImage = (imageFile: ImageFile, aspectRatio: number): Promise<ImageFile> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Necessary for canvas operations on images from object URLs
    img.src = imageFile.url;

    img.onload = () => {
      const { naturalWidth: iw, naturalHeight: ih } = img;
      const originalRatio = iw / ih;

      let sx = 0, sy = 0, cropWidth = iw, cropHeight = ih;

      if (originalRatio > aspectRatio) { // Image is wider than target, crop the sides
        cropHeight = ih;
        cropWidth = ih * aspectRatio;
        sx = (iw - cropWidth) / 2;
      } else if (originalRatio < aspectRatio) { // Image is taller than target, crop the top/bottom
        cropWidth = iw;
        cropHeight = iw / aspectRatio;
        sy = (ih - cropHeight) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      ctx.drawImage(img, sx, sy, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      
      const newDataUrl = canvas.toDataURL(imageFile.mimeType);
      const base64String = newDataUrl.split(',')[1];
      
      const newImage: ImageFile = {
        url: newDataUrl,
        data: base64String,
        mimeType: imageFile.mimeType,
      };

      resolve(newImage);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for cropping.'));
    };
  });
};


interface ImageEditorPageProps {
  navigate: (page: Page, image?: ImageFile) => void;
  initialImage: ImageFile | null;
}

const ImageEditorPage: React.FC<ImageEditorPageProps> = ({ navigate, initialImage }) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('none');
  const [history, setHistory] = useState<ImageFile[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [showCropOptions, setShowCropOptions] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentImage = history[historyIndex] ?? null;

  useEffect(() => {
    if (initialImage) {
      setHistory([initialImage]);
      setHistoryIndex(0);
      setOriginalImage(initialImage);
    }
  }, [initialImage]);
  
  useEffect(() => {
    const fetchPrompts = async () => {
      if (currentImage) {
        setLoadingPrompts(true);
        const prompts = await generateExamplePrompts('editing', currentImage);
        setExamplePrompts(prompts);
        setLoadingPrompts(false);
      }
    };
    fetchPrompts();
  }, [currentImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        const newImage = {
          file,
          url: URL.createObjectURL(file),
          data: base64String,
          mimeType: file.type,
        };
        setHistory([newImage]);
        setHistoryIndex(0);
        setOriginalImage(newImage);
        setError(null);
        setPrompt('');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleEdit = async () => {
    if (!prompt.trim() && style === 'none') {
      setError('Please enter an editing instruction or select a style.');
      return;
    }
    if (!currentImage) return;

    setLoadingMessage('Applying AI magic...');
    setIsLoading(true);
    setError(null);

    try {
      const fullPrompt = style === 'none' ? prompt : `${prompt}, ${style}`;
      const result = await editImage(fullPrompt, currentImage);
      if (result.image) {
        const newHistory = [...history.slice(0, historyIndex + 1), result.image];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setPrompt('');
      } else {
        setError("The AI didn't return an image. Try a different prompt.");
      }
    } catch (err) {
      setError((err as Error).message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrop = async (aspect: '1:1' | '4:5' | '16:9') => {
    if (!currentImage) return;
    setShowCropOptions(false);
    setLoadingMessage('Cropping image...');
    setIsLoading(true);
    setError(null);

    try {
        const ratioMap = { '1:1': 1, '4:5': 4 / 5, '16:9': 16 / 9 };
        const numericRatio = ratioMap[aspect];
        
        const croppedImage = await cropImage(currentImage, numericRatio);

        const newHistory = [...history.slice(0, historyIndex + 1), croppedImage];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

    } catch (err) {
        setError((err as Error).message || 'An error occurred during cropping.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleUndo = () => historyIndex > 0 && setHistoryIndex(historyIndex - 1);
  const handleRedo = () => historyIndex < history.length - 1 && setHistoryIndex(historyIndex + 1);

  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = 'edited-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleNewSession = () => {
    setHistory([]);
    setHistoryIndex(-1);
    setOriginalImage(null);
    setPrompt('');
    setError(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const styles = [
    { value: 'none', label: 'Default' },
    { value: 'in a vibrant, detailed anime style', label: 'Anime' },
    { value: 'in a black and white manga style with screen tones', label: 'Manga' },
    { value: 'in a Disney Pixar animation style', label: 'Disney / Pixar' },
    { value: 'in a Marvel comic book style', label: 'Marvel Comic' },
    { value: 'as a 1980s photo, including fashion and aesthetics from the era', label: '1980s Photo' },
    { value: 'as an 1800s daguerreotype, including period clothing and vintage tones', label: '1800s Photo' },
    { value: 'with a futuristic sci-fi aesthetic', label: 'Futuristic' },
    { value: 'as an aged and weathered photo', label: 'Aged/Vintage' },
    { value: 'as a watercolor painting', label: 'Watercolor' },
    { value: 'as a charcoal sketch', label: 'Sketch' },
    { value: 'in a pop art style', label: 'Pop Art' }
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Image Editor</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Display */}
        <div className="w-full flex flex-col gap-4">
            <div className="w-full aspect-square rounded-lg flex items-center justify-center bg-gray-800/50 border border-dashed border-gray-600 overflow-hidden relative">
            {isLoading ? (
                <LoadingPlaceholder message={loadingMessage} />
            ) : currentImage ? (
                <>
                    <img 
                    src={isComparing && originalImage ? originalImage.url : currentImage.url} 
                    alt="Editable" 
                    className="object-contain w-full h-full" />
                    
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-10">
                        <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowCropOptions(prev => !prev)}
                        className="shadow-lg"
                        >
                            <CropIcon className="w-4 h-4 mr-1.5" />
                            Crop
                        </Button>
                        {showCropOptions && (
                            <div className="bg-gray-800 rounded-md p-1.5 flex flex-col gap-1.5 shadow-lg border border-gray-700">
                                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleCrop('1:1')}>Square (1:1)</Button>
                                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleCrop('4:5')}>Portrait (4:5)</Button>
                                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleCrop('16:9')}>Landscape (16:9)</Button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center text-gray-400 p-4 flex flex-col items-center">
                    <UploadIcon className="w-12 h-12 mb-4 text-gray-500"/>
                    <h3 className="font-bold text-lg text-white">Upload an image to start</h3>
                    <p className="text-sm">Or generate one and send it here.</p>
                    <Button onClick={() => fileInputRef.current?.click()} className="mt-6" size="sm">
                        Select from Device
                    </Button>
                </div>
            )}
            </div>
             <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

            {currentImage && (
                 <div className="bg-gray-800/50 rounded-lg p-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Button 
                        variant="secondary"
                        onMouseDown={() => setIsComparing(true)}
                        onMouseUp={() => setIsComparing(false)}
                        onTouchStart={() => setIsComparing(true)}
                        onTouchEnd={() => setIsComparing(false)}
                        disabled={!originalImage || history.length < 2}
                        title="Hold to compare with original"
                    >
                        <CompareIcon className="w-5 h-5 mr-2"/> Compare
                    </Button>
                    <Button variant="secondary" onClick={handleDownload} disabled={!currentImage}>
                        <DownloadIcon className="w-5 h-5 mr-2"/> Download
                    </Button>
                    <Button variant="secondary" onClick={handleUndo} disabled={historyIndex <= 0}>
                        <UndoIcon className="w-5 h-5 mr-2"/> Undo
                    </Button>
                    <Button variant="secondary" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                        <RedoIcon className="w-5 h-5 mr-2"/> Redo
                    </Button>
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-6">
          {currentImage ? (
            <>
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Editing Instructions</label>
                <textarea
                  id="prompt"
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-600 rounded-md text-white p-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

               <div>
                  <label htmlFor="style" className="block text-sm font-medium text-gray-300 mb-2">Style Presets</label>
                  <select
                    id="style"
                    className="w-full bg-gray-800 border border-gray-600 rounded-md text-white p-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  >
                    {styles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Try an example:</h4>
                {loadingPrompts ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <LoadingSpinner className="w-4 h-4" />
                    <span>Analyzing image...</span>
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
              
              <div className='flex flex-col gap-4'>
                <Button
                    onClick={handleEdit}
                    isLoading={isLoading}
                    loadingText="Applying Edit..."
                    size="lg"
                >
                    <EditIcon className="w-5 h-5 mr-2"/>
                    Apply Edit
                </Button>
              </div>

              {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
              
              <div className="border-t border-gray-700 mt-4 pt-4">
                  <Button onClick={handleNewSession} variant="ghost" className="w-full">
                    <NewSessionIcon className="w-5 h-5 mr-2" />
                    Start New Session
                  </Button>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 p-4 h-full flex flex-col items-center justify-center">
                 <h3 className="font-bold text-lg text-white mb-2">Ready to edit?</h3>
                 <p>Upload an image to get started. Your editing controls will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditorPage;