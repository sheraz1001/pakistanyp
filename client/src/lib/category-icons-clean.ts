import { 
  Utensils, 
  Laptop, 
  Stethoscope, 
  Home, 
  GraduationCap, 
  Car,
  Building,
  Briefcase,
  Wrench,
  Palette,
  Heart,
  ShoppingBag,
  Plane,
  Hotel,
  CreditCard,
  Gamepad2,
  Camera,
  Music,
  Shirt,
  Baby,
  Dog,
  Flower,
  Hammer,
  Shield,
  Trophy,
  Leaf,
  Scissors,
  Coffee,
  Pizza,
  Cake,
  Wine,
  IceCream,
  Apple,
  Fish,
  ChefHat,
  Store,
  ShoppingCart,
  Gift,
  Smartphone,
  Watch,
  Headphones,
  Monitor,
  Printer,
  Wifi,
  HardDrive,
  Settings,
  Zap,
  Fuel,
  Truck,
  Bus,
  Bike,
  MapPin,
  Navigation,
  Compass,
  Ambulance,
  Activity,
  Pill,
  Eye,
  Bone,
  Brain,
  Thermometer,
  Microscope,
  HeartHandshake,
  UserCheck,
  Users,
  School,
  BookOpen,
  Calculator,
  Globe,
  Languages,
  Paintbrush,
  Brush,
  Dumbbell,
  Waves,
  Building2,
  Factory,
  Landmark,
  Gavel,
  UtensilsCrossed,
  Cog,
  Mountain,
  TreePine,
  Sun,
  Moon,
  Star,
  Sparkles,
  Crown,
  Gem,
  DollarSign,
  PiggyBank,
  TrendingUp,
  BarChart,
  FileText,
  Scale,
  Gavel,
  Building2,
  Factory,
  Warehouse,
  HardHat,
  Drill,
  Ruler,
  PaintBucket,
  CircuitBoard,
  Lightbulb,
  Plug,
  Radio,
  Antenna,
  Signal,
  Satellite,
  CloudRain,
  CloudSnow,
  Snowflake,
  Droplets,
  Flame,
  Wind,
  Trash2,
  Recycle,
  TreeDeciduous,
  Bug,
  Cat,
  Bird,
  Rabbit,
  Package,
  Package2,
  PackageOpen,
  Boxes,
  Archive,
  Database,
  Server,
  Cloud,
  Upload,
  Download,
  Router,
  PhoneCall,
  Phone,
  Mail,
  Send,
  MessageSquare,
  Video,
  Mic,
  Speaker,
  Volume2,
  PlayCircle,
  Film,
  Clapperboard,
  Image,
  Aperture,
  Focus,
  Crop,
  Edit,
  PenTool,
  Type,
  AlignLeft,
  Layers,
  MousePointer,
  Cursor,
  Touch,
  Tablet,
  Desktop,
  MemoryStick,
  SdCard,
  Ethernet,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  Power,
  PowerOff,
  Flashlight,
  LucideIcon
} from "lucide-react";

// Type for icon components
export type IconComponent = LucideIcon;

