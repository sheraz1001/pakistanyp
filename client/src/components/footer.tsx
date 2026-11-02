import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Mail, Instagram, Facebook, Linkedin, Twitter, ChevronDown } from "lucide-react";
import NewsletterSubscription from "./newsletter-subscription";
import { PakistanypLogo } from "./brand/pakistanyp-logo";
import "./footer.css";
import { country, localize } from "@shared/country";
import { t as tx } from "@shared/i18n";

const SOCIAL_ICONS: Record<string, typeof Instagram> = { Instagram, Facebook, LinkedIn: Linkedin, X: Twitter };

interface FooterLink {
  name: string;
  href: string;
  external?: boolean;
}

function Footer() {
  const [, navigate] = useLocation();
  const [desktopMenus, setDesktopMenus] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const updateMenus = () => setDesktopMenus(media.matches);
    updateMenus();
    media.addEventListener("change", updateMenus);
    return () => media.removeEventListener("change", updateMenus);
  }, []);

  // Fetch footer menu items from admin panel
  const { data: footerMenuItems = [] } = useQuery({
    queryKey: ['/api/menus/location/footer'],
    queryFn: async () => {
      const response = await fetch('/api/menus/location/footer', { credentials: "include" });
      if (!response.ok) return [];
      const items = await response.json();
      return Array.isArray(items) ? items : [];
    },
  });

  // Fetch Support menu items from admin panel
  const { data: supportMenuItems = [] } = useQuery({
    queryKey: ['/api/admin/menus', 'Support'],
    queryFn: async () => {
      const menusResponse = await fetch('/api/admin/menus', { credentials: "include" });
      if (!menusResponse.ok) return [];
      const menus = await menusResponse.json();
      if (!Array.isArray(menus)) return [];
      const supportMenu = menus.find((menu: any) => menu.name === 'Support');
      
      if (supportMenu) {
        const menuItemsResponse = await fetch(`/api/admin/menus/${supportMenu.id}`, { credentials: "include" });
        if (!menuItemsResponse.ok) return [];
        const menuData = await menuItemsResponse.json();
        return Array.isArray(menuData.items) ? menuData.items : [];
      }
      return [];
    },
  });

  // Fetch Quick Links menu items from admin panel
  const { data: quickLinksMenuItems = [] } = useQuery({
    queryKey: ['/api/admin/menus', 'Quick Links'],
    queryFn: async () => {
      const menusResponse = await fetch('/api/admin/menus', { credentials: "include" });
      if (!menusResponse.ok) return [];
      const menus = await menusResponse.json();
      if (!Array.isArray(menus)) return [];
      const quickLinksMenu = menus.find((menu: any) => menu.name === 'Quick Links');
      
      if (quickLinksMenu) {
        const menuItemsResponse = await fetch(`/api/admin/menus/${quickLinksMenu.id}`, { credentials: "include" });
        if (!menuItemsResponse.ok) return [];
        const menuData = await menuItemsResponse.json();
        return Array.isArray(menuData.items) ? menuData.items : [];
      }
      return [];
    },
  });

  function menuHref(item: any): string {
    const href = item.targetPage || item.url || "/";
    if (item.linkType === "external") return item.url || "/";
    try {
      const url = new URL(href, country.origin);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return "/";
    }
  }

  // Convert menu items to footer format
  const footerMenuNav = footerMenuItems.length > 0 ? footerMenuItems
    .filter((item: any) => item.isVisible !== false)
    .map((item: any) => ({
      name: item.title,
      href: menuHref(item),
      external: item.linkType === 'external',
    })) : [];

  // Convert support menu items to footer format
  const supportMenuNav = supportMenuItems.length > 0 ? supportMenuItems
    .filter((item: any) => item.isVisible !== false)
    .map((item: any) => ({
      name: item.title,
      href: menuHref(item),
      external: item.linkType === 'external',
    })) : [];

  // Convert quick links menu items to footer format
  const quickLinksMenuNav = quickLinksMenuItems.length > 0 ? quickLinksMenuItems
    .filter((item: any) => item.isVisible !== false)
    .map((item: any) => ({
      name: item.title,
      href: menuHref(item),
      external: item.linkType === 'external',
    })) : [];

  const footerLinks: { quickLinks: FooterLink[]; support: FooterLink[] } = {
    quickLinks: quickLinksMenuNav.length > 0 ? quickLinksMenuNav : footerMenuNav.length > 0 ? footerMenuNav : [
      { name: "Browse Categories", href: "/categories" },
      { name: localize("All Provinces"), href: country.regionsPath },
      { name: "Localities", href: "/localities" },
      { name: "Featured Businesses", href: "/categories?featured=true" },
      { name: "Blogs", href: "/blogs" },
      { name: "Add Your Business", href: "/add-business-enhanced" },
      { name: "About Us", href: "/about" },
    ],
    support: supportMenuNav.length > 0 ? supportMenuNav : [
      { name: "Help Center", href: "/help-center" },
      { name: "Contact Us", href: "/contact-us" },
      { name: "Privacy Policy", href: "/pages/privacy-policy" },
      { name: "Terms of Service", href: "/pages/terms-of-service" },
      { name: "Business Guidelines", href: "/business-guidelines" },
      { name: "Advertise With Us", href: "/advertise-with-us" },
    ],
  };



  const onNav = (link: FooterLink) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!link.external && !event.defaultPrevented && event.button === 0 &&
        !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      navigate(link.href);
    }
  };

  const businessLinks: FooterLink[] = [
    { name: "List your business", href: "/add-business-enhanced" },
    { name: "Claim a listing", href: "/register" },
    { name: "Owner dashboard", href: "/dashboard" },
    { name: "Pricing", href: "/pricing" },
    { name: "Advertise with us", href: "/advertise-with-us" },
  ];

  const columns = [
    { title: "Explore", links: footerLinks.quickLinks },
    { title: "Businesses", links: businessLinks },
    { title: "Support", links: footerLinks.support },
  ];

  return (
    <footer className="site-footer" aria-label={localize("PakistanYP footer")}>
      <div className="yp-wrap footer-main">
        <div className="footer-brand">
          <PakistanypLogo href="/" priority={false} onClick={(e) => { e.preventDefault(); navigate("/"); }} />
          <p className="footer-description">
            {localize("Pakistan business directory. Find, compare and contact companies across all provinces and territories.")}
          </p>
          <address className="footer-contact">
            <span className="footer-contact-row"><MapPin size={16} aria-hidden="true" />{country.contact.address}</span>
            <a href={`mailto:${country.contact.email}`} className="footer-contact-row"><Mail size={16} aria-hidden="true" />{country.contact.email}</a>
          </address>
          {country.social.length > 0 && (
          <div className="footer-socials" role="group" aria-label={tx("Follow {0}", country.brand)}>
            {country.social.map(({ name, href }) => ({ name, href, Icon: SOCIAL_ICONS[name] || Mail })).map(({ name, href, Icon }) => (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={tx("Follow {0} on {1} (opens in a new tab)", country.brand, name)}>
                <Icon size={17} aria-hidden="true" />
              </a>
            ))}
          </div>
          )}
        </div>
        {columns.map(({ title, links }) => (
          <nav key={title} className="footer-menu" aria-label={tx("Footer {0}", title)}>
            <h2 className="yp-label footer-menu-title">{title}</h2>
            <details className="footer-menu-disclosure" open={desktopMenus || undefined}>
              <summary className="footer-menu-summary">
                <span>{title}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <ul className="footer-links">
                {links.filter((link, index, group) => group.findIndex((entry) => entry.href === link.href) === index)
                  .map((link, index) => (
                  <li key={`${link.href}-${index}`}>
                    <a
                      href={link.href}
                      onClick={onNav(link)}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </nav>
        ))}
      </div>

      <div className="yp-wrap">
        <NewsletterSubscription className="footer-newsletter" />
      </div>

      <div className="yp-wrap footer-bottom">
        <p>
          &copy; {new Date().getFullYear()}{tx(" {0}. All rights reserved. Developed by", country.brand)}{" "}
          <a href="https://www.webmaster.ae" target="_blank" rel="noopener noreferrer" className="footer-credit">
            Webmaster Technology
          </a>
        </p>
        <p className="footer-legal">
          <a href="/pages/privacy-policy" onClick={onNav({ name: "Privacy", href: "/pages/privacy-policy" })}>Privacy</a>
          <a href="/pages/terms-of-service" onClick={onNav({ name: "Terms", href: "/pages/terms-of-service" })}>Terms</a>
          <a href="/contact-us" onClick={onNav({ name: "Contact", href: "/contact-us" })}>Contact</a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
