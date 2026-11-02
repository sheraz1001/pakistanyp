import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Camera, 
  Scan, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Download,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
  FileImage,
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Edit,
  Save,
  Plus,
  Trash2,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

interface ExtractedBusinessInfo {
  businessName: string;
  contactPerson: string;
  jobTitle: string;
  phoneNumber: string;
  email: string;
  website: string;
  address: string;
  city: string;
  province: string;
  businessType: string;
  services: string[];
  socialMedia: {
    linkedin: string;
    twitter: string;
    instagram: string;
    facebook: string;
  };
  additionalInfo: string;
  confidence: number;
}

interface InteractiveBusinessCardScannerProps {
  onBusinessExtracted?: (businessInfo: ExtractedBusinessInfo) => void;
  onAddBusiness?: (businessInfo: ExtractedBusinessInfo) => void;
}

interface ScanRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  field: keyof ExtractedBusinessInfo;
}

export function InteractiveBusinessCardScanner({ onBusinessExtracted, onAddBusiness }: InteractiveBusinessCardScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedBusinessInfo | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ExtractedBusinessInfo[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scanRegions, setScanRegions] = useState<ScanRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image file must be smaller than 10MB');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target?.result as string;
      setSelectedImage(base64Image);
      setZoom(1);
      setImagePosition({ x: 0, y: 0 });
      setScanRegions([]);
      setExtractedInfo(null);
    };
    reader.readAsDataURL(file);
  };

  const simulateProgressSteps = useCallback(() => {
    const steps = [
      { progress: 10, step: 'Loading image...' },
      { progress: 25, step: 'Detecting text regions...' },
      { progress: 45, step: 'Extracting text content...' },
      { progress: 65, step: 'Analyzing business information...' },
      { progress: 80, step: 'Validating extracted data...' },
      { progress: 95, step: 'Finalizing results...' },
      { progress: 100, step: 'Complete!' }
    ];

    let currentStepIndex = 0;
    const stepInterval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        setScanProgress(steps[currentStepIndex].progress);
        setCurrentStep(steps[currentStepIndex].step);
        currentStepIndex++;
      } else {
        clearInterval(stepInterval);
      }
    }, 800);

    return () => clearInterval(stepInterval);
  }, []);

  const scanBusinessCard = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setError(null);
    setScanProgress(0);
    setCurrentStep('Starting scan...');

    const clearProgress = simulateProgressSteps();

    try {
      const base64Data = selectedImage.split(',')[1];
      
      const response = await fetch('/api/business-card/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
          format: 'base64'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to scan business card');
      }

      const result = await response.json();
      
      if (result.success) {
        setExtractedInfo(result.data);
        setScanHistory(prev => [result.data, ...prev.slice(0, 4)]);
        generateScanRegions(result.data);
        onBusinessExtracted?.(result.data);
        toast({
          title: "Business card scanned successfully!",
          description: tx("Extracted information for {0}", result.data.businessName),
        });
      } else {
        setError(result.message || 'Failed to extract business information');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setError('Failed to scan business card. Please try again.');
    } finally {
      clearProgress();
      setIsScanning(false);
    }
  };

  const generateScanRegions = (data: ExtractedBusinessInfo) => {
    // Generate mock regions for demonstration
    const regions: ScanRegion[] = [
      { x: 20, y: 20, width: 200, height: 30, label: 'Business Name', field: 'businessName' },
      { x: 20, y: 60, width: 150, height: 20, label: 'Contact Person', field: 'contactPerson' },
      { x: 20, y: 90, width: 120, height: 20, label: 'Job Title', field: 'jobTitle' },
      { x: 20, y: 120, width: 130, height: 20, label: 'Phone', field: 'phoneNumber' },
      { x: 20, y: 150, width: 180, height: 20, label: 'Email', field: 'email' },
      { x: 20, y: 180, width: 160, height: 20, label: 'Website', field: 'website' },
      { x: 20, y: 210, width: 220, height: 40, label: 'Address', field: 'address' },
    ];
    setScanRegions(regions);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRegionClick = (index: number) => {
    setSelectedRegion(index);
  };

  const handleFieldEdit = (field: string) => {
    setEditingField(field);
  };

  const handleFieldSave = (field: string, value: string) => {
    if (extractedInfo) {
      setExtractedInfo({
        ...extractedInfo,
        [field]: value
      });
    }
    setEditingField(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!" });
    } catch (error) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const resetScan = () => {
    setSelectedImage(null);
    setExtractedInfo(null);
    setScanRegions([]);
    setError(null);
    setScanProgress(0);
    setCurrentStep('');
    setZoom(1);
    setImagePosition({ x: 0, y: 0 });
    setSelectedRegion(null);
    setEditingField(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
            <Sparkles className="w-6 h-6 text-blue-500" />
            <span>Interactive Business Card Scanner</span>
          </CardTitle>
          <CardDescription>
            Advanced AI-powered scanning with real-time preview and editing capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4 me-2" />
                Upload Image
              </TabsTrigger>
              <TabsTrigger value="camera">
                <Camera className="w-4 h-4 me-2" />
                Take Photo
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={!selectedImage}>
                <Eye className="w-4 h-4 me-2" />
                Preview & Edit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="space-y-4">
                  <FileImage className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium">Upload Business Card</h3>
                    <p className="text-gray-500">
                      Drag and drop or click to select an image file
                    </p>
                  </div>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4"
                  >
                    <Upload className="w-4 h-4 me-2" />
                    Choose File
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="camera" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="space-y-4">
                  <Camera className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium">Take Photo</h3>
                    <p className="text-gray-500">
                      Use your device camera to capture the business card
                    </p>
                  </div>
                  <Button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="mt-4"
                  >
                    <Camera className="w-4 h-4 me-2" />
                    Open Camera
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {selectedImage && (
                <div className="space-y-4">
                  {/* Image Preview Controls */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.5}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomIn}
                        disabled={zoom >= 3}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{tj("{0} Regions", showPreview ? 'Hide' : 'Show')}</Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetScan}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </Button>
                    </div>
                  </div>

                  {/* Interactive Image Preview */}
                  <div 
                    ref={imageRef}
                    className="relative border rounded-lg overflow-hidden bg-gray-100"
                    style={{ height: '400px', cursor: isDragging ? 'grabbing' : 'grab' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <div
                      className="relative"
                      style={{
                        transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${zoom})`,
                        transformOrigin: 'center',
                        transition: isDragging ? 'none' : 'transform 0.2s ease'
                      }}
                    >
                      <img
                        src={selectedImage}
                        alt="Business Card"
                        className="max-w-full h-auto"
                        draggable={false}
                      />
                      
                      {/* Scan Regions Overlay */}
                      {showPreview && scanRegions.map((region, index) => (
                        <div
                          key={index}
                          className={`absolute border-2 rounded ${
                            selectedRegion === index 
                              ? 'border-blue-500 bg-blue-500 bg-opacity-20' 
                              : 'border-green-500 bg-green-500 bg-opacity-10'
                          } cursor-pointer hover:bg-opacity-30 transition-all`}
                          style={{
                            left: region.x,
                            top: region.y,
                            width: region.width,
                            height: region.height
                          }}
                          onClick={() => handleRegionClick(index)}
                        >
                          <div className="absolute -top-6 start-0 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            {region.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scan Button */}
                  <div className="text-center">
                    <Button
                      onClick={scanBusinessCard}
                      disabled={isScanning}
                      size="lg"
                      className="min-w-48"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="w-5 h-5 me-2 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Scan className="w-5 h-5 me-2" />
                          Scan Business Card
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Progress Indicator */}
                  {isScanning && (
                    <div className="space-y-3">
                      <Progress value={scanProgress} className="h-2" />
                      <p className="text-center text-sm text-gray-600 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 me-2 animate-spin" />
                        {currentStep}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Extracted Information Display */}
      {extractedInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Extracted Information</span>
                <Badge variant="secondary">{tj("{0}% confidence", Math.round(extractedInfo.confidence * 100))}</Badge>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(extractedInfo, null, 2))}
                >
                  <Copy className="w-4 h-4 me-2" />
                  Copy All
                </Button>
                {onAddBusiness && (
                  <Button
                    onClick={() => onAddBusiness(extractedInfo)}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 me-2" />
                    Add Business
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Business Details</h3>
                
                {Object.entries({
                  'Business Name': extractedInfo.businessName,
                  'Business Type': extractedInfo.businessType,
                  'Contact Person': extractedInfo.contactPerson,
                  'Job Title': extractedInfo.jobTitle,
                  'Phone Number': extractedInfo.phoneNumber,
                  'Email': extractedInfo.email,
                  'Website': extractedInfo.website
                }).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-600">{label}</Label>
                      {editingField === label.toLowerCase().replace(' ', '') ? (
                        <Input
                          defaultValue={value}
                          className="mt-1"
                          onBlur={(e) => handleFieldSave(label.toLowerCase().replace(' ', ''), e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleFieldSave(label.toLowerCase().replace(' ', ''), e.currentTarget.value);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm font-medium mt-1">{value || 'Not detected'}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 rtl:space-x-reverse ms-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFieldEdit(label.toLowerCase().replace(' ', ''))}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(value)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Location & Additional Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Location & Additional Info</h3>
                
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">Address</Label>
                    <p className="text-sm font-medium mt-1">{extractedInfo.address || 'Not detected'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <Label className="text-sm font-medium text-gray-600">City</Label>
                      <p className="text-sm font-medium mt-1">{extractedInfo.city || 'Not detected'}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <Label className="text-sm font-medium text-gray-600">Province</Label>
                      <p className="text-sm font-medium mt-1">{extractedInfo.province || 'Not detected'}</p>
                    </div>
                  </div>

                  {extractedInfo.services && extractedInfo.services.length > 0 && (
                    <div className="p-3 border rounded-lg">
                      <Label className="text-sm font-medium text-gray-600">Services</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {extractedInfo.services.map((service, index) => (
                          <Badge key={index} variant="outline">{service}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {extractedInfo.additionalInfo && (
                    <div className="p-3 border rounded-lg">
                      <Label className="text-sm font-medium text-gray-600">Additional Information</Label>
                      <p className="text-sm mt-1">{extractedInfo.additionalInfo}</p>
                    </div>
                  )}

                  {/* Social Media */}
                  {Object.values(extractedInfo.socialMedia).some(url => url) && (
                    <div className="p-3 border rounded-lg">
                      <Label className="text-sm font-medium text-gray-600">Social Media</Label>
                      <div className="space-y-2 mt-2">
                        {Object.entries(extractedInfo.socialMedia).map(([platform, url]) => 
                          url && (
                            <div key={platform} className="flex items-center justify-between">
                              <span className="text-sm capitalize">{platform}:</span>
                              <a href={url} target="_blank" rel="noopener noreferrer" 
                                 className="text-sm text-blue-600 hover:underline">
                                {url}
                              </a>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <Clock className="w-5 h-5" />
              <span>Recent Scans</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scanHistory.map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{scan.businessName}</p>
                    <p className="text-sm text-gray-600">{scan.contactPerson} • {scan.phoneNumber}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExtractedInfo(scan)}
                  >
                    Load
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}