// Main category icon mapping
export const categoryIconMap: { [key: string]: IconComponent } = {
  // Food & Restaurants
  "restaurants": Utensils,
  "food": ChefHat,
  "fast-food": Pizza,
  "cafes": Coffee,
  "bakeries": Cake,
  "bars": Wine,
  "ice-cream": IceCream,
  "fruits": Apple,
  "seafood": Fish,
  "catering": ChefHat,
  
  // Technology & IT
  "technology": Laptop,
  "it-services": Laptop,
  "computers": Monitor,
  "software": Settings,
  "electronics": Smartphone,
  "mobile": Smartphone,
  "gadgets": Watch,
  "audio": Headphones,
  "printing": Printer,
  "networking": Wifi,
  "data": HardDrive,
  "telecom": Phone,
  "internet": Globe,
  
  // Healthcare & Medical
  "healthcare": Stethoscope,
  "hospitals": Building2,
  "clinics": Stethoscope,
  "medical": Activity,
  "pharmacy": Pill,
  "dental": Bone,
  "eye-care": Eye,
  "mental-health": Brain,
  "emergency": Ambulance,
  "lab": Microscope,
  "therapy": HeartHandshake,
  "nursing": UserCheck,
  
  // Real Estate & Property
  "real-estate": Home,
  "property": Building,
  "construction": HardHat,
  "architecture": Ruler,
  "interior-design": PaintBucket,
  "contractors": Hammer,
  "engineering": CircuitBoard,
  "plumbing": Wrench,
  "electrical": Lightbulb,
  "maintenance": Wrench,
  "security": Shield,
  "cleaning": Sparkles,
  
  // Education & Training
  "education": GraduationCap,
  "schools": School,
  "universities": BookOpen,
  "training": Users,
  "tutoring": Calculator,
  "language": Languages,
  "arts": Paintbrush,
  "music": Music,
  "sports": Trophy,
  "fitness": Dumbbell,
  
  // Transportation & Automotive
  "automotive": Car,
  "cars": Car,
  "trucks": Truck,
  "buses": Bus,
  "motorcycles": Bike,
  "logistics": Package,
  "shipping": Boxes,
  "delivery": Truck,
  "transportation": Navigation,
  "travel": Plane,
  "airlines": Plane,
  "hotels": Hotel,
  "hospitality": UtensilsCrossed,
  "tourism": MapPin,
  
  // Business & Finance
  "business-services": Briefcase,
  "business-professional-services": Briefcase,
  "professional-services": UserCheck,
  "finance": DollarSign,
  "banking": PiggyBank,
  "investment": TrendingUp,
  "accounting": Calculator,
  "consulting": BarChart,
  "legal": Gavel,
  "insurance": Shield,
  "marketing": Sparkles,
  "advertising": Star,
  
  // Retail & Shopping
  "retail": ShoppingBag,
  "shopping": ShoppingCart,
  "stores": Store,
  "fashion": Shirt,
  "clothing": Shirt,
  "jewelry": Gem,
  "gifts": Gift,
  "supermarkets": Apple,
  "convenience": Store,
  "department-stores": Building,
  
  // Entertainment & Recreation
  "entertainment": Gamepad2,
  "gaming": Gamepad2,
  "cinema": Film,
  "theaters": Clapperboard,
  "photography": Camera,
  "video": Video,
  "events": Star,
  "recreation": Mountain,
  "outdoor": TreePine,
  "water-sports": Waves,
  
  // Beauty & Wellness
  "beauty": Palette,
  "salon": Scissors,
  "spa": Heart,
  "cosmetics": Sparkles,
  "wellness": Leaf,
  "massage": Heart,
  "nail-care": Brush,
  "hair-care": Scissors,
  
  // Home & Garden
  "home-garden": Flower,
  "furniture": Home,
  "appliances": Zap,
  "gardening": TreeDeciduous,
  "landscaping": TreePine,
  "plants": Leaf,
  "flowers": Flower,
  "pest-control": Bug,
  
  // Pets & Animals
  "pets": Dog,
  "veterinary": Dog,
  "pet-care": Cat,
  "pet-supplies": Dog,
  "grooming": Scissors,
  "animals": Bird,
  
  // Manufacturing & Industrial
  "manufacturing": Factory,
  "industrial": Warehouse,
  "machinery": Settings,
  "tools": Hammer,
  "equipment": Drill,
  "supplies": Package2,
  "wholesale": Boxes,
  "distribution": Archive,
  "specialized-industries": Cog,
  
  // Government & Public Sector
  "government": Landmark,
  "government-public-sector": Landmark,
  "public-sector": Building2,
  "municipal": Landmark,
  "federal": Building2,
  "administration": Gavel,
  
  // Energy & Environment
  "energy": Lightbulb,
  "solar": Sun,
  "renewable": Wind,
  "oil-gas": Fuel,
  "water": Droplets,
  "waste": Trash2,
  "recycling": Recycle,
  "environment": Leaf,
  
  // Media & Communication
  "media": Radio,
  "broadcasting": Antenna,
  "publishing": FileText,
  "design": PenTool,
  "graphics": Image,
  "web-design": Globe,
  
  // Default icon for unmatched categories
  "default": Building2
};

// Function to get category icon with fallback logic
export function getCategoryIcon(categoryName: string): IconComponent {
  if (!categoryName) return categoryIconMap.default;
  
  const normalizedName = categoryName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  // Try exact match first
  if (categoryIconMap[normalizedName]) {
    return categoryIconMap[normalizedName];
  }
  
  // Try partial matches
  for (const [key, icon] of Object.entries(categoryIconMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return icon;
    }
  }
  
  // Try word-based matches
  const words = normalizedName.split('-');
  for (const word of words) {
    if (categoryIconMap[word]) {
      return categoryIconMap[word];
    }
  }
  
  // Default fallback
  return categoryIconMap.default;
}

// Function to get icon color based on category
export function getCategoryIconColor(categoryName: string): { bg: string; icon: string } {
  const colorMap: { [key: string]: { bg: string; icon: string } } = {
    "restaurants": { bg: "bg-orange-100", icon: "text-orange-600" },
    "technology": { bg: "bg-blue-100", icon: "text-blue-600" },
    "healthcare": { bg: "bg-green-100", icon: "text-green-600" },
    "real-estate": { bg: "bg-purple-100", icon: "text-purple-600" },
    "education": { bg: "bg-indigo-100", icon: "text-indigo-600" },
    "automotive": { bg: "bg-red-100", icon: "text-red-600" },
    "business-services": { bg: "bg-gray-100", icon: "text-gray-600" },
    "retail": { bg: "bg-pink-100", icon: "text-pink-600" },
    "entertainment": { bg: "bg-yellow-100", icon: "text-yellow-600" },
    "beauty": { bg: "bg-rose-100", icon: "text-rose-600" },
    "fitness": { bg: "bg-emerald-100", icon: "text-emerald-600" },
    "travel": { bg: "bg-sky-100", icon: "text-sky-600" },
    "finance": { bg: "bg-green-100", icon: "text-green-600" },
    "legal": { bg: "bg-slate-100", icon: "text-slate-600" },
    "manufacturing": { bg: "bg-amber-100", icon: "text-amber-600" },
    "energy": { bg: "bg-yellow-100", icon: "text-yellow-600" },
    "pets": { bg: "bg-orange-100", icon: "text-orange-600" },
    "media": { bg: "bg-violet-100", icon: "text-violet-600" },
    "default": { bg: "bg-blue-100", icon: "text-blue-600" }
  };
  
  const normalizedName = categoryName.toLowerCase().replace(/\s+/g, '-');
  
  // Try exact match first
  if (colorMap[normalizedName]) {
    return colorMap[normalizedName];
  }
  
  // Try partial matches
  for (const [key, colors] of Object.entries(colorMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return colors;
    }
  }
  
  return colorMap.default;
}