import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { QrCode, Download, Share2, Copy, Facebook, Twitter, Mail, MessageCircle } from "lucide-react";
import QRCode from "qrcode";
import { country } from "@shared/country";
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

interface Business {
  id: number;
  name: string;
  slug: string;
  category?: string;
  province?: string;
  rating?: number;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
}

interface QuickShareQRCodeProps {
  business: Business;
  size?: "sm" | "md" | "lg";
  showShareButtons?: boolean;
}

export default function QuickShareQRCode({ 
  business, 
  size = "md", 
  showShareButtons = true 
}: QuickShareQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Generate the business profile URL
  const businessUrl = `${country.origin}/business/${business.slug}`;
  
  // QR code options based on size
  const qrOptions = {
    width: size === "sm" ? 150 : size === "md" ? 200 : 300,
    margin: 2,
    color: {
      dark: "#0A0A0A", // Dark color
      light: "#ffffff", // Light color
    },
    errorCorrectionLevel: "M" as const,
  };

  // Generate QR code when component mounts or business changes
  useEffect(() => {
    if (business?.slug) {
      generateQRCode();
    }
  }, [business?.slug]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(businessUrl, qrOptions);
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement("a");
    link.download = `${business.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`;
    link.href = qrCodeUrl;
    link.click();
    
    toast({
      title: "Success",
      description: "QR code downloaded successfully!",
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: tx("{0} copied to clipboard", label),
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareToSocial = (platform: string) => {
    const text = `Check out ${business.name} on ${country.directoryName}`;
    const url = businessUrl;
    
    let shareUrl = "";
    
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const buttonSizes = {
    sm: "min-h-[40px] px-3 text-sm",
    md: "min-h-[44px] px-4 text-sm",
    lg: "min-h-[48px] px-5 text-[15px]",
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`${buttonSizes[size]} flex items-center gap-2`}
        >
          <QrCode className="h-4 w-4" />
          Quick Share
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[#0B6B2E]" />{tj("Quick Share - {0}", business.name)}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* QR Code Display */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-[14px] border border-[#E7E9EE]">
                {isGenerating ? (
                  <div className="flex items-center justify-center w-48 h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B6B2E]"></div>
                  </div>
                ) : qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt={tx("QR Code for {0}", business.name)}
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="flex items-center justify-center w-48 h-48 bg-[#F7F8FA] rounded-[12px]">
                    <QrCode className="h-12 w-12 text-[#5B6475]" />
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-[#5B6475]">
                  Scan to view business profile
                </p>
                {(business.category || business.province) && (
                  <Badge variant="secondary" className="text-xs">
                    {[business.category, business.province].filter(Boolean).join(" • ")}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={downloadQRCode}
                  disabled={!qrCodeUrl}
                  className="flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Download
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(businessUrl, "Business URL")}
                >
                  <Copy className="h-3 w-3" />
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Share Options */}
          {showShareButtons && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Share Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareToSocial("facebook")}
                    className="flex items-center gap-2"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareToSocial("twitter")}
                    className="flex items-center gap-2"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareToSocial("whatsapp")}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4 text-[#0B6B2E]" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareToSocial("email")}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Business Info Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Name:</span> {business.name}
              </div>
              {business.phone && (
                <div className="text-sm">
                  <span className="font-medium">Phone:</span> {business.phone}
                </div>
              )}
              {business.email && (
                <div className="text-sm">
                  <span className="font-medium">Email:</span> {business.email}
                </div>
              )}
              {business.website && (
                <div className="text-sm">
                  <span className="font-medium">Website:</span> 
                  <a 
                    href={business.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#0B6B2E] hover:text-[#05501F] ms-1 break-all"
                  >
                    {business.website}
                  </a>
                </div>
              )}
              <div className="text-xs text-[#5B6475] pt-2 break-all">{tj("URL: {0}", businessUrl)}</div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}