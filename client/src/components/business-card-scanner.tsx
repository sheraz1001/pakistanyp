import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Camera, 
  Scan, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Download,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface BusinessCardScannerProps {
  onBusinessExtracted?: (businessInfo: ExtractedBusinessInfo) => void;
  onAddBusiness?: (businessInfo: ExtractedBusinessInfo) => void;
}

export function BusinessCardScanner({ onBusinessExtracted, onAddBusiness }: BusinessCardScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedBusinessInfo | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ExtractedBusinessInfo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
    };
    reader.readAsDataURL(file);
  };

  const scanBusinessCard = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setError(null);

    try {
      // Convert base64 to blob for API upload
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
        setScanHistory(prev => [result.data, ...prev.slice(0, 4)]); // Keep last 5 scans
        onBusinessExtracted?.(result.data);
        toast({
          title: "Business card scanned successfully!",
          description: `Extracted information for ${result.data.businessName}`,
        });
      } else {
        setError(result.message || 'Failed to extract business information');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setError('Failed to scan business card. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddBusiness = () => {
    if (extractedInfo) {
      onAddBusiness?.(extractedInfo);
      toast({
        title: "Business information ready",
        description: "You can now review and submit the business details",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Text copied successfully",
    });
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setExtractedInfo(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const downloadExtractedData = () => {
    if (!extractedInfo) return;
    
    const dataStr = JSON.stringify(extractedInfo, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${extractedInfo.businessName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_business_card.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Business Card Magic Scanner
          </CardTitle>
          <CardDescription>
            Upload a business card image and automatically extract all business information using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Image</TabsTrigger>
              <TabsTrigger value="camera">Take Photo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">Upload Business Card Image</p>
                <p className="text-sm text-gray-600 mb-4">
                  Supports JPG, PNG, WEBP up to 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mb-4"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="camera" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">Take Photo of Business Card</p>
                <p className="text-sm text-gray-600 mb-4">
                  Use your device camera to capture the business card
                </p>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  onClick={() => cameraInputRef.current?.click()}
                  variant="outline"
                  className="mb-4"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {selectedImage && (
            <div className="mt-6 space-y-4">
              <div className="border rounded-lg p-4">
                <Label className="text-sm font-medium">Preview</Label>
                <img 
                  src={selectedImage} 
                  alt="Business card preview" 
                  className="mt-2 max-w-full h-auto max-h-64 object-contain mx-auto border rounded"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={scanBusinessCard}
                  disabled={isScanning}
                  className="flex-1"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Scan className="h-4 w-4 mr-2" />
                      Scan Business Card
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={resetScanner}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {extractedInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Extracted Business Information
            </CardTitle>
            <CardDescription>
              AI confidence: {Math.round(extractedInfo.confidence * 100)}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Business Name</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={extractedInfo.businessName} 
                    readOnly 
                    className="bg-gray-50"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(extractedInfo.businessName)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Contact Person</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={extractedInfo.contactPerson} 
                    readOnly 
                    className="bg-gray-50"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(extractedInfo.contactPerson)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Job Title</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={extractedInfo.jobTitle} 
                    readOnly 
                    className="bg-gray-50"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(extractedInfo.jobTitle)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Phone Number</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={extractedInfo.phoneNumber} 
                    readOnly 
                    className="bg-gray-50"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(extractedInfo.phoneNumber)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={extractedInfo.email} 
                    readOnly 
                    className="bg-gray-50"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(extractedInfo.email)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Website</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={extractedInfo.website} 
                    readOnly 
                    className="bg-gray-50"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(extractedInfo.website)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Address</Label>
              <div className="flex items-center gap-2">
                <Textarea 
                  value={extractedInfo.address} 
                  readOnly 
                  className="bg-gray-50 min-h-[60px]"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(extractedInfo.address)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">City</Label>
                <Input 
                  value={extractedInfo.city} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Province</Label>
                <Input 
                  value={extractedInfo.province} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>
            </div>

            {extractedInfo.services.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Services</Label>
                <div className="flex flex-wrap gap-2">
                  {extractedInfo.services.map((service, index) => (
                    <Badge key={index} variant="secondary">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {extractedInfo.additionalInfo && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Additional Information</Label>
                <Textarea 
                  value={extractedInfo.additionalInfo} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleAddBusiness}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Add Business to Directory
              </Button>
              
              <Button 
                onClick={downloadExtractedData}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
            <CardDescription>Your recent business card scans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.map((scan, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => setExtractedInfo(scan)}
                >
                  <div>
                    <p className="font-medium">{scan.businessName}</p>
                    <p className="text-sm text-gray-600">{scan.contactPerson} • {scan.jobTitle}</p>
                  </div>
                  <Badge variant="outline">
                    {Math.round(scan.confidence * 100)}% confidence
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}