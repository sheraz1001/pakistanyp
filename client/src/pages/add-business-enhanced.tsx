import { LEGAL_FORMS } from "@shared/countries/locale";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// Removed Tabs import - using single page layout
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Hash, Wrench, Building2, MapPin, Phone, Mail, Globe, Clock, Image, Users, Award, Languages, CreditCard, Share2, Star, Crown, X, Plus, AlertCircle, Search, CheckCircle, Scan, Crop } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { Category, Province, Locality } from "@shared/schema";
import { trackEvent } from "@/lib/analytics";
import AIAutocomplete from "@/components/ai-autocomplete";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SEO from "@/components/seo";
import { country, localize } from "@shared/country";

const homeFlag = country.iso.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
const aRegion = `a ${country.regionTerm.singular.toLowerCase()}`;
import BusinessProfilePreview from "@/components/business-profile-preview";
import DropdownCategorySelector from "@/components/dropdown-category-selector";
import { LocationPicker } from "@/components/location-picker";
import ImageCropDialog from "@/components/image-crop-dialog";


const businessFormSchema = z.object({
  // Basic Information
  name: z.string().min(2, "Business name must be at least 2 characters").max(200, "Business name cannot exceed 200 characters"),
  arabicName: z.string().max(200, "Local-language name cannot exceed 200 characters").optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  shortDescription: z.string().max(500, "Short description cannot exceed 500 characters").optional(),
  categoryId: z.string().min(1, "Please select a main category and a sub-category"),
  additionalCategoryIds: z.array(z.string()).min(0, "Invalid category selection"),
  provinceId: z.string().min(1, `Please select ${aRegion}`),
  cityId: z.string().min(1, "Please select a city"),
  localityId: z.string().min(1, "Please select a locality"),
  
  // Contact Information
  phone: z.string().min(8, "Phone number must be at least 8 characters").max(50, "Phone number cannot exceed 50 characters"),
  whatsapp: z.string().max(50, "WhatsApp number cannot exceed 50 characters").optional(),
  email: z.string().email("Please enter a valid email address").max(200, "Email cannot exceed 200 characters"),
  website: z.string().url("Please enter a valid website URL").max(500, "Website URL cannot exceed 500 characters").optional().or(z.literal("")),
  
  // Address Information
  address: z.string().min(5, "Address must be at least 5 characters"),
  locality: z.string().max(200, "Locality cannot exceed 200 characters").optional(),
  poBox: z.string().max(100, "P.O. Box cannot exceed 100 characters").optional(),
  googleMapsUrl: z.string().max(500, "Google Maps URL cannot exceed 500 characters").optional(),
  
  // Business Details
  workingHours: z.string().min(5, "Working hours must be at least 5 characters"),
  establishedYear: z.string().optional(),
  employeeCount: z.string().max(50, "Employee count cannot exceed 50 characters").optional(),
  companySize: z.string().max(50, "Company size cannot exceed 50 characters").optional(),
  legalForm: z.string().max(100, "Legal form cannot exceed 100 characters").optional(),
  vatNumber: z.string().max(50, "VAT number cannot exceed 50 characters").optional(),
  tradeLicense: z.string().max(100, "Trade license cannot exceed 100 characters").optional(),
  
  // Profile Content
  logo: z.string().optional(), // File upload path or base64 data
  services: z.string().optional(),
  products: z.string().optional(),
  specialties: z.string().optional(),
  certifications: z.string().optional(),
  awards: z.string().optional(),
  languages: z.string().optional(),
  paymentMethods: z.string().optional(),
  deliveryAreas: z.string().optional(),
  
  // Social Media
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
  tiktok: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessFormSchema>;

export default function AddBusinessEnhanced() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  // State for logo upload and cropping
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [originalLogoSrc, setOriginalLogoSrc] = useState<string>("");
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [pendingLogoSave, setPendingLogoSave] = useState<string>("");

  const [phoneCountryCode, setPhoneCountryCode] = useState(country.phonePrefix);
  const [whatsappCountryCode, setWhatsappCountryCode] = useState(country.phonePrefix);
  const [isAlwaysOpen, setIsAlwaysOpen] = useState(false);
  const [workingHours, setWorkingHours] = useState({
    sunday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
    monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
    friday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
    saturday: { isOpen: true, openTime: '09:00', closeTime: '17:00' }
  });

  // Form sections configuration
  const formSections = [
    { id: 'basic-info', label: 'Basic Info', icon: Building2, required: true },
    { id: 'contact-info', label: 'Contact', icon: Phone, required: true },
    { id: 'location-info', label: 'Location', icon: MapPin, required: true },
    { id: 'business-details', label: 'Details', icon: Users, required: false },
    { id: 'services-content', label: 'Services', icon: Award, required: false },
    { id: 'social-media', label: 'Social', icon: Globe, required: false }
  ];

  // Calculate form completion progress
  const calculateProgress = () => {
    const watchedValues = form.watch();
    const requiredFields = ['name', 'description', 'categoryId', 'provinceId', 'cityId', 'localityId', 'phone', 'email', 'address', 'workingHours'];
    const completedRequired = requiredFields.filter(field => watchedValues[field] && watchedValues[field].toString().trim().length > 0).length;
    
    const optionalFields = ['website', 'services', 'products', 'facebook', 'instagram', 'twitter', 'linkedin'];
    const completedOptional = optionalFields.filter(field => watchedValues[field] && watchedValues[field].toString().trim().length > 0).length;
    
    const totalProgress = (completedRequired / requiredFields.length) * 70 + (completedOptional / optionalFields.length) * 30;
    
    return {
      overall: Math.round(totalProgress),
      required: completedRequired,
      totalRequired: requiredFields.length,
      optional: completedOptional,
      totalOptional: optionalFields.length
    };
  };

  // Check section completion
  const isSectionCompleted = (sectionId: string) => {
    const values = form.watch();
    switch (sectionId) {
      case 'basic-info':
        return !!(values.name && values.description && values.categoryId);
      case 'contact-info':
        return !!(values.phone && values.email && values.workingHours);
      case 'location-info':
        return !!(values.provinceId && values.cityId && values.localityId && values.address);
      case 'business-details':
        return !!(values.establishedYear || values.employeeCount || values.legalForm);
      case 'services-content':
        return !!(values.services || values.products || values.specialties);
      case 'social-media':
        return !!(values.website || values.facebook || values.instagram || values.twitter || values.linkedin);
      default:
        return false;
    }
  };

  // Helper functions for working hours
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const formatTimeDisplay = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const generateWorkingHoursString = (hours: any) => {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const openDays = [];
    const closedDays = [];
    
    daysOfWeek.forEach(day => {
      if (hours[day].isOpen) {
        openDays.push({
          day: day.charAt(0).toUpperCase() + day.slice(1),
          open: formatTimeDisplay(hours[day].openTime),
          close: formatTimeDisplay(hours[day].closeTime)
        });
      } else {
        closedDays.push(day.charAt(0).toUpperCase() + day.slice(1));
      }
    });
    
    let schedule = [];
    if (openDays.length > 0) {
      // Group consecutive days with same hours
      const grouped = groupConsecutiveDays(openDays);
      grouped.forEach(group => {
        if (group.length === 1) {
          schedule.push(`${group[0].day}: ${group[0].open} - ${group[0].close}`);
        } else {
          schedule.push(`${group[0].day}-${group[group.length-1].day}: ${group[0].open} - ${group[0].close}`);
        }
      });
    }
    
    if (closedDays.length > 0) {
      schedule.push(`${closedDays.join(', ')}: Closed`);
    }
    
    return schedule.join(', ');
  };

  const groupConsecutiveDays = (days: any[]) => {
    const groups = [];
    let currentGroup = [days[0]];
    
    for (let i = 1; i < days.length; i++) {
      const current = days[i];
      const previous = days[i-1];
      
      if (current.open === previous.open && current.close === previous.close) {
        currentGroup.push(current);
      } else {
        groups.push(currentGroup);
        currentGroup = [current];
      }
    }
    groups.push(currentGroup);
    return groups;
  };
  
  // Check if we're in edit mode
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const editBusinessId = urlParams.get('edit');
  const isEditMode = !!editBusinessId;

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      name: "",
      arabicName: "",
      description: "",
      shortDescription: "",
      categoryId: "",
      additionalCategoryIds: [],
      provinceId: "",
      cityId: "",
      localityId: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      address: "",
      locality: "",
      poBox: "",
      googleMapsUrl: "",
      workingHours: "Sunday-Thursday: 9:00 AM - 5:00 PM, Friday: Closed, Saturday: 9:00 AM - 5:00 PM",
      establishedYear: "",
      employeeCount: "",
      companySize: "",
      legalForm: "",
      vatNumber: "",
      tradeLicense: "",
      logo: "",
      services: "",
      products: "",
      specialties: "",
      certifications: "",
      awards: "",
      languages: "",
      paymentMethods: "",
      deliveryAreas: "",
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      youtube: "",
      tiktok: "",
    },
  });

  // Initialize working hours string on component mount
  useEffect(() => {
    const initialHoursString = generateWorkingHoursString(workingHours);
    form.setValue("workingHours", initialHoursString);
  }, []);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to add a business. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
  });

  const { data: provinces = [] } = useQuery<Province[]>({
    queryKey: ["/api/provinces"],
    enabled: isAuthenticated,
  });

  const { data: localities = [] } = useQuery<Locality[]>({
    queryKey: ["/api/localities", selectedProvinceId],
    enabled: isAuthenticated,
  });

  // Get user's membership status
  const { data: userMembership } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
  });

  // Load business data if editing
  const { data: existingBusiness } = useQuery({
    queryKey: ["/api/businesses", editBusinessId],
    enabled: isAuthenticated && isEditMode && !!editBusinessId,
  });

  // Update form when existing business data loads
  useEffect(() => {
    if (existingBusiness && isEditMode) {
      const businessData = {
        name: existingBusiness.name || "",
        arabicName: existingBusiness.arabicName || "",
        description: existingBusiness.description || "",
        shortDescription: existingBusiness.shortDescription || "",
        categoryId: existingBusiness.categoryId?.toString() || "",
        additionalCategoryIds: existingBusiness.additionalCategoryIds?.map(id => id.toString()) || [],
        provinceId: existingBusiness.provinceId?.toString() || "",
        cityId: "",
        localityId: existingBusiness.localityId?.toString() || "",
        phone: existingBusiness.phone || "",
        whatsapp: existingBusiness.whatsapp || "",
        email: existingBusiness.email || "",
        website: existingBusiness.website || "",
        address: existingBusiness.address || "",
        locality: existingBusiness.locality || "",
        poBox: existingBusiness.poBox || "",
        googleMapsUrl: existingBusiness.googleMapsUrl || "",
        workingHours: existingBusiness.workingHours || "",
        establishedYear: existingBusiness.establishedYear?.toString() || "",
        employeeCount: existingBusiness.employeeCount || "",
        companySize: existingBusiness.companySize || "",
        legalForm: existingBusiness.legalForm || "",
        vatNumber: existingBusiness.vatNumber || "",
        tradeLicense: existingBusiness.tradeLicense || "",
        logo: existingBusiness.logo || "",
        services: Array.isArray(existingBusiness.services) ? existingBusiness.services.join(', ') : "",
        products: Array.isArray(existingBusiness.products) ? existingBusiness.products.join(', ') : "",
        specialties: Array.isArray(existingBusiness.specialties) ? existingBusiness.specialties.join(', ') : "",
        certifications: Array.isArray(existingBusiness.certifications) ? existingBusiness.certifications.join(', ') : "",
        awards: Array.isArray(existingBusiness.awards) ? existingBusiness.awards.join(', ') : "",
        languages: Array.isArray(existingBusiness.languages) ? existingBusiness.languages.join(', ') : "",
        paymentMethods: Array.isArray(existingBusiness.paymentMethods) ? existingBusiness.paymentMethods.join(', ') : "",
        deliveryAreas: Array.isArray(existingBusiness.deliveryAreas) ? existingBusiness.deliveryAreas.join(', ') : "",
        facebook: existingBusiness.socialMediaUrls?.facebook || "",
        twitter: existingBusiness.socialMediaUrls?.twitter || "",
        instagram: existingBusiness.socialMediaUrls?.instagram || "",
        linkedin: existingBusiness.socialMediaUrls?.linkedin || "",
        youtube: existingBusiness.socialMediaUrls?.youtube || "",
        tiktok: existingBusiness.socialMediaUrls?.tiktok || "",
      };
      
      form.reset(businessData);
      setSelectedProvinceId(existingBusiness.provinceId?.toString() || "");
      setSelectedCategoryId(existingBusiness.categoryId?.toString() || "");
    }
  }, [existingBusiness, isEditMode, form]);

  // Check for business card data and pre-populate form
  useEffect(() => {
    const businessCardData = sessionStorage.getItem('businessCardData');
    if (businessCardData && !isEditMode) {
      try {
        const parsedData = JSON.parse(businessCardData);
        
        // Find province by name
        const province = provinces.find(e => e.name.toLowerCase() === parsedData.province?.toLowerCase());
        if (province) {
          setSelectedProvinceId(province.id.toString());
        }
        
        // Pre-populate form with business card data
        form.reset({
          name: parsedData.name || "",
          description: parsedData.description || parsedData.additionalInfo || "",
          phone: parsedData.phoneNumber || "",
          email: parsedData.email || "",
          website: parsedData.website || "",
          address: parsedData.address || "",
          services: parsedData.services || "",
          facebook: parsedData.socialMedia?.facebook || "",
          twitter: parsedData.socialMedia?.twitter || "",
          instagram: parsedData.socialMedia?.instagram || "",
          linkedin: parsedData.socialMedia?.linkedin || "",
          workingHours: "9:00 AM - 6:00 PM", // Default working hours
          // Keep existing defaults for other fields
          arabicName: "",
          shortDescription: "",
          categoryId: "",
          additionalCategoryIds: [],
          provinceId: province?.id.toString() || "",
          cityId: "",
          localityId: "",
          whatsapp: "",
          locality: "",
          poBox: "",
          googleMapsUrl: "",
          establishedYear: "",
          employeeCount: "",
          companySize: "",
          legalForm: "",
          vatNumber: "",
          tradeLicense: "",
          logo: "",
          products: "",
          specialties: "",
          certifications: "",
          awards: "",
          languages: "",
          paymentMethods: "",
          deliveryAreas: "",
          youtube: "",
          tiktok: "",
        });
        
        // Show success message
        toast({
          title: "Business card data loaded!",
          description: "The form has been pre-filled with scanned business card information.",
        });
        
        // Clear the session storage
        sessionStorage.removeItem('businessCardData');
      } catch (error) {
        console.error('Error parsing business card data:', error);
      }
    }
  }, [provinces, form, isEditMode, toast]);

  // Reset locality when province changes
  useEffect(() => {
    if (selectedProvinceId && form.getValues("localityId")) {
      // Check if current locality belongs to the selected province
      const currentLocalityId = form.getValues("localityId");
      const currentLocality = localities.find(l => l.id.toString() === currentLocalityId);
      
      if (currentLocality && currentLocality.provinceId.toString() !== selectedProvinceId) {
        form.setValue("localityId", "");
      }
    }
  }, [selectedProvinceId, localities, form]);

  // Helper function to parse working hours string into JSON format
  const parseWorkingHours = (workingHoursString: string) => {
    try {
      // If it's already a JSON string, parse it
      if (workingHoursString.startsWith('{')) {
        return JSON.parse(workingHoursString);
      }
      
      // Simple parser for common formats like "Monday-Friday: 9:00-18:00, Saturday: 9:00-14:00"
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const result: Record<string, { open: string; close: string; closed?: boolean }> = {};
      
      // Initialize all days as closed
      days.forEach(day => {
        result[day] = { open: '', close: '', closed: true };
      });
      
      // Parse the string
      const parts = workingHoursString.split(',').map(part => part.trim());
      
      for (const part of parts) {
        if (part.toLowerCase().includes('monday-friday') || part.toLowerCase().includes('mon-fri')) {
          const timeMatch = part.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            const [, openHour, openMin, closeHour, closeMin] = timeMatch;
            const openTime = `${openHour.padStart(2, '0')}:${openMin}`;
            const closeTime = `${closeHour.padStart(2, '0')}:${closeMin}`;
            
            ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
              result[day] = { open: openTime, close: closeTime, closed: false };
            });
          }
        } else {
          // Check for individual days
          const dayMatch = part.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i);
          const timeMatch = part.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
          
          if (dayMatch && timeMatch) {
            const dayName = dayMatch[1].toLowerCase();
            const fullDay = dayName.length === 3 ? 
              { mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday', sat: 'saturday', sun: 'sunday' }[dayName] || dayName 
              : dayName;
            
            const [, openHour, openMin, closeHour, closeMin] = timeMatch;
            const openTime = `${openHour.padStart(2, '0')}:${openMin}`;
            const closeTime = `${closeHour.padStart(2, '0')}:${closeMin}`;
            
            if (days.includes(fullDay)) {
              result[fullDay] = { open: openTime, close: closeTime, closed: false };
            }
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error parsing working hours:', error);
      // Return a default structure
      return {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '14:00', closed: false },
        sunday: { open: '', close: '', closed: true }
      };
    }
  };

  const addBusinessMutation = useMutation({
    mutationFn: async (data: BusinessFormData) => {
      const businessData = {
        name: data.name,
        arabicName: data.arabicName || null,
        description: data.description,
        shortDescription: data.shortDescription || null,
        categoryId: parseInt(data.categoryId),
        additionalCategoryIds: data.additionalCategoryIds?.map(id => parseInt(id)) || [],
        provinceId: parseInt(data.provinceId),
        localityId: parseInt(data.localityId),
        phone: data.phone,
        whatsapp: data.whatsapp || null,
        email: data.email,
        website: data.website || null,
        address: data.address,
        locality: data.locality || null,
        poBox: data.poBox || null,
        googleMapsUrl: data.googleMapsUrl || null,
        workingHours: parseWorkingHours(data.workingHours),
        establishedYear: data.establishedYear ? parseInt(data.establishedYear) : null,
        employeeCount: data.employeeCount || null,
        companySize: data.companySize || null,
        legalForm: data.legalForm || null,
        vatNumber: data.vatNumber || null,
        tradeLicense: data.tradeLicense || null,
        logo: data.logo || null,
        services: data.services ? data.services.split(',').map(s => s.trim()) : [],
        products: data.products ? data.products.split(',').map(p => p.trim()) : [],
        specialties: data.specialties ? data.specialties.split(',').map(s => s.trim()) : [],
        certifications: data.certifications ? data.certifications.split(',').map(c => c.trim()) : [],
        awards: data.awards ? data.awards.split(',').map(a => a.trim()) : [],
        languages: data.languages ? data.languages.split(',').map(l => l.trim()) : [],
        paymentMethods: data.paymentMethods ? data.paymentMethods.split(',').map(pm => pm.trim()) : [],
        deliveryAreas: data.deliveryAreas ? data.deliveryAreas.split(',').map(da => da.trim()) : [],
        socialMediaUrls: {
          facebook: data.facebook || null,
          twitter: data.twitter || null,
          instagram: data.instagram || null,
          linkedin: data.linkedin || null,
          youtube: data.youtube || null,
          tiktok: data.tiktok || null,
        },
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
      };
      
      if (isEditMode && editBusinessId) {
        return await apiRequest("PATCH", `/api/businesses/${editBusinessId}`, businessData);
      } else {
        return await apiRequest("POST", "/api/businesses", businessData);
      }
    },
    onSuccess: (result, data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      trackEvent(isEditMode ? 'business_updated' : 'business_submitted', 'form_completion', data.name);
      toast({
        title: "Success!",
        description: isEditMode ? "Your business has been successfully updated." : "Your business has been successfully added to the directory.",
      });
      if (!isEditMode) {
        form.reset();
        setSelectedProvinceId("");
        setSelectedCategoryId("");
        // Growth wizard disabled - redirect to dashboard instead
        if (result && result.id) {
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 2000); // 2 second delay to show success message
        }
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add business. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper functions for category management
  const isPremiumUser = (user: any) => {
    return user?.isPremium;
  };

  const getCategoryLimit = (user: any) => {
    return isPremiumUser(user) ? 5 : 3; // Free users can select 1 primary + 3 subcategories
  };





  // Logo upload and processing functions
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    
    // Create preview URL for immediate display and cropping
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setOriginalLogoSrc(result);
      setLogoPreview(result);
      setPendingLogoSave(result);
      // Automatically open crop dialog for immediate editing
      setShowCropDialog(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle cropped image save - automatically save to form
  const handleCropSave = (croppedImageBlob: Blob) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      form.setValue('logo', result); // Automatically save to form
      setShowCropDialog(false);
      setPendingLogoSave(""); // Clear pending save since it's automatically saved
      toast({
        title: "Logo Uploaded Successfully!",
        description: "Your business logo has been cropped and saved automatically.",
      });
    };
    reader.readAsDataURL(croppedImageBlob);
  };

  // Save final logo to form
  const handleLogoSave = () => {
    if (pendingLogoSave) {
      form.setValue('logo', pendingLogoSave);
      setPendingLogoSave("");
      toast({
        title: "Logo Saved",
        description: "Logo has been saved to your business profile.",
      });
    }
  };

  // Remove logo and reset
  const handleLogoRemove = () => {
    setLogoPreview("");
    setOriginalLogoSrc("");
    setPendingLogoSave("");
    form.setValue('logo', "");
    setLogoFile(null);
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const onSubmit = (data: BusinessFormData) => {
    trackEvent('form_submit', 'add_business', data.name);
    addBusinessMutation.mutate(data);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <>
        <SEO
          title="Add Your Business - Pakistan Yellow Pages"
          description="Create a comprehensive business listing to reach more customers across Pakistan"
          canonicalUrl="https://pakistanyp.com/add-business-enhanced"
          keywords="add business, Pakistan business directory, business listing, Pakistan Yellow Pages"
        />
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B6B2E]"></div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Don't render form if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <SEO
          title="Login Required - Pakistan Yellow Pages"
          description="Login to add your business to Pakistan Yellow Pages directory"
          canonicalUrl="https://pakistanyp.com/add-business-enhanced"
          keywords="login, Pakistan business directory, add business, Pakistan Yellow Pages"
        />
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Login Required</CardTitle>
              <CardDescription>
                You must be logged in to add a business to our directory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.href = "/login"} className="w-full">
                Login to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEO
        title={isEditMode ? "Edit Business - Pakistan Yellow Pages" : "Add Your Business - Pakistan Yellow Pages"}
        description={isEditMode ? "Update your business information on Pakistan Yellow Pages" : "Create a comprehensive business listing to reach more customers across Pakistan"}
        canonicalUrl={`https://pakistanyp.com/add-business-enhanced`}
        keywords="add business, Pakistan business directory, business listing, Pakistan Yellow Pages"
      />
      <div className="min-h-screen bg-[#FAF8F3]">
      <Header />
      <div className="yp-wrap-wide py-10 sm:py-14">
        <div className="mb-8 max-w-3xl">
          <span className="yp-label">{isEditMode ? "Your listing" : "List your business"}</span>
          <h1 className="mt-2 mb-2 text-[32px] font-bold leading-tight tracking-[-0.045em] sm:text-[40px]">
            {isEditMode ? "Edit Business" : "Add Your Business"}
          </h1>
          <p className="text-[16px] text-[#5B6475]">
            {isEditMode 
              ? "Update your business information to keep your listing current and accurate."
              : localize("Create a comprehensive business profile to attract more customers in Pakistan.")
            }
          </p>
          
          {/* Business Card Scanner Quick Access */}
          {!isEditMode && (
            <div className="mt-4">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => navigate("/business-card-scanner")}
              >
                <Scan className="h-4 w-4" />
                <span className="hidden sm:inline">One-Click</span> Business Card Scanner
                <Badge variant="secondary" className="text-xs bg-[#FDECEC] text-[#B3141B] border-0">
                  MAGIC
                </Badge>
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Upload a business card image to auto-fill this form
              </p>
            </div>
          )}
        </div>

        {/* Three-column layout: Sidebar + Form + Preview */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Sidebar - Quick Tips */}
          <div className="xl:col-span-2">
            <Card className="sticky top-[96px]">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-4 w-4 text-[#0B6B2E]" />
                  Quick Tips
                </CardTitle>
                <CardDescription className="text-sm">
                  Complete these for better visibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0B6B2E] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Complete all required fields</p>
                      <p className="text-gray-600 text-xs">Improves search ranking</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0B6B2E] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Add detailed description</p>
                      <p className="text-gray-600 text-xs">Helps customers understand your business</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0B6B2E] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Upload business logo</p>
                      <p className="text-gray-600 text-xs">Makes your listing stand out</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#0B6B2E] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Add social media links</p>
                      <p className="text-gray-600 text-xs">Builds customer trust</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Section - Center Column */}
          <div className="xl:col-span-8">
            <Card className="rounded-[24px]">
              <CardHeader className="p-6 pb-4 sm:p-8 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-[22px] font-bold tracking-[-0.03em]">
                  <Building2 className="h-5 w-5 text-[#0B6B2E]" />
                  {isEditMode ? "Edit Business Information" : "Add Your Business"}
                </CardTitle>
                <CardDescription>
                  {isEditMode 
                    ? "Update your business details to keep your profile current and accurate."
                    : "Fill out all sections to create a complete business profile with maximum visibility."
                  }
                </CardDescription>
                


                {/* Compact Section Navigation */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {formSections.map((section) => {
                    const isCompleted = isSectionCompleted(section.id);
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          document.getElementById(section.id)?.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                          });
                        }}
                        type="button"
                        className={`flex min-h-[36px] items-center gap-1.5 px-3 rounded-full text-[13px] font-medium transition-colors ${
                          isCompleted 
                            ? 'bg-[#E8F4EC] text-[#05501F] border border-[#CFE8D8]' 
                            : 'bg-white text-[#3A4354] border border-[#E3E6EC] hover:border-[#0B6B2E] hover:text-[#0B6B2E]'
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        <span>{section.label}</span>
                        {isCompleted && <CheckCircle className="h-3 w-3 text-[#0B6B2E]" />}
                        {section.required && !isCompleted && <span className="text-red-500">*</span>}
                      </button>
                    );
                  })}
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2 sm:p-8 sm:pt-2">
                {/* Subscription Plans Showcase */}
                {/* Clean business form - users select subscription plans at /pricing first */}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">

                    {/* Basic Information Section */}
                    <section id="basic-info" className="scroll-mt-6">
                      <div className="flex items-center gap-2 mb-6">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E8F4EC] text-[#0B6B2E]"><Building2 className="h-5 w-5" /></span>
                        <h2 className="text-xl font-semibold tracking-[-0.02em]">Basic Information</h2>
                        <span className="text-red-500">*</span>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter business name" {...field} />
                                </FormControl>
                                <div className="text-sm text-gray-500 text-right">
                                  {field.value?.length || 0}/200
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="arabicName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Urdu / Local-Language Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="کاروبار کا نام اردو میں" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Description *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Provide a comprehensive description of your business, services, and what makes you unique..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <AIAutocomplete
                                field="description"
                                businessName={form.watch("name")}
                                category={categories.find(c => c.id.toString() === form.watch("categoryId"))?.name}
                                province={provinces.find(e => e.id.toString() === form.watch("provinceId"))?.name}
                                locality={localities.find(l => l.id.toString() === form.watch("localityId"))?.name}
                                onSuggestionSelect={(suggestion) => field.onChange(suggestion)}
                                className="mt-2"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="shortDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Short Description</FormLabel>
                              <FormControl>
                                <Input placeholder="Brief description for search results" {...field} />
                              </FormControl>
                              <div className="text-sm text-gray-500 text-right">
                                {field.value?.length || 0}/500
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </section>

                    {/* Contact Information Section */}
                    <section id="contact-info" className="scroll-mt-6">
                      <div className="flex items-center gap-2 mb-6">
                        <Phone className="h-5 w-5 text-green-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
                        <span className="text-red-500">*</span>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number *</FormLabel>
                                <FormControl>
                                  <div className="flex">
                                    <Select 
                                      value={phoneCountryCode || country.phonePrefix}
                                      onValueChange={setPhoneCountryCode}
                                    >
                                      <SelectTrigger className="w-24 rounded-r-none border-r-0">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value={country.phonePrefix}>{`${homeFlag} ${country.phonePrefix}`}</SelectItem>
                                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                                        <SelectItem value="+44">🇬🇧 +44</SelectItem>
                                        <SelectItem value="+92">🇮🇳 +92</SelectItem>
                                        <SelectItem value="+86">🇨🇳 +86</SelectItem>
                                        <SelectItem value="+49">🇩🇪 +49</SelectItem>
                                        <SelectItem value="+33">🇫🇷 +33</SelectItem>
                                        <SelectItem value="+81">🇯🇵 +81</SelectItem>
                                        <SelectItem value="+82">🇰🇷 +82</SelectItem>
                                        <SelectItem value="+61">🇦🇺 +61</SelectItem>
                                        <SelectItem value="+55">🇧🇷 +55</SelectItem>
                                        <SelectItem value="+7">🇷🇺 +7</SelectItem>
                                        <SelectItem value="+39">🇮🇹 +39</SelectItem>
                                        <SelectItem value="+34">🇪🇸 +34</SelectItem>
                                        <SelectItem value="+31">🇳🇱 +31</SelectItem>
                                        <SelectItem value="+47">🇳🇴 +47</SelectItem>
                                        <SelectItem value="+46">🇸🇪 +46</SelectItem>
                                        <SelectItem value="+45">🇩🇰 +45</SelectItem>
                                        <SelectItem value="+41">🇨🇭 +41</SelectItem>
                                        <SelectItem value="+43">🇦🇹 +43</SelectItem>
                                        <SelectItem value="+32">🇧🇪 +32</SelectItem>
                                        <SelectItem value="+48">🇵🇱 +48</SelectItem>
                                        <SelectItem value="+420">🇨🇿 +420</SelectItem>
                                        <SelectItem value="+36">🇭🇺 +36</SelectItem>
                                        <SelectItem value="+351">🇵🇹 +351</SelectItem>
                                        <SelectItem value="+30">🇬🇷 +30</SelectItem>
                                        <SelectItem value="+90">🇹🇷 +90</SelectItem>
                                        <SelectItem value="+972">🇮🇱 +972</SelectItem>
                                        <SelectItem value="+92">🇸🇦 +92</SelectItem>
                                        <SelectItem value="+962">🇯🇴 +962</SelectItem>
                                        <SelectItem value="+974">🇶🇦 +974</SelectItem>
                                        <SelectItem value="+965">🇰🇼 +965</SelectItem>
                                        <SelectItem value="+973">🇧🇭 +973</SelectItem>
                                        <SelectItem value="+968">🇴🇲 +968</SelectItem>
                                        <SelectItem value="+20">🇪🇬 +20</SelectItem>
                                        <SelectItem value="+212">🇲🇦 +212</SelectItem>
                                        <SelectItem value="+27">🇿🇦 +27</SelectItem>
                                        <SelectItem value="+234">🇳🇬 +234</SelectItem>
                                        <SelectItem value="+254">🇰🇪 +254</SelectItem>
                                        <SelectItem value="+65">🇸🇬 +65</SelectItem>
                                        <SelectItem value="+60">🇲🇾 +60</SelectItem>
                                        <SelectItem value="+66">🇹🇭 +66</SelectItem>
                                        <SelectItem value="+84">🇻🇳 +84</SelectItem>
                                        <SelectItem value="+62">🇮🇩 +62</SelectItem>
                                        <SelectItem value="+63">🇵🇭 +63</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input 
                                      placeholder={country.phonePlaceholder.replace(/ /g, "-")} 
                                      className="rounded-l-none"
                                      value={field.value ? field.value.replace(/^\+\d+\s?-?\s?/, '') : ''}
                                      onChange={(e) => {
                                        const number = e.target.value.replace(/[^\d-]/g, '');
                                        field.onChange(`${phoneCountryCode || country.phonePrefix}-${number}`);
                                      }}
                                    />
                                  </div>
                                </FormControl>
                                <div className="text-sm text-gray-500 text-right">
                                  {field.value?.length || 0}/50
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="whatsapp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>WhatsApp Number</FormLabel>
                                <FormControl>
                                  <div className="flex">
                                    <Select 
                                      value={whatsappCountryCode || country.phonePrefix}
                                      onValueChange={setWhatsappCountryCode}
                                    >
                                      <SelectTrigger className="w-24 rounded-r-none border-r-0">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value={country.phonePrefix}>{`${homeFlag} ${country.phonePrefix}`}</SelectItem>
                                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                                        <SelectItem value="+44">🇬🇧 +44</SelectItem>
                                        <SelectItem value="+92">🇮🇳 +92</SelectItem>
                                        <SelectItem value="+86">🇨🇳 +86</SelectItem>
                                        <SelectItem value="+49">🇩🇪 +49</SelectItem>
                                        <SelectItem value="+33">🇫🇷 +33</SelectItem>
                                        <SelectItem value="+81">🇯🇵 +81</SelectItem>
                                        <SelectItem value="+82">🇰🇷 +82</SelectItem>
                                        <SelectItem value="+61">🇦🇺 +61</SelectItem>
                                        <SelectItem value="+55">🇧🇷 +55</SelectItem>
                                        <SelectItem value="+7">🇷🇺 +7</SelectItem>
                                        <SelectItem value="+39">🇮🇹 +39</SelectItem>
                                        <SelectItem value="+34">🇪🇸 +34</SelectItem>
                                        <SelectItem value="+31">🇳🇱 +31</SelectItem>
                                        <SelectItem value="+47">🇳🇴 +47</SelectItem>
                                        <SelectItem value="+46">🇸🇪 +46</SelectItem>
                                        <SelectItem value="+45">🇩🇰 +45</SelectItem>
                                        <SelectItem value="+41">🇨🇭 +41</SelectItem>
                                        <SelectItem value="+43">🇦🇹 +43</SelectItem>
                                        <SelectItem value="+32">🇧🇪 +32</SelectItem>
                                        <SelectItem value="+48">🇵🇱 +48</SelectItem>
                                        <SelectItem value="+420">🇨🇿 +420</SelectItem>
                                        <SelectItem value="+36">🇭🇺 +36</SelectItem>
                                        <SelectItem value="+351">🇵🇹 +351</SelectItem>
                                        <SelectItem value="+30">🇬🇷 +30</SelectItem>
                                        <SelectItem value="+90">🇹🇷 +90</SelectItem>
                                        <SelectItem value="+972">🇮🇱 +972</SelectItem>
                                        <SelectItem value="+92">🇸🇦 +92</SelectItem>
                                        <SelectItem value="+962">🇯🇴 +962</SelectItem>
                                        <SelectItem value="+974">🇶🇦 +974</SelectItem>
                                        <SelectItem value="+965">🇰🇼 +965</SelectItem>
                                        <SelectItem value="+973">🇧🇭 +973</SelectItem>
                                        <SelectItem value="+968">🇴🇲 +968</SelectItem>
                                        <SelectItem value="+20">🇪🇬 +20</SelectItem>
                                        <SelectItem value="+212">🇲🇦 +212</SelectItem>
                                        <SelectItem value="+27">🇿🇦 +27</SelectItem>
                                        <SelectItem value="+234">🇳🇬 +234</SelectItem>
                                        <SelectItem value="+254">🇰🇪 +254</SelectItem>
                                        <SelectItem value="+65">🇸🇬 +65</SelectItem>
                                        <SelectItem value="+60">🇲🇾 +60</SelectItem>
                                        <SelectItem value="+66">🇹🇭 +66</SelectItem>
                                        <SelectItem value="+84">🇻🇳 +84</SelectItem>
                                        <SelectItem value="+62">🇮🇩 +62</SelectItem>
                                        <SelectItem value="+63">🇵🇭 +63</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input 
                                      placeholder={country.phonePlaceholder.replace(/ /g, "-")} 
                                      className="rounded-l-none"
                                      value={field.value ? field.value.replace(/^\+\d+\s?-?\s?/, '') : ''}
                                      onChange={(e) => {
                                        const number = e.target.value.replace(/[^\d-]/g, '');
                                        field.onChange(`${whatsappCountryCode || country.phonePrefix}-${number}`);
                                      }}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address *</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="info@yourbusiness.com" {...field} />
                                </FormControl>
                                <div className="text-sm text-gray-500 text-right">
                                  {field.value?.length || 0}/200
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Website URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://www.yourbusiness.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </section>

                    {/* Location Information Section */}
                    <section id="location-info" className="scroll-mt-6">
                      <div className="flex items-center gap-2 mb-6">
                        <MapPin className="h-5 w-5 text-red-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Location & Address</h2>
                        <span className="text-red-500">*</span>
                      </div>
                      <div className="space-y-4">
                        <LocationPicker form={form} provinces={provinces} onProvinceChange={setSelectedProvinceId} idPrefix="enhanced-1" />

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Address *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter complete business address including building name, street, area..."
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="poBox"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>P.O. Box</FormLabel>
                                <FormControl>
                                  <Input placeholder="P.O. Box 12345" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="googleMapsUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Google Maps URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://maps.google.com/..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </section>

                    {/* Categories & Services Section */}
                    <section id="categories-info" className="scroll-mt-6">
                      <div className="flex items-center gap-2 mb-6">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E8F4EC] text-[#0B6B2E]"><Hash className="h-5 w-5" /></span>
                        <h2 className="text-xl font-semibold tracking-[-0.02em]">Categories & Services</h2>
                        <span className="text-red-500">*</span>
                      </div>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="additionalCategoryIds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Business Categories * 
                                {!isPremiumUser(userMembership) && (
                                  <Badge variant="outline" className="text-xs">
                                    Free: 3 sub-categories + unlimited 3rd level
                                  </Badge>
                                )}
                                {isPremiumUser(userMembership) && (
                                  <Badge variant="secondary" className="text-xs bg-[#F1F2F6] text-[#334155]">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Premium: Unlimited all levels
                                  </Badge>
                                )}
                              </FormLabel>
                              
                              <DropdownCategorySelector
                                selectedCategories={field.value?.map(Number) || []}
                                onCategoryChange={(categoryIds) => {
                                  field.onChange(categoryIds.map(String));
                                  // Set the first category as primary
                                  if (categoryIds.length > 0) {
                                    form.setValue("categoryId", categoryIds[0].toString());
                                  }
                                }}
                              />
                              
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                      </div>
                    </section>

                    {/* Logo & Visual Content Section */}
                    <section id="logo-content" className="scroll-mt-6">
                      <div className="flex items-center gap-2 mb-6">
                        <Image className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Logo & Visual Content</h2>
                      </div>
                      <div className="space-y-4">
                        <FormField
                        control={form.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Business Logo
                              <Badge variant="outline" className="text-xs">
                                Optional
                              </Badge>
                            </FormLabel>
                            
                            {/* Logo Upload Section */}
                            <div className="space-y-4">
                              <FormControl>
                                <div className="space-y-2">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                  />
                                  <p className="text-sm text-gray-500">
                                    Upload an image file (JPG, PNG, GIF). Max size: 5MB
                                  </p>
                                </div>
                              </FormControl>
                              
                              {/* Logo Preview and Controls */}
                              {logoPreview && (
                                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                  <div className="flex items-center gap-4">
                                    <div className="relative">
                                      <img 
                                        src={logoPreview} 
                                        alt="Logo preview" 
                                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                                      />
                                      {form.watch('logo') && (
                                        <div className="absolute -top-2 -right-2">
                                          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                            Saved
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                      <p className="text-sm text-gray-600">
                                        {form.watch('logo') 
                                          ? "Logo saved to business profile" 
                                          : "Logo uploaded - click Edit & Crop to adjust"
                                        }
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setShowCropDialog(true)}
                                          disabled={!originalLogoSrc}
                                        >
                                          <Crop className="h-3 w-3 mr-1" />
                                          Edit & Crop
                                        </Button>

                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={handleLogoRemove}
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="shortDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description for search results" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide a comprehensive description of your business, services, and what makes you unique..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <AIAutocomplete
                            field="description"
                            businessName={form.watch("name")}
                            category={categories.find(c => c.id.toString() === form.watch("categoryId"))?.name}
                            province={provinces.find(e => e.id.toString() === form.watch("provinceId"))?.name}
                            locality={localities.find(l => l.id.toString() === form.watch("localityId"))?.name}
                            onSuggestionSelect={(suggestion) => field.onChange(suggestion)}
                            className="mt-2"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </section>

                    {/* Contact Information Section */}
                    <section id="contact-info" className="scroll-mt-6">
                      <div className="flex items-center gap-2 mb-6">
                        <Phone className="h-5 w-5 text-green-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
                        <span className="text-red-500">*</span>
                      </div>
                      <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input placeholder={`${country.phonePrefix}-${country.phonePlaceholder.replace(/ /g, "-")}`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp Number</FormLabel>
                            <FormControl>
                              <Input placeholder={`${country.phonePrefix}-${country.phonePlaceholder.replace(/ /g, "-")}`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="info@yourbusiness.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://www.yourbusiness.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="workingHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Working Hours *
                          </FormLabel>
                          
                          {/* Always Open Toggle */}
                          <div className="flex items-center gap-3 p-4 bg-[#F2F9F4] rounded-xl border border-[#CFE8D8]">
                            <Switch 
                              checked={isAlwaysOpen}
                              onCheckedChange={(checked) => {
                                setIsAlwaysOpen(checked);
                                if (checked) {
                                  field.onChange("Always Open - 24/7");
                                } else {
                                  // Generate working hours string from current schedule
                                  const hoursString = generateWorkingHoursString(workingHours);
                                  field.onChange(hoursString);
                                }
                              }}
                            />
                            <div>
                              <Label className="font-medium text-blue-900">Always Open (24/7)</Label>
                              <p className="text-sm text-blue-700">Check this if your business operates 24 hours a day</p>
                            </div>
                          </div>

                          {/* Weekly Schedule - only show if not always open */}
                          {!isAlwaysOpen && (
                            <div className="space-y-3 mt-4">
                              <Label className="text-sm font-medium">Set your weekly schedule:</Label>
                              <div className="space-y-2">
                                {Object.entries(workingHours).map(([day, hours]) => (
                                  <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                                    <div className="w-20 font-medium capitalize">{day}</div>
                                    
                                    <Switch
                                      checked={hours.isOpen}
                                      onCheckedChange={(checked) => {
                                        const newHours = {
                                          ...workingHours,
                                          [day]: { ...hours, isOpen: checked }
                                        };
                                        setWorkingHours(newHours);
                                        field.onChange(generateWorkingHoursString(newHours));
                                      }}
                                    />
                                    
                                    {hours.isOpen ? (
                                      <div className="flex items-center gap-2">
                                        <Select
                                          value={hours.openTime}
                                          onValueChange={(time) => {
                                            const newHours = {
                                              ...workingHours,
                                              [day]: { ...hours, openTime: time }
                                            };
                                            setWorkingHours(newHours);
                                            field.onChange(generateWorkingHoursString(newHours));
                                          }}
                                        >
                                          <SelectTrigger className="w-24">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {generateTimeOptions().map(time => (
                                              <SelectItem key={time} value={time}>{formatTimeDisplay(time)}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        
                                        <span className="text-gray-500">to</span>
                                        
                                        <Select
                                          value={hours.closeTime}
                                          onValueChange={(time) => {
                                            const newHours = {
                                              ...workingHours,
                                              [day]: { ...hours, closeTime: time }
                                            };
                                            setWorkingHours(newHours);
                                            field.onChange(generateWorkingHoursString(newHours));
                                          }}
                                        >
                                          <SelectTrigger className="w-24">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {generateTimeOptions().map(time => (
                                              <SelectItem key={time} value={time}>{formatTimeDisplay(time)}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    ) : (
                                      <span className="text-red-600 font-medium">Closed</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Preview of current schedule */}
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <Label className="text-sm font-medium text-gray-700">Schedule Preview:</Label>
                            <p className="text-sm text-gray-600 mt-1">
                              {field.value || "No schedule set"}
                            </p>
                          </div>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      </div>
                    </section>

                    {/* Location Information Section */}
                    <section id="location-info" className="scroll-mt-6">
                      <div className="flex items-center gap-2 mb-6">
                        <MapPin className="h-5 w-5 text-red-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Location & Address</h2>
                        <span className="text-red-500">*</span>
                      </div>
                      <div className="space-y-4">
                    <LocationPicker form={form} provinces={provinces} onProvinceChange={setSelectedProvinceId} idPrefix="enhanced-2" />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complete Address *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Street address, building name, floor, office number..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="locality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area/Locality</FormLabel>
                            <FormControl>
                              <Input placeholder="Clifton, Gulberg, Blue Area..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="poBox"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>P.O. Box</FormLabel>
                            <FormControl>
                              <Input placeholder="PO Box 12345" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="googleMapsUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Google Maps URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://maps.google.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      </div>
                    </section>

                    {/* Business Details Section */}
                    <section id="business-details" className="scroll-mt-6">
                      <div className="flex items-center gap-2 mb-6">
                        <Building2 className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Business Details</h2>
                      </div>
                      <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="establishedYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Established Year</FormLabel>
                            <FormControl>
                              <Input placeholder="2020" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="employeeCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee Count</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select employee count" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1-10">1-10 employees</SelectItem>
                                <SelectItem value="11-50">11-50 employees</SelectItem>
                                <SelectItem value="51-200">51-200 employees</SelectItem>
                                <SelectItem value="201-500">201-500 employees</SelectItem>
                                <SelectItem value="500+">500+ employees</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="legalForm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Legal Form</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select legal form" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {LEGAL_FORMS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vatNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>VAT Number</FormLabel>
                            <FormControl>
                              <Input placeholder="100123456789001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tradeLicense"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trade License</FormLabel>
                            <FormControl>
                              <Input placeholder="Trade license number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                      </div>
                    </section>

                    {/* Services & Content Section */}
                    <section id="services-content" className="scroll-mt-6">
                      <div className="flex items-center gap-2 mb-6">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E8F4EC] text-[#0B6B2E]"><Wrench className="h-5 w-5" /></span>
                        <h2 className="text-xl font-semibold tracking-[-0.02em]">Services & Content</h2>
                      </div>
                      <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="services"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Services Offered</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="List your services (comma-separated): Web Design, SEO, Digital Marketing, Branding"
                              {...field}
                            />
                          </FormControl>
                          <AIAutocomplete
                            field="services"
                            businessName={form.watch("name")}
                            category={categories.find(c => c.id.toString() === form.watch("categoryId"))?.name}
                            province={provinces.find(e => e.id.toString() === form.watch("provinceId"))?.name}
                            locality={localities.find(l => l.id.toString() === form.watch("localityId"))?.name}
                            description={form.watch("description")}
                            onSuggestionSelect={(suggestion) => field.onChange(suggestion)}
                            className="mt-2"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="products"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Products</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="List your products (comma-separated): Software Solutions, Mobile Apps, CRM Systems"
                              {...field}
                            />
                          </FormControl>
                          <AIAutocomplete
                            field="products"
                            businessName={form.watch("name")}
                            category={categories.find(c => c.id.toString() === form.watch("categoryId"))?.name}
                            province={provinces.find(e => e.id.toString() === form.watch("provinceId"))?.name}
                            locality={localities.find(l => l.id.toString() === form.watch("localityId"))?.name}
                            description={form.watch("description")}
                            onSuggestionSelect={(suggestion) => field.onChange(suggestion)}
                            className="mt-2"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialties</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Your areas of expertise (comma-separated): React Development, Cloud Architecture, AI Solutions"
                              {...field}
                            />
                          </FormControl>
                          <AIAutocomplete
                            field="specialties"
                            businessName={form.watch("name")}
                            category={categories.find(c => c.id.toString() === form.watch("categoryId"))?.name}
                            province={provinces.find(e => e.id.toString() === form.watch("provinceId"))?.name}
                            locality={localities.find(l => l.id.toString() === form.watch("localityId"))?.name}
                            description={form.watch("description")}
                            onSuggestionSelect={(suggestion) => field.onChange(suggestion)}
                            className="mt-2"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="certifications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certifications</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="ISO 9001, AWS Certified, Google Partner"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="awards"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Awards & Recognition</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Industry awards, recognitions, achievements"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="languages"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Languages Spoken</FormLabel>
                            <FormControl>
                              <Input placeholder="English, Urdu, Marathi, Tamil" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentMethods"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Methods</FormLabel>
                            <FormControl>
                              <Input placeholder="Cash, Card, Bank Transfer, PayPal" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="deliveryAreas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery/Service Areas</FormLabel>
                          <FormControl>
                            <Input placeholder={`${country.regions.slice(0, 3).map((r) => r.name).join(", ")}, ${country.shortName}-wide`} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      </div>
                    </section>

                    {/* Social Media Section */}
                    <section id="social-media" className="scroll-mt-6">
                      <div className="flex items-center gap-2 mb-6">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E8F4EC] text-[#0B6B2E]"><Globe className="h-5 w-5" /></span>
                        <h2 className="text-xl font-semibold tracking-[-0.02em]">Social Media & Online Presence</h2>
                      </div>
                      <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="facebook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facebook URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://facebook.com/yourbusiness" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://instagram.com/yourbusiness" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twitter URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://twitter.com/yourbusiness" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="linkedin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://linkedin.com/company/yourbusiness" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="youtube"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>YouTube URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://youtube.com/c/yourbusiness" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tiktok"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>TikTok URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://tiktok.com/@yourbusiness" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                      </div>
                    </section>

                <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-[#EEF0F4]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Reset Form
                  </Button>
                  <Button
                    type="submit"
                    disabled={addBusinessMutation.isPending}
                  >
                    {addBusinessMutation.isPending ? "Adding Business..." : "Add Business"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
          </div>

          {/* Preview Section - Right Column */}
          <div className="xl:col-span-2">
            <div className="sticky top-8">
              <BusinessProfilePreview
                formData={form.watch()}
                categories={categories}
                provinces={provinces}
                localities={localities}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
      </div>

      {/* Image Crop Dialog */}
      {showCropDialog && originalLogoSrc && (
        <ImageCropDialog
          isOpen={showCropDialog}
          onClose={() => setShowCropDialog(false)}
          imageUrl={originalLogoSrc}
          onSave={handleCropSave}
        />
      )}
      
      {/* Business Growth Wizard disabled */}
    </>
  );
}