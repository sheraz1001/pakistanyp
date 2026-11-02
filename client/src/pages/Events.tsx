import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin, Tag, Filter, X, Grid3x3, List, Calendar as CalendarViewIcon, Star, Bookmark, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Helmet } from "@/lib/helmet-compat";
import { country, localize } from "@shared/country";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

interface EventCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface Event {
  id: number;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  categoryId: number;
  provinceId: number | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  isAllDay: boolean;
  venueName: string;
  venueAddress: string | null;
  isFree: boolean;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  ticketUrl: string | null;
  featuredImage: string | null;
  status: string;
  isFeatured: boolean;
  viewCount: number | null;
  attendeeCount: number | null;
  maxCapacity: number | null;
  category: {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  } | null;
  province: {
    id: number;
    name: string;
  } | null;
}

export default function Events() {
  const [viewMode, setViewMode] = useState<"list" | "grid" | "calendar">("grid");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", { 
      categoryId: selectedCategories.length === 1 ? selectedCategories[0] : undefined,
      provinceId: selectedProvince !== "all" ? selectedProvince : undefined,
      isFree: priceFilter === "free" ? "true" : undefined
    }]
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<EventCategory[]>({
    queryKey: ["/api/event-categories"]
  });

  // Fetch provinces
  const { data: provinces = [] } = useQuery<any[]>({
    queryKey: ["/api/provinces"]
  });

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter
      if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(event.categoryId)) {
        return false;
      }
      
      // Province filter
      if (selectedProvince !== "all" && event.provinceId?.toString() !== selectedProvince) {
        return false;
      }
      
      // Price filter
      if (priceFilter === "free" && !event.isFree) {
        return false;
      }
      if (priceFilter === "under-100" && event.isFree === false && (event.priceMin || 0) > 100) {
        return false;
      }
      
      return true;
    });
  }, [events, searchQuery, selectedCategories, selectedProvince, priceFilter]);

  const featuredEvents = useMemo(() => {
    return filteredEvents.filter(e => e.isFeatured);
  }, [filteredEvents]);

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedProvince("all");
    setPriceFilter("all");
    setSearchQuery("");
  };

  const activeFilterCount = selectedCategories.length + 
    (selectedProvince !== "all" ? 1 : 0) + 
    (priceFilter !== "all" ? 1 : 0);

  return (
    <>
      <Helmet>
        <title>{tx("{0} Events Calendar | Concerts, Sports, Festivals & More", country.adjective)}</title>
        <meta name="description" content={tx("Discover upcoming events across {0}. Browse concerts, sports, festivals, exhibitions, and cultural events. Book tickets now!", country.name)} />
      </Helmet>

      <div className="min-h-screen bg-[#FAF8F3]">
        <Header />
        {/* Hero Section */}
        <section className="border-b border-[#E7E9EE] bg-[#F2F9F4]">
          <div className="yp-wrap pt-12 pb-10 sm:pt-16 sm:pb-12">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-[680px]">
                <div className="yp-label">{localize("PakistanYP Events")}</div>
                <h1 className="mt-2.5 mb-0 text-[clamp(40px,5vw,64px)] font-bold leading-[1.02] tracking-[-0.045em] text-[#0A0A0A]" data-testid="heading-events-hero">
                  {tx("Discover {0} Events", country.adjective)}
                </h1>
                <p className="yp-lead mt-4 mb-0" data-testid="text-events-subtitle">
                  From world-class concerts to cultural festivals - find your next experience
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-[360px]">
                <CalendarIcon className="pointer-events-none absolute start-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#5B6475]" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search events..."
                  aria-label="Search events"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="yp-input !rounded-[14px] !pl-10 !pr-10"
                  data-testid="input-search-events"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute end-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#5B6475] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]"
                    data-testid="button-clear-search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Category Filters */}
            {categories.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {categories.slice(0, 6).map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="yp-chip min-h-[40px] px-4"
                    data-active={selectedCategories.includes(category.id) ? "true" : undefined}
                    aria-pressed={selectedCategories.includes(category.id)}
                    data-testid={`button-category-${category.slug}`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="yp-wrap py-10 pb-24">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            {showFilters && (
              <aside className="lg:w-72 lg:flex-none space-y-6">
                <Card className="p-6 lg:sticky lg:top-24">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#0A0A0A] flex items-center gap-2">
                      <Filter className="h-5 w-5 text-[#0B6B2E]" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="yp-pill bg-[#E3A82B] text-[#141414] !min-h-[22px] !px-2">{activeFilterCount}</span>
                      )}
                    </h3>
                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        data-testid="button-clear-filters"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-3">
                    <h4 className="yp-label">
                      Categories
                    </h4>
                    <div className="space-y-2">
                      {categories.map(category => (
                        <div key={category.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={selectedCategories.includes(category.id)}
                            onCheckedChange={() => toggleCategory(category.id)}
                            data-testid={`checkbox-category-${category.slug}`}
                          />
                          <label
                            htmlFor={`category-${category.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-6 bg-[#EEF0F4]" />

                  {/* Province Filter */}
                  <div className="space-y-3">
                    <h4 className="yp-label">
                      {country.regionTerm.singular}
                    </h4>
                    <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                      <SelectTrigger data-testid="select-province">
                        <SelectValue placeholder={tx("All {0}", country.regionTerm.plural)} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{tx("All {0}", country.regionTerm.plural)}</SelectItem>
                        {provinces.map(province => (
                          <SelectItem key={province.id} value={province.id.toString()}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="my-6 bg-[#EEF0F4]" />

                  {/* Price Filter */}
                  <div className="space-y-3">
                    <h4 className="yp-label">
                      Price
                    </h4>
                    <Select value={priceFilter} onValueChange={setPriceFilter}>
                      <SelectTrigger data-testid="select-price">
                        <SelectValue placeholder="All Prices" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Prices</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="under-100">{tx("Under {0} 100", country.currency)}</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              </aside>
            )}

            {/* Main Content */}
            <div className="flex-1">
              {/* View Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                    data-testid="button-toggle-filters"
                  >
                    <Filter className="h-4 w-4 me-2" />
                    Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                  </Button>
                  <p className="text-sm text-[#5B6475]">{tj("{0} events found", filteredEvents.length)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                    aria-pressed={viewMode === "grid"}
                    className="h-10 w-10 p-0"
                    data-testid="button-view-grid"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    aria-label="List view"
                    aria-pressed={viewMode === "list"}
                    className="h-10 w-10 p-0"
                    data-testid="button-view-list"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "calendar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("calendar")}
                    aria-label="Calendar view"
                    aria-pressed={viewMode === "calendar"}
                    className="h-10 w-10 p-0"
                    data-testid="button-view-calendar"
                  >
                    <CalendarViewIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Featured Events */}
              {featuredEvents.length > 0 && viewMode !== "calendar" && (
                <div className="mb-12">
                  <div className="yp-label mb-2">Don't miss</div>
                  <h2 className="m-0 mb-6 text-[28px] font-bold tracking-[-0.035em] text-[#0A0A0A]">
                    Featured Events
                  </h2>
                  <div className="grid gap-6">
                    {featuredEvents.slice(0, 2).map(event => (
                      <Link key={event.id} href={`/events/${event.slug}`}>
                        <div className="yp-card yp-card-link grid gap-6 rounded-[28px] p-4 cursor-pointer group md:grid-cols-2 md:gap-10" data-testid={`card-event-${event.slug}`}>
                            <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-[#F1F2F6]">
                              <img
                                src={event.featuredImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87"}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="px-2 pb-4 md:py-4 md:ps-0 md:pe-6 flex flex-col justify-center">
                              <span className="mb-4 flex flex-wrap items-center gap-2.5">
                                <span className="yp-pill bg-[#E3A82B] text-[#141414]">Featured</span>
                                {event.category && <span className="yp-label">{event.category.name}</span>}
                              </span>
                              <h3 className="text-[clamp(26px,3vw,34px)] font-bold leading-[1.12] tracking-[-0.035em] text-[#0A0A0A] mb-4 group-hover:text-[#0B6B2E] transition-colors" data-testid={`text-event-title-${event.slug}`}>
                                {event.title}
                              </h3>
                              <div className="space-y-2 mb-4 text-[15px] text-[#3A4354] [&_svg]:text-[#0B6B2E]">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>{format(parseISO(event.startDate), "MMMM d, yyyy")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>{event.startTime || "All Day"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.venueName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4" />
                                  <span>
                                    {event.isFree ? "Free" : `${event.currency} ${event.priceMin}${event.priceMax && event.priceMax !== event.priceMin ? ` - ${event.priceMax}` : ""}`}
                                  </span>
                                </div>
                              </div>
                              {event.shortDescription && (
                                <p className="text-[15px] leading-relaxed text-[#4B5565] mb-5 line-clamp-2">
                                  {event.shortDescription}
                                </p>
                              )}
                              <span className="yp-btn yp-btn-primary w-full md:w-auto md:self-start" data-testid={`button-view-event-${event.slug}`}>
                                View Details
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                              </span>
                            </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Events Grid/List View */}
              {viewMode !== "calendar" && (
                <div className={viewMode === "grid" ? "grid sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                  {eventsLoading ? (
                    <div className="col-span-full yp-card text-center py-12">
                      <p className="text-[#5B6475]">Loading events...</p>
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="col-span-full yp-card text-center px-6 py-16">
                      <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-[#E8F4EC] text-[#0B6B2E]"><CalendarIcon className="h-6 w-6" /></span>
                      <h3 className="yp-h3 mb-2 text-[#0A0A0A]">No events found</h3>
                      <p className="text-[#5B6475] mb-5">
                        Try adjusting your filters or search query
                      </p>
                      {activeFilterCount > 0 && (
                        <Button onClick={clearAllFilters} variant="outline" data-testid="button-clear-filters-empty">
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredEvents.map(event => (
                      <EventCard key={event.id} event={event} viewMode={viewMode} />
                    ))
                  )}
                </div>
              )}

              {/* Calendar View */}
              {viewMode === "calendar" && (
                <CalendarView events={filteredEvents} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

function EventCard({ event, viewMode }: { event: Event; viewMode: "grid" | "list" }) {
  const price = event.isFree ? "Free" : `${event.currency} ${event.priceMin}${event.priceMax && event.priceMax !== event.priceMin ? ` - ${event.priceMax}` : ""}`;
  if (viewMode === "list") {
    return (
      <Link href={`/events/${event.slug}`} className="block text-[#0A0A0A] hover:text-[#0A0A0A]">
        <div className="yp-card yp-card-link overflow-hidden cursor-pointer group p-3 sm:flex sm:gap-5" data-testid={`card-event-${event.slug}`}>
          <div className="relative aspect-[16/10] sm:aspect-auto sm:w-56 sm:flex-none overflow-hidden rounded-[14px] bg-[#F1F2F6]">
            <img
              src={event.featuredImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87"}
              alt={event.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1 px-2 py-3 sm:ps-0">
            {event.category && <span className="yp-label">{event.category.name}</span>}
            <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.02em] mb-3 group-hover:text-[#0B6B2E] transition-colors" data-testid={`text-event-title-${event.slug}`}>
              {event.title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-sm text-[#3A4354] [&_svg]:text-[#0B6B2E]">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 flex-none" />
                <span>{format(parseISO(event.startDate), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-none" />
                <span>{event.startTime || "All Day"}</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 flex-none" />
                <span className="truncate">{event.venueName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 flex-none" />
                <span>
                  {event.isFree ? "Free" : `${event.currency} ${event.priceMin}`}
                </span>
              </div>
            </div>
            {event.shortDescription && (
              <p className="text-sm text-[#4B5565] line-clamp-2">
                {event.shortDescription}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.slug}`} className="block h-full text-[#0A0A0A] hover:text-[#0A0A0A]">
      <div className="yp-card yp-card-link flex h-full flex-col overflow-hidden cursor-pointer group p-3" data-testid={`card-event-${event.slug}`}>
        <div className="relative aspect-[16/10] overflow-hidden rounded-[14px] bg-[#F1F2F6]">
          <img
            src={event.featuredImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87"}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 start-3 min-w-[52px] rounded-xl bg-white px-2 py-1.5 text-center shadow-[0_8px_24px_-12px_rgba(10,10,10,.35)]">
            <div className="text-xl font-bold leading-none text-[#0B6B2E]">
              {format(parseISO(event.startDate), "d")}
            </div>
            <div className="mt-1 font-mono text-[11px] font-medium uppercase tracking-[.06em] text-[#5B6475]">
              {format(parseISO(event.startDate), "MMM")}
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col px-2 pt-4 pb-2">
          {event.category && <span className="yp-label">{event.category.name}</span>}
          <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.02em] mb-3 line-clamp-2 group-hover:text-[#0B6B2E] transition-colors" data-testid={`text-event-title-${event.slug}`}>
            {event.title}
          </h3>
          <div className="space-y-2 mb-4 text-sm text-[#3A4354] [&_svg]:text-[#0B6B2E]">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 flex-none" />
              <span>{event.startTime || "All Day"}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-4 w-4 flex-none" />
              <span className="truncate">{event.venueName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 flex-none" />
              <span className="font-semibold text-[#05501F]">
                {price}
              </span>
            </div>
          </div>
          {event.shortDescription && (
            <p className="text-sm text-[#4B5565] line-clamp-2 mb-4">
              {event.shortDescription}
            </p>
          )}
          <span className="yp-btn yp-btn-ghost mt-auto w-full group-hover:border-[#0B6B2E] group-hover:text-[#0B6B2E]" data-testid={`button-view-event-${event.slug}`}>
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}

function CalendarView({ 
  events, 
  currentMonth, 
  setCurrentMonth 
}: { 
  events: Event[]; 
  currentMonth: Date; 
  setCurrentMonth: (date: Date) => void;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const eventsOnDate = (date: Date) => {
    return events.filter(event => isSameDay(parseISO(event.startDate), date));
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="yp-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#0A0A0A]">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth} data-testid="button-prev-month">
            ← Previous
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth} data-testid="button-next-month">
            Next →
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto"><div className="grid min-w-[560px] grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center yp-label py-2">
            {day}
          </div>
        ))}
        
        {daysInMonth.map(day => {
          const dayEvents = eventsOnDate(day);
          return (
            <div
              key={day.toString()}
              className={`min-h-24 border border-[#E7E9EE] rounded-xl p-2 ${
                isSameMonth(day, currentMonth)
                  ? "bg-white"
                  : "bg-[#F7F8FA]"
              }`}
              data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
            >
              <div className="text-sm font-medium text-[#0A0A0A] mb-1">
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <Link key={event.id} href={`/events/${event.slug}`}>
                    <div className="text-xs bg-[#E8F4EC] text-[#05501F] rounded-md px-1.5 py-0.5 truncate hover:bg-[#CFE8D8] cursor-pointer">
                      {event.title}
                    </div>
                  </Link>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-[#5B6475]">{tj("+{0} more", dayEvents.length - 2)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div></div>
    </div>
  );
}
