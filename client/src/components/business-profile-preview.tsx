import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Lightbulb, MapPin, Phone, Mail, Globe, Clock, Star, Building, Users, Award, CheckCircle2, AlertCircle, Sparkles, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { localize } from '@shared/country';

interface BusinessProfilePreviewProps {
  formData: any;
  categories: any[];
  provinces: any[];
  localities: any[];
}

interface DesignSuggestion {
  type: 'critical' | 'improvement' | 'enhancement';
  title: string;
  description: string;
  field?: string;
  impact: 'high' | 'medium' | 'low';
}

export default function BusinessProfilePreview({ formData, categories, provinces, localities }: BusinessProfilePreviewProps) {
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);
  const [completionScore, setCompletionScore] = useState(0);

  // Get category and location names
  const primaryCategory = categories.find(cat => cat.id === parseInt(formData.categoryId));
  const additionalCategories = formData.additionalCategoryIds?.map((id: string) => 
    categories.find(cat => cat.id === parseInt(id))
  ).filter(Boolean) || [];
  const province = provinces.find(em => em.id === parseInt(formData.provinceId));
  const locality = localities.find(loc => loc.id === parseInt(formData.localityId));

  // Calculate profile completion score
  useEffect(() => {
    const fields = [
      formData.name,
      formData.description,
      formData.phone,
      formData.email,
      formData.address,
      formData.categoryId,
      formData.provinceId,
      formData.workingHours,
      formData.services,
      formData.website,
      formData.logo,
      formData.arabicName,
      formData.shortDescription,
      formData.products,
      formData.specialties,
      formData.facebook || formData.instagram || formData.linkedin,
      formData.establishedYear,
      formData.employeeCount
    ];
    
    const filledFields = fields.filter(field => field && field.trim !== '').length;
    const score = Math.round((filledFields / fields.length) * 100);
    setCompletionScore(score);
  }, [formData]);

  // Generate AI-powered design suggestions
  useEffect(() => {
    const newSuggestions: DesignSuggestion[] = [];

    // Critical suggestions
    if (!formData.name?.trim()) {
      newSuggestions.push({
        type: 'critical',
        title: 'Business Name Required',
        description: 'Add your business name to create a professional profile',
        field: 'name',
        impact: 'high'
      });
    }

    if (!formData.description?.trim()) {
      newSuggestions.push({
        type: 'critical',
        title: 'Business Description Missing',
        description: 'A compelling description helps customers understand your services',
        field: 'description',
        impact: 'high'
      });
    }

    // Improvement suggestions
    if (formData.description && formData.description.length < 100) {
      newSuggestions.push({
        type: 'improvement',
        title: 'Expand Your Description',
        description: 'Descriptions over 100 characters get 40% more customer engagement',
        field: 'description',
        impact: 'medium'
      });
    }

    if (!formData.logo?.trim()) {
      newSuggestions.push({
        type: 'improvement',
        title: 'Add Business Logo',
        description: 'Profiles with logos receive 60% more views and appear more trustworthy',
        field: 'logo',
        impact: 'medium'
      });
    }

    if (!formData.website?.trim()) {
      newSuggestions.push({
        type: 'improvement',
        title: 'Add Website URL',
        description: 'Businesses with websites get 3x more customer inquiries',
        field: 'website',
        impact: 'medium'
      });
    }

    if (!formData.services?.trim()) {
      newSuggestions.push({
        type: 'improvement',
        title: 'List Your Services',
        description: 'Detailed service lists help customers find exactly what they need',
        field: 'services',
        impact: 'medium'
      });
    }

    // Enhancement suggestions
    if (!formData.arabicName?.trim()) {
      newSuggestions.push({
        type: 'enhancement',
        title: 'Add Arabic Business Name',
        description: localize('Arabic names improve discoverability for local Pakistani customers'),
        field: 'arabicName',
        impact: 'low'
      });
    }

    if (!formData.shortDescription?.trim()) {
      newSuggestions.push({
        type: 'enhancement',
        title: 'Add Short Description',
        description: 'A catchy tagline helps your business stand out in search results',
        field: 'shortDescription',
        impact: 'low'
      });
    }

    if (!formData.facebook && !formData.instagram && !formData.linkedin) {
      newSuggestions.push({
        type: 'enhancement',
        title: 'Connect Social Media',
        description: 'Social media links increase customer trust and engagement by 25%',
        impact: 'low'
      });
    }

    if (!formData.establishedYear) {
      newSuggestions.push({
        type: 'enhancement',
        title: 'Add Establishment Year',
        description: 'Showing business history builds customer confidence',
        field: 'establishedYear',
        impact: 'low'
      });
    }

    setSuggestions(newSuggestions);
  }, [formData]);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'improvement': return <Lightbulb className="h-4 w-4 text-[#B45309]" />;
      case 'enhancement': return <Sparkles className="h-4 w-4 text-blue-500" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-[#B45309]';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="space-y-6">
      {/* Profile Completion Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Profile Completion
            </CardTitle>
            <span className={`text-2xl font-bold ${getScoreColor(completionScore)}`}>
              {completionScore}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={completionScore} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{getScoreLabel(completionScore)} Profile</span>
              <span>{completionScore >= 80 ? 'Ready to publish!' : 'Keep improving'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Business Profile Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Profile Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Business Header */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-[#E8F4EC] rounded-[14px] flex items-center justify-center">
              {formData.logo ? (
                <img src={formData.logo} alt="Logo" className="w-full h-full object-contain rounded-lg" />
              ) : (
                <Building className="h-8 w-8 text-[#0B6B2E]" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">
                {formData.name || 'Your Business Name'}
              </h3>
              {formData.arabicName && (
                <p className="text-lg text-gray-600 font-arabic">{formData.arabicName}</p>
              )}
              {formData.shortDescription && (
                <p className="text-sm text-gray-600 mt-1">{formData.shortDescription}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {primaryCategory && (
                  <Badge variant="default" className="bg-[#E8F4EC] text-[#05501F]">
                    {primaryCategory.name}
                  </Badge>
                )}
                {additionalCategories.map((cat, idx) => (
                  <Badge key={idx} variant="outline" className="border-[#E3E6EC] text-[#3A4354]">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Business Description */}
          {formData.description && (
            <div>
              <h4 className="font-semibold mb-2">About Us</h4>
              <p className="text-gray-700 leading-relaxed">{formData.description}</p>
            </div>
          )}

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold mb-3">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formData.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{formData.phone}</span>
                </div>
              )}
              {formData.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{formData.email}</span>
                </div>
              )}
              {formData.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-blue-600">{formData.website}</span>
                </div>
              )}
              {(province || locality || formData.address) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {[formData.address, locality?.name, province?.name].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Working Hours */}
          {formData.workingHours && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Working Hours
              </h4>
              <p className="text-sm text-gray-700">{formData.workingHours}</p>
            </div>
          )}

          {/* Services */}
          {formData.services && (
            <div>
              <h4 className="font-semibold mb-2">Services</h4>
              <div className="flex flex-wrap gap-2">
                {formData.services.split(',').map((service: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {service.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {formData.products && (
            <div>
              <h4 className="font-semibold mb-2">Products</h4>
              <div className="flex flex-wrap gap-2">
                {formData.products.split(',').map((product: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {product.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Business Details */}
          {(formData.establishedYear || formData.employeeCount) && (
            <div>
              <h4 className="font-semibold mb-2">Business Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {formData.establishedYear && (
                  <div>
                    <span className="text-gray-500">Established:</span>
                    <span className="ml-2 font-medium">{formData.establishedYear}</span>
                  </div>
                )}
                {formData.employeeCount && (
                  <div>
                    <span className="text-gray-500">Team Size:</span>
                    <span className="ml-2 font-medium">{formData.employeeCount}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Design Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Profile Suggestions ({suggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.slice(0, 5).map((suggestion, idx) => (
              <Alert key={idx} className={`rounded-[14px] ${
                suggestion.type === 'critical' ? 'border-[#F5C2C4] bg-[#FDECEC]' :
                suggestion.type === 'improvement' ? 'border-[#F5DDB0] bg-[#FFF4E0]' :
                'border-[#CFE8D8] bg-[#F2F9F4]'
              }`}>
                <div className="flex items-start gap-3">
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{suggestion.title}</h5>
                    <AlertDescription className="text-xs mt-1">
                      {suggestion.description}
                    </AlertDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.impact} impact
                  </Badge>
                </div>
              </Alert>
            ))}
            
            {suggestions.length > 5 && (
              <p className="text-sm text-gray-500 text-center">
                +{suggestions.length - 5} more suggestions available
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}