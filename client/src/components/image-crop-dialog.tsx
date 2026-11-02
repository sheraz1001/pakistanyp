import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCw, ZoomIn, ZoomOut, Move, Crop } from 'lucide-react';

interface ImageCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (croppedImageBlob: Blob) => void;
}

export default function ImageCropDialog({ isOpen, onClose, imageUrl, onSave }: ImageCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState([1]);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 200 });

  useEffect(() => {
    if (isOpen && imageUrl) {
      drawCanvas();
    }
  }, [isOpen, imageUrl, scale, rotation, position, cropArea]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 400;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();

    // Apply transformations
    ctx.translate(canvas.width / 2 + position.x, canvas.height / 2 + position.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale[0], scale[0]);

    // Draw image
    const imgWidth = image.naturalWidth;
    const imgHeight = image.naturalHeight;
    const maxSize = Math.min(300, Math.max(imgWidth, imgHeight));
    const drawWidth = (imgWidth / Math.max(imgWidth, imgHeight)) * maxSize;
    const drawHeight = (imgHeight / Math.max(imgWidth, imgHeight)) * maxSize;

    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    // Restore context
    ctx.restore();

    // Draw crop area overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';

    // Draw crop area border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = '#3b82f6';
    const corners = [
      { x: cropArea.x - handleSize / 2, y: cropArea.y - handleSize / 2 },
      { x: cropArea.x + cropArea.width - handleSize / 2, y: cropArea.y - handleSize / 2 },
      { x: cropArea.x - handleSize / 2, y: cropArea.y + cropArea.height - handleSize / 2 },
      { x: cropArea.x + cropArea.width - handleSize / 2, y: cropArea.y + cropArea.height - handleSize / 2 },
    ];
    corners.forEach(corner => {
      ctx.fillRect(corner.x, corner.y, handleSize, handleSize);
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x: x - position.x, y: y - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosition({
      x: x - dragStart.x,
      y: y - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetTransform = () => {
    setScale([1]);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setCropArea({ x: 50, y: 50, width: 200, height: 200 });
  };

  const cropAndSave = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;

    // Set crop canvas size to crop area size
    cropCanvas.width = cropArea.width;
    cropCanvas.height = cropArea.height;

    // Get the image data from the crop area
    const imageData = canvas.getContext('2d')?.getImageData(
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height
    );

    if (imageData) {
      cropCtx.putImageData(imageData, 0, 0);
    }

    // Convert to blob
    cropCanvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, 'image/png', 0.9);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Edit & Crop Logo
          </DialogTitle>
          <DialogDescription>
            Adjust your logo by zooming, rotating, and positioning. Then select the crop area.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hidden image element to load the source */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Source"
            className="hidden"
            onLoad={drawCanvas}
          />

          {/* Canvas for image editing */}
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="border border-gray-300 rounded-lg cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Zoom: {scale[0].toFixed(1)}x
              </label>
              <Slider
                value={scale}
                onValueChange={setScale}
                max={3}
                min={0.1}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rotation: {rotation}°</label>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                max={360}
                min={0}
                step={15}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Crop Size</label>
              <Slider
                value={[cropArea.width]}
                onValueChange={(value) => 
                  setCropArea(prev => ({ 
                    ...prev, 
                    width: value[0], 
                    height: value[0] 
                  }))
                }
                max={300}
                min={50}
                step={10}
                className="w-full"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRotation(prev => prev + 90)}
              className="flex items-center gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Rotate 90°
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={resetTransform}
              className="flex items-center gap-2"
            >
              <Move className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Save/Cancel buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={cropAndSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Cropped Logo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}