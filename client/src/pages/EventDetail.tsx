import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, MapPin, Tag, Globe, Phone, Mail, User, ArrowLeft, ExternalLink, Heart, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Helmet } from "@/lib/helmet-compat";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { country, localize } from "@shared/country";

interface EventDetail {
  id: number;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  categoryId: number;
  provinceId: number | null;
  localityId: number | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string | null;
  isAllDay: boolean;
  isRecurring: boolean;
  recurrencePattern: string | null;
  venueName: string;
  venueAddress: string | null;
  venueMapUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  isFree: boolean;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  ticketUrl: string | null;
  featuredImage: string | null;
  imageGallery: string[] | null;
  videoUrl: string | null;
  organizerName: string | null;
  organizerEmail: string | null;
  organizerPhone: string | null;
  organizerWebsite: string | null;
  ageRestriction: string | null;
  dressCode: string | null;
  languages: string[] | null;
  amenities: string[] | null;
  tags: string[] | null;
  status: string;
  isFeatured: boolean;
  viewCount: number | null;
  attendeeCount: number | null;
  maxCapacity: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
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
    arabicName: string | null;
  } | null;
  locality: {
    id: number;
    name: string;
  } | null;
}

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading } = useQuery<EventDetail>({
    queryKey: ["/api/events", slug],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="yp-wrap py-24 text-center">
          <p className="text-[#5B6475]">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Header />
        <div className="yp-wrap py-24 text-center">
          <div className="yp-label">{localize("PakistanYP Events")}</div>
          <h1 className="yp-h2 mt-3 mb-6 text-[#0A0A0A]">Event Not Found</h1>
          <Link href="/events" className="yp-btn yp-btn-primary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Events
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const eventDate = parseISO(event.startDate);
  const endDate = event.endDate ? parseISO(event.endDate) : null;

  return (
    <>
      <Helmet>
        <title>{event.metaTitle || `${event.title} - ${country.adjective} Events`}</title>
        <meta name="description" content={event.metaDescription || event.shortDescription || event.description.substring(0, 160)} />
      </Helmet>

      <div className="min-h-screen bg-white">
        <Header />
        {/* Event header */}
        <div className="yp-wrap max-w-[900px] pt-10 sm:pt-14 text-center">
          <div className="mb-8 flex justify-center">
            <Link href="/events" className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[#3A4354] hover:text-[#0B6B2E]" data-testid="button-back-to-events">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Events
            </Link>
          </div>
          {event.category && (
            <div className="yp-label !text-[#0B6B2E] mb-5">{event.category.name}</div>
          )}
          <h1 className="m-0 text-[clamp(36px,5vw,58px)] font-bold leading-[1.05] tracking-[-0.045em] text-[#0A0A0A]" data-testid="heading-event-title">
            {event.title}
          </h1>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px] text-[#3A4354] [&_svg]:text-[#0B6B2E]">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>
                {format(eventDate, "EEEE, MMMM d, yyyy")}
                {endDate && ` - ${format(endDate, "MMMM d, yyyy")}`}
              </span>
            </div>
            {event.startTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>
                  {event.startTime}
                  {event.endTime && ` - ${event.endTime}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>{event.venueName}</span>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        {event.featuredImage && (
          <div className="yp-wrap pt-10 sm:pt-12">
            <div className="aspect-[16/10] overflow-hidden rounded-[20px] bg-[#F1F2F6] sm:aspect-[21/9] sm:rounded-[28px]">
              <img
                src={event.featuredImage}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="yp-wrap pt-12 pb-24">
          <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">
            {/* Main Content */}
            <div className="lg:col-span-2 min-w-0 space-y-12">
              {/* Short Description */}
              {event.shortDescription && (
                <div>
                  <p className="text-xl text-[#4B5565] leading-[1.55]">
                    {event.shortDescription}
                  </p>
                </div>
              )}

              {/* Full Description */}
              <div>
                <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#0A0A0A] mb-4">About This Event</h2>
                <div className="yp-prose max-w-[700px]">
                  <p className="whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Image Gallery */}
              {event.imageGallery && event.imageGallery.length > 0 && (
                <div>
                  <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#0A0A0A] mb-4">Gallery</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {event.imageGallery.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${event.title} - Image ${index + 1}`}
                        className="rounded-[20px] w-full aspect-[16/10] object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div>
                <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#0A0A0A] mb-4">Event Details</h2>
                <div className="grid sm:grid-cols-2 gap-3 [&>div]:rounded-[14px] [&>div]:bg-[#F7F8FA] [&>div]:p-4">
                  {event.ageRestriction && (
                    <div>
                      <h3 className="yp-label mb-2">
                        Age Restriction
                      </h3>
                      <p className="text-[#0A0A0A] font-medium">{event.ageRestriction}</p>
                    </div>
                  )}
                  
                  {event.dressCode && (
                    <div>
                      <h3 className="yp-label mb-2">
                        Dress Code
                      </h3>
                      <p className="text-[#0A0A0A] font-medium">{event.dressCode}</p>
                    </div>
                  )}
                  
                  {event.languages && event.languages.length > 0 && (
                    <div>
                      <h3 className="yp-label mb-2">
                        Languages
                      </h3>
                      <p className="text-[#0A0A0A] font-medium">{event.languages.join(", ")}</p>
                    </div>
                  )}
                  
                  {event.maxCapacity && (
                    <div>
                      <h3 className="yp-label mb-2">
                        Capacity
                      </h3>
                      <p className="text-[#0A0A0A] font-medium">{event.maxCapacity} attendees</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              {event.amenities && event.amenities.length > 0 && (
                <div>
                  <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#0A0A0A] mb-4">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {event.amenities.map((amenity, index) => (
                      <span key={index} className="yp-tag yp-tag-green">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div>
                  <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#0A0A0A] mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span key={index} className="rounded-full bg-[#F1F2F6] px-3 py-2 text-sm text-[#3A4354]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Venue Details */}
              <Card className="p-6">
                <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#0A0A0A] mb-4">Venue & Location</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#0A0A0A] mb-1">{event.venueName}</h3>
                    {event.venueAddress && (
                      <p className="text-[#5B6475]">{event.venueAddress}</p>
                    )}
                    {event.locality && event.province && (
                      <p className="text-[#5B6475]">
                        {event.locality.name}, {event.province.name}
                      </p>
                    )}
                  </div>
                  
                  {event.venueMapUrl && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={event.venueMapUrl} target="_blank" rel="noopener noreferrer">
                        <MapPin className="mr-2 h-4 w-4" />
                        View on Map
                      </a>
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Ticket Card */}
              <Card className="p-6 lg:sticky lg:top-24">
                <div className="mb-6">
                  <div className="text-sm text-[#5B6475] mb-2">
                    {event.isFree ? "Free Entry" : "Ticket Price"}
                  </div>
                  <div className="text-3xl font-bold tracking-[-0.03em] text-[#0B6B2E]">
                    {event.isFree ? "FREE" : (
                      <>
                        {event.currency} {event.priceMin}
                        {event.priceMax && event.priceMax !== event.priceMin && (
                          <span> - {event.priceMax}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {event.ticketUrl && (
                  <Button className="w-full mb-4" size="lg" asChild data-testid="button-get-tickets">
                    <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                      Get Tickets
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" aria-label="Bookmark" data-testid="button-bookmark">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" aria-label="Favourite" data-testid="button-favorite">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" aria-label="Share" data-testid="button-share">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                <Separator className="my-6 bg-[#EEF0F4]" />

                {/* Event Info */}
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[#0B6B2E] mt-0.5 flex-none" />
                    <div>
                      <div className="font-medium text-[#0A0A0A]">Date & Time</div>
                      <div className="text-[#5B6475]">
                        {format(eventDate, "EEEE, MMMM d, yyyy")}
                        {event.startTime && (
                          <div>{event.startTime}{event.endTime && ` - ${event.endTime}`}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#0B6B2E] mt-0.5 flex-none" />
                    <div>
                      <div className="font-medium text-[#0A0A0A]">Location</div>
                      <div className="text-[#5B6475]">
                        {event.venueName}
                        {event.locality && <div>{event.locality.name}</div>}
                      </div>
                    </div>
                  </div>

                  {event.category && (
                    <div className="flex items-start gap-3">
                      <Tag className="h-5 w-5 text-[#0B6B2E] mt-0.5 flex-none" />
                      <div>
                        <div className="font-medium text-[#0A0A0A]">Category</div>
                        <div className="text-[#5B6475]">
                          {event.category.name}
                        </div>
                      </div>
                    </div>
                  )}

                  {event.viewCount && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-[#0B6B2E] mt-0.5 flex-none" />
                      <div>
                        <div className="font-medium text-[#0A0A0A]">Interest</div>
                        <div className="text-[#5B6475]">
                          {event.viewCount.toLocaleString()} views
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Organizer Info */}
                {event.organizerName && (
                  <>
                    <Separator className="my-6 bg-[#EEF0F4]" />
                    <div>
                      <h3 className="yp-label mb-3">Organizer</h3>
                      <div className="space-y-2 text-sm">
                        <div className="font-medium text-[#0A0A0A]">{event.organizerName}</div>
                        {event.organizerEmail && (
                          <a href={`mailto:${event.organizerEmail}`} className="flex items-center gap-2 text-[#0B6B2E] hover:text-[#05501F] break-all">
                            <Mail className="h-4 w-4" />
                            {event.organizerEmail}
                          </a>
                        )}
                        {event.organizerPhone && (
                          <a href={`tel:${event.organizerPhone}`} className="flex items-center gap-2 text-[#0B6B2E] hover:text-[#05501F] break-all">
                            <Phone className="h-4 w-4" />
                            {event.organizerPhone}
                          </a>
                        )}
                        {event.organizerWebsite && (
                          <a href={event.organizerWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#0B6B2E] hover:text-[#05501F] break-all">
                            <Globe className="h-4 w-4" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
