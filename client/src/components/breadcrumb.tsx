import { Link } from "wouter";


interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav className={`flex flex-wrap items-center gap-2 text-sm text-[#5B6475] ${className}`} aria-label="Breadcrumb">
      <Link href="/" className="flex-shrink-0 text-[#0B6B2E] hover:text-[#05501F]">
        Home
      </Link>
      
      {items.filter((item, index) => !(index === 0 && /^home$/i.test(item.label.trim()))).map((item, index) => (
        <div key={index} className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true">/</span>
          {item.href ? (
            <Link 
              href={item.href} 
              className="text-[#0B6B2E] hover:text-[#05501F] truncate max-w-[160px] sm:max-w-none"
              title={item.label}
            >
              {item.label}
            </Link>
          ) : (
            <span 
              className="text-[#3A4354] truncate max-w-[180px] sm:max-w-none" 
              title={item.label}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}