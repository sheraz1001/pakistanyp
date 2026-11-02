import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PlusCircle, MessageSquarePlus, Building } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface CategoryRequestFormProps {
  onSuccess?: () => void;
}

export function CategoryRequestForm({ onSuccess }: CategoryRequestFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    categoryName: "",
    description: "",
    parentCategory: "",
    businessType: "",
    requesterName: "",
    requesterEmail: "",
    requesterPhone: "",
    companyName: "",
    justification: ""
  });

  const submitCategoryRequest = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('POST', '/api/category-requests', data);
    },
    onSuccess: () => {
      toast({
        title: "Category Request Submitted Successfully!",
        description: "You will receive a confirmation email shortly. Our admin team has been notified and will review your request within 2-5 business days.",
      });
      
      // Reset form
      setFormData({
        categoryName: "",
        description: "",
        parentCategory: "",
        businessType: "",
        requesterName: "",
        requesterEmail: "",
        requesterPhone: "",
        companyName: "",
        justification: ""
      });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit category request. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.categoryName || !formData.requesterName || !formData.requesterEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in the category name, your name, and email address.",
        variant: "destructive"
      });
      return;
    }

    submitCategoryRequest.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <PlusCircle className="h-6 w-6 text-green-600" />
          <CardTitle className="text-2xl">Request New Category</CardTitle>
        </div>
        <CardDescription>
          Can't find the right category for your business? Tell us what's missing and we'll add it to our directory.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquarePlus className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Category Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoryName">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="categoryName"
                  value={formData.categoryName}
                  onChange={(e) => handleChange('categoryName', e.target.value)}
                  placeholder="e.g., Sustainable Packaging, Drone Services"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="parentCategory">Parent Category (if applicable)</Label>
                <Input
                  id="parentCategory"
                  value={formData.parentCategory}
                  onChange={(e) => handleChange('parentCategory', e.target.value)}
                  placeholder="e.g., Technology, Manufacturing"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Category Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Briefly describe what businesses would be included in this category..."
                className="h-20"
              />
            </div>
            
            <div>
              <Label htmlFor="businessType">Type of Businesses</Label>
              <Input
                id="businessType"
                value={formData.businessType}
                onChange={(e) => handleChange('businessType', e.target.value)}
                placeholder="e.g., Service providers, Manufacturers, Consultants"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Building className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Your Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requesterName">
                  Your Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="requesterName"
                  value={formData.requesterName}
                  onChange={(e) => handleChange('requesterName', e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="requesterEmail">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="requesterEmail"
                  type="email"
                  value={formData.requesterEmail}
                  onChange={(e) => handleChange('requesterEmail', e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requesterPhone">Phone Number</Label>
                <Input
                  id="requesterPhone"
                  value={formData.requesterPhone}
                  onChange={(e) => handleChange('requesterPhone', e.target.value)}
                  placeholder="+92 XX XXX XXXX"
                />
              </div>
              
              <div>
                <Label htmlFor="companyName">Company/Organization</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="Your company name"
                />
              </div>
            </div>
          </div>

          {/* Justification */}
          <div>
            <Label htmlFor="justification">Why is this category needed?</Label>
            <Textarea
              id="justification"
              value={formData.justification}
              onChange={(e) => handleChange('justification', e.target.value)}
              placeholder="Explain why this category would be valuable for the PakistanYP business directory..."
              className="h-24"
            />
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              type="submit" 
              size="lg"
              disabled={submitCategoryRequest.isPending}
              className="bg-green-600 hover:bg-green-700 px-8"
            >
              {submitCategoryRequest.isPending ? "Submitting..." : "Submit Category Request"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}