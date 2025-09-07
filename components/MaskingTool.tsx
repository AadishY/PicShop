import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui';

interface MaskingToolProps {
  image: HTMLImageElement;
  onMaskComplete: (maskDataUrl: string) => void;
  onCancel: () => void;
}

const MaskingTool: React.FC<MaskingToolProps> = ({ image, onMaskComplete, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && image) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0, image.width, image.height);
      }
    }
  }, [image]);

  const getMousePos = (canvas: HTMLCanvasElement, evt: React.MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
      }
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const pos = getMousePos(canvas, e);
      if (ctx) {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'white';
      }
    }
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        maskCtx.drawImage(canvas, 0, 0);
        const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
            // Do nothing, it's already black
          } else {
            // Set to white
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
        }
        maskCtx.putImageData(imageData, 0, 0);
        onMaskComplete(maskCanvas.toDataURL('image/png'));
      }
    }
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-20">
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            className="cursor-crosshair"
        />
        <div className="flex items-center gap-4 mt-4">
            <label htmlFor="brushSize" className="text-white">Brush Size:</label>
            <input
            type="range"
            id="brushSize"
            min="1"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            />
            <Button onClick={handleConfirm}>Confirm Mask</Button>
            <Button onClick={onCancel} variant="secondary">Cancel</Button>
        </div>
    </div>
  );
};

export default MaskingTool;
