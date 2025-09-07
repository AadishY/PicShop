import React from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import { ImageFile } from '../types';
import LoadingPlaceholder from './LoadingPlaceholder';
import { Button } from './ui';
import { UploadIcon, CompareIcon, DownloadIcon, UndoIcon, RedoIcon, CropIcon } from './Icons';

interface ImageDisplayProps {
  currentImage: ImageFile | null;
  originalImage: ImageFile | null;
  isLoading: boolean;
  loadingMessage: string;
  isComparing: boolean;
  crop: Crop | undefined;
  setCrop: (crop: Crop | undefined) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCrop: () => void;
  handleDownload: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  setIsComparing: (isComparing: boolean) => void;
  historyIndex: number;
  historyLength: number;
  fileInputRef: React.RefObject<HTMLInputElement>;
  imgRef: React.RefObject<HTMLImageElement>;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  currentImage,
  originalImage,
  isLoading,
  loadingMessage,
  isComparing,
  crop,
  setCrop,
  handleImageUpload,
  handleCrop,
  handleDownload,
  handleUndo,
  handleRedo,
  setIsComparing,
  historyIndex,
  historyLength,
  fileInputRef,
  imgRef,
}) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full aspect-square rounded-lg flex items-center justify-center bg-gray-800/50 border border-dashed border-gray-600 overflow-hidden relative">
        {isLoading ? (
          <LoadingPlaceholder message={loadingMessage} />
        ) : currentImage ? (
          <ReactCrop crop={crop} onChange={c => setCrop(c)}>
            <img
              ref={imgRef}
              src={isComparing && originalImage ? originalImage.url : currentImage.url}
              alt="Editable"
              className="object-contain w-full h-full"
            />
          </ReactCrop>
        ) : (
          <div className="text-center text-gray-400 p-4 flex flex-col items-center justify-center">
            <UploadIcon className="w-12 h-12 mb-4 text-gray-500" />
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
        <div className="bg-gray-800/50 rounded-lg p-2 grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Button
            variant="secondary"
            onMouseDown={() => setIsComparing(true)}
            onMouseUp={() => setIsComparing(false)}
            onTouchStart={() => setIsComparing(true)}
            onTouchEnd={() => setIsComparing(false)}
            disabled={!originalImage || historyLength < 2}
            title="Hold to compare with original"
          >
            <CompareIcon className="w-5 h-5 mr-2" /> Compare
          </Button>
          <Button variant="secondary" onClick={handleDownload} disabled={!currentImage}>
            <DownloadIcon className="w-5 h-5 mr-2" /> Download
          </Button>
          <Button variant="secondary" onClick={handleUndo} disabled={historyIndex <= 0}>
            <UndoIcon className="w-5 h-5 mr-2" /> Undo
          </Button>
          <Button variant="secondary" onClick={handleRedo} disabled={historyIndex >= historyLength - 1}>
            <RedoIcon className="w-5 h-5 mr-2" /> Redo
          </Button>
          <Button variant="secondary" onClick={handleCrop} disabled={!crop}>
            <CropIcon className="w-5 h-5 mr-2" /> Crop
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
