import React, { useState, useEffect, useRef } from 'react';
import { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { ImageFile } from '../types';
import { Page } from '../App';
import { editImage, generateExamplePrompts } from '../services/geminiService';
import ImageDisplay from './ImageDisplay';
import EditingControls from './EditingControls';
import MaskingTool from './MaskingTool';
import { EditIcon } from './Icons';

const cropImage = (imageFile: ImageFile, crop: Crop): Promise<ImageFile> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageFile.url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      canvas.width = crop.width;
      canvas.height = crop.height;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      ctx.drawImage(
        img,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

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
  const [isMasking, setIsMasking] = useState(false);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();

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

    setLoadingMessage('let aadish cook 🍳');
    setIsLoading(true);
    setError(null);

    try {
      const fullPrompt = style === 'none' ? prompt : `${prompt}, ${style}`;
      const mask = maskDataUrl ? { data: maskDataUrl.split(',')[1], mimeType: 'image/png' } : null;
      const result = await editImage(fullPrompt, currentImage, mask);
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
      setMaskDataUrl(null);
    }
  };

  const handleCrop = async () => {
    if (!currentImage || !crop) return;

    setLoadingMessage('Cropping image...');
    setIsLoading(true);
    setError(null);

    try {
      const croppedImage = await cropImage(currentImage, crop);
      const newHistory = [...history.slice(0, historyIndex + 1), croppedImage];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } catch (err) {
      setError((err as Error).message || 'An error occurred during cropping.');
    } finally {
      setIsLoading(false);
      setCrop(undefined); // Reset crop state
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

  const imageForMasking = new Image();
  if (currentImage) {
    imageForMasking.src = currentImage.url;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Image Editor</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <ImageDisplay
          currentImage={currentImage}
          originalImage={originalImage}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          isComparing={isComparing}
          crop={crop}
          setCrop={setCrop}
          handleImageUpload={handleImageUpload}
          handleCrop={handleCrop}
          handleDownload={handleDownload}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          setIsComparing={setIsComparing}
          setIsMasking={setIsMasking}
          historyIndex={historyIndex}
          historyLength={history.length}
          fileInputRef={fileInputRef}
        />

        {currentImage ? (
          <EditingControls
            prompt={prompt}
            setPrompt={setPrompt}
            style={style}
            setStyle={setStyle}
            styles={styles}
            examplePrompts={examplePrompts}
            loadingPrompts={loadingPrompts}
            handleEdit={handleEdit}
            isLoading={isLoading}
            error={error}
            handleNewSession={handleNewSession}
          />
        ) : (
          <div className="text-center text-gray-400 p-4 h-full flex flex-col items-center justify-center bg-gray-800/50 rounded-lg">
            <EditIcon className="w-12 h-12 mb-4 text-gray-500" />
            <h3 className="font-bold text-lg text-white mb-2">Ready to edit?</h3>
            <p className="text-sm">Upload an image to get started. Your editing controls will appear here.</p>
          </div>
        )}
      </div>
      {isMasking && currentImage && (
        <MaskingTool
          image={imageForMasking}
          onMaskComplete={(dataUrl) => {
            setMaskDataUrl(dataUrl);
            setIsMasking(false);
            handleEdit();
          }}
          onCancel={() => setIsMasking(false)}
        />
      )}
    </div>
  );
};

export default ImageEditorPage;