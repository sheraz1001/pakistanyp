import { useState } from "react";
import { LanguageSwitch } from "@/components/language-switch";
import { EXTENSION_NAV } from "@/extensions";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PakistanypLogo, FlagStripe } from "@/components/brand/pakistanyp-logo";
import { 
  Plus, User, Settings, LogOut, Menu, Home, Grid3X3, MapPin, Newspaper, FileText, Shield, Building2, LogIn, Scan, Instagram, Facebook, Linkedin, Twitter,
  // Additional icons for admin menu system
  Briefcase, TrendingUp, Target, Award, Crown, Gem, Zap, Rocket, Globe, Lock,
  Mail, Phone, MessageCircle, Send, Megaphone, Navigation, Compass, Route, Map, Landmark,
  Monitor, Smartphone, Cpu, Database, Code, Building, Sun, Moon, Star, Coins,
  Car, Truck, Plane, Hotel, Coffee, ShoppingCart, Store, Heart, Activity,
  // Weather icons
   Cloud
} from "lucide-react";
import { country, localize } from "@shared/country";
import { t as tx } from "@shared/i18n";

const SOCIAL_ICONS: Record<string, typeof Instagram> = { Instagram, Facebook, LinkedIn: Linkedin, X: Twitter };

export default function Header() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch header menu items from admin panel
  const { data: menuItems = [] } = useQuery({
    queryKey: ['/api/menus/location/header'],
    queryFn: async () => {
      const response = await fetch('/api/menus/location/header', { credentials: "include" });
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 60_000,
  });

  // Convert menu items to navigation format - enable admin menu display
  const navigation = menuItems && Array.isArray(menuItems) && menuItems.length > 0 ? menuItems
    .filter((item: any) => item.isVisible !== false)
    .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((item: any) => {
      let href = '/';
      if (item.linkType === 'internal') {
        if (item.targetPage) {
          href = `/${item.targetPage.replace(/^\/+/, "")}`;
        } else if (item.url) {
          try {
            const url = new URL(item.url, country.origin);
            href = url.pathname;
          } catch (e) {
            console.error('URL parsing error:', e, 'for URL:', item.url);
            href = '/';
          }
        }
      } else {
        href = item.url || '/';
      }

      return {
        name: item.title || item.name || 'Menu Item',
        href: href,
        icon: getIconComponent(item.icon),
        external: item.linkType === 'external',
        badge: item.badge || item.attributes?.badge || null,
      };
    }) : [];

  // Default navigation shown when no admin menu is configured (e.g. fresh
  // production database). Admin-configured menu items always take precedence.
  const defaultNavigation = [
    { name: 'Categories', href: '/categories', icon: Grid3X3, external: false, badge: null },
    { name: country.regionTerm.plural, href: country.regionsPath, icon: MapPin, external: false, badge: null },
    { name: 'Cities', href: '/cities', icon: Building2, external: false, badge: null },
    { name: 'Localities', href: '/localities', icon: Map, external: false, badge: null },
    { name: 'Businesses', href: '/businesses', icon: Building2, external: false, badge: null },
    { name: 'Blogs', href: '/blogs', icon: FileText, external: false, badge: null },
    { name: 'News', href: '/news', icon: Newspaper, external: false, badge: null },
  ];

  const navItems = navigation.length > 0 ? [...navigation] : [...defaultNavigation];
  // Keep the city and locality directories discoverable even with older saved menus.
  if (!navItems.some((item) => item.href.replace(/\/+$/, '') === '/cities')) {
    const provincesAt = navItems.findIndex((item) => item.href === country.regionsPath);
    navItems.splice(provincesAt >= 0 ? provincesAt + 1 : navItems.length, 0, {
      name: 'Cities', href: '/cities', icon: Building2, external: false, badge: null,
    });
  }
  if (!navItems.some((item) => item.href.replace(/\/+$/, '') === '/localities')) {
    const provincesIndex = navItems.findIndex((item) => item.href === country.regionsPath);
    navItems.splice(provincesIndex >= 0 ? provincesIndex + 1 : navItems.length, 0, {
      name: 'Localities', href: '/localities', icon: Map, external: false, badge: null,
    });
  }

  // Country extension sections (client/src/extensions), before Blogs
  for (const ext of EXTENSION_NAV) {
    if (navItems.some((item) => item.href === ext.href)) continue;
    const at = navItems.findIndex((item) => item.href === '/blogs');
    navItems.splice(at >= 0 ? at : navItems.length, 0, { name: ext.name, href: ext.href, icon: Compass, external: false, badge: null });
  }

  // Enhanced icon component mapping with adaptive icon support
  function getIconComponent(iconName: string) {
    if (!iconName) return Home;
    
    // All imported Lucide icons with proper ES6 imports
    const lucideIcons = {
      // Navigation & Core
      'Home': Home, 'Grid3X3': Grid3X3, 'MapPin': MapPin, 'Menu': Menu,
      // Content & Media  
      'Newspaper': Newspaper, 'FileText': FileText, 'Plus': Plus, 'Scan': Scan,
      // Business & Professional
      'Building2': Building2, 'Shield': Shield, 'User': User, 'Settings': Settings,
      'Briefcase': Briefcase, 'TrendingUp': TrendingUp, 'Target': Target, 'Award': Award,
      'Crown': Crown, 'Gem': Gem, 'Zap': Zap, 'Rocket': Rocket, 'Globe': Globe, 'Lock': Lock,
      // Communication
      'Mail': Mail, 'Phone': Phone, 'MessageCircle': MessageCircle, 'Send': Send, 'Megaphone': Megaphone,
      // Location & Navigation
      'Navigation': Navigation, 'Compass': Compass, 'Route': Route, 'Map': Map, 'Landmark': Landmark,
      // Technology
      'Monitor': Monitor, 'Smartphone': Smartphone, 'Cpu': Cpu, 'Database': Database, 'Code': Code,
      // Pakistani & Regional
      'Building': Building, 'Sun': Sun, 'Moon': Moon, 'Star': Star, 'Coins': Coins,
      // Services & Industries
      'Car': Car, 'Truck': Truck, 'Plane': Plane, 'Hotel': Hotel, 'Coffee': Coffee,
      'ShoppingCart': ShoppingCart, 'Store': Store, 'Heart': Heart, 'Activity': Activity
    };
    
    // Handle kebab-case conversions
    const kebabToPascal = (str: string) => {
      return str.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');
    };
    
    // Try direct match first
    if (lucideIcons[iconName as keyof typeof lucideIcons]) {
      return lucideIcons[iconName as keyof typeof lucideIcons];
    }
    
    // Try kebab-case conversion
    const pascalCase = kebabToPascal(iconName);
    if (lucideIcons[pascalCase as keyof typeof lucideIcons]) {
      return lucideIcons[pascalCase as keyof typeof lucideIcons];
    }
    
    // Fallback to Home icon
    return Home;
  }

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        window.location.href = "/";
      } else {
        // Fallback to traditional logout if POST fails
        window.location.href = "/api/logout";
      }
    } catch (error) {
      // Fallback to traditional logout on error
      window.location.href = "/api/logout";
    }
  };


  const isActive = (href: string) =>
    location === href || (href !== "/" && location.startsWith(`${href}/`));

  const go = (href: string, external?: boolean) => (e: React.MouseEvent) => {
    if (external || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  };

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}` || "U";

  return (
    <header className="site-header sticky top-0 z-50 border-b border-[#E7E9EE] bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <FlagStripe />
      <div className="yp-wrap flex min-h-[72px] items-center gap-3 py-2.5 2xl:gap-5">
        <PakistanypLogo href="/" onClick={go("/")} />

        {/* Desktop navigation — admin-configured menu when available */}
        <nav aria-label="Main navigation" className="site-nav hidden xl:flex items-center gap-0.5">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              aria-current={!item.external && isActive(item.href) ? "page" : undefined}
              className="inline-flex items-center gap-2 rounded-[10px] px-2 py-2.5 text-sm 2xl:px-3 font-medium text-[#3A4354] no-underline transition-colors hover:bg-[#F1F2F6] hover:text-[#0A0A0A] aria-[current=page]:bg-[#F1F2F6] aria-[current=page]:text-[#0A0A0A]"
              onClick={go(item.href, item.external)}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
            >
              {item.name}
              {item.badge && (
                <span className="rounded-full bg-[#D71920] px-2 py-0.5 text-[11px] font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitch compact className="hidden sm:inline-flex" />
          {isAuthenticated ? (
            <>
              <a
                href="/pricing"
                onClick={go("/pricing")}
                className="yp-btn yp-btn-red hidden sm:inline-flex"
              >
                List your business
              </a>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="relative h-11 w-11 rounded-full" aria-label="Open account menu">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.profileImageUrl} alt={user?.firstName} />
                      <AvatarFallback className="bg-[#0B6B2E] text-sm font-semibold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60" align="end" forceMount>
                  <div className="flex flex-col gap-1 p-2">
                    {user?.firstName && (
                      <p className="font-semibold text-[#0A0A0A]">{user.firstName} {user.lastName}</p>
                    )}
                    {user?.email && (
                      <p className="w-[210px] truncate text-sm text-[#5B6475]">{user.email}</p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <Building2 className="me-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin-enhanced")}>
                    <Shield className="me-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <Settings className="me-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="me-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <a href="/login" onClick={go("/login")} className="yp-btn yp-btn-ghost hidden sm:inline-flex">
                Sign in
              </a>
              <a href="/register" onClick={go("/register")} className="yp-btn yp-btn-red hidden sm:inline-flex">
                List your business
              </a>
            </>
          )}

          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="yp-btn yp-btn-ghost w-11 px-0 xl:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(90vw,400px)] overflow-y-auto bg-white p-0">
              <SheetTitle className="sr-only">{localize("PakistanYP navigation")}</SheetTitle>
              <FlagStripe />
              <div className="flex flex-col gap-4 p-5">
                <PakistanypLogo height={44} />
                <LanguageSwitch className="self-start" />

                {navItems.length > 0 && (
                  <nav aria-label="Mobile navigation" className="yp-side flex flex-col gap-1 border-t border-[#EEF0F4] pt-4">
                    {navItems.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        data-active={!item.external && isActive(item.href) ? "true" : undefined}
                        onClick={() => {
                          if (item.external) {
                            window.open(item.href, '_blank', 'noopener,noreferrer');
                          } else {
                            navigate(item.href);
                          }
                          setIsOpen(false);
                        }}
                        className="yp-side-link"
                      >
                        <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="ms-auto rounded-full bg-[#D71920] px-2 py-0.5 text-[11px] font-semibold text-white">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                )}

                <div className="flex flex-col gap-2 border-t border-[#EEF0F4] pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      navigate(isAuthenticated ? "/pricing" : "/register");
                      setIsOpen(false);
                    }}
                    className="yp-btn yp-btn-red w-full"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    List your business
                  </button>
                  {!isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/login");
                        setIsOpen(false);
                      }}
                      className="yp-btn yp-btn-ghost w-full"
                    >
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      Sign in
                    </button>
                  )}
                </div>

                {country.social.length > 0 && (
                <div className="flex items-center gap-3 border-t border-[#EEF0F4] pt-4 text-[#5B6475]">
                  {country.social.map(({ name, href }) => ({ name, href, Icon: SOCIAL_ICONS[name] || Globe })).map(({ name, href, Icon }) => (
                    <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={tx("Follow {0} on {1}", country.brand, name)} className="grid h-11 w-11 place-items-center rounded-xl border border-[#E3E6EC] hover:text-[#0B6B2E]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ))}
                </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
