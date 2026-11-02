import { dateLocale } from "@shared/i18n";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Newspaper } from "lucide-react";

const coverTints = [
  { bg: "#E8F4EC", fg: "#0B6B2E" },
  { bg: "#FFF4E0", fg: "#B45309" },
  { bg: "#E6F6F1", fg: "#047857" },
];

function Heading({ showLink }: { showLink?: boolean }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="yp-label">Insights</div>
        <h2 className="yp-h2 mt-2 text-[#0A0A0A]">From the blog</h2>
      </div>
      {showLink && (
        <Link href="/blogs" className="text-[15px] font-semibold text-[#0B6B2E] hover:text-[#05501F]">
          All articles →
        </Link>
      )}
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(dateLocale("en-GB"), { day: "numeric", month: "short", year: "numeric" });
}

export default function BlogSection() {
  const [, navigate] = useLocation();

  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ['/api/blog'],
    queryFn: async () => {
      const response = await fetch('/api/blog?limit=3');
      if (!response.ok) throw new Error('Failed to fetch blog posts');
      return response.json();
    },
    staleTime: 0, // Always fresh data
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <section className="yp-wrap py-16 md:py-24">
        <Heading />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3" aria-hidden="true">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="home-blog-card flex animate-pulse flex-col gap-3.5">
              <div className="aspect-[16/10] rounded-[20px] bg-[#F1F2F6]" />
              <div className="h-3 w-1/3 rounded bg-[#F1F2F6]" />
              <div className="h-5 w-5/6 rounded bg-[#F1F2F6]" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Display only if there are actual blog posts from the database
  if (!blogPosts || blogPosts.length === 0) {
    return (
      <section className="yp-wrap py-16 md:py-24">
        <Heading />
        <div className="yp-card mx-auto max-w-2xl p-8 text-center">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-[#E8F4EC] text-[#0B6B2E]" aria-hidden="true">
            <Newspaper className="h-6 w-6" />
          </span>
          <h3 className="mb-2 text-xl font-semibold text-[#0A0A0A]">No blog posts yet</h3>
          <p className="mb-5 text-[#5B6475]">
            Our content team is working on bringing you valuable business insights. Check back soon for the latest articles and industry updates.
          </p>
          <Button variant="outline" onClick={() => navigate('/contact-us')}>
            Subscribe for Updates
          </Button>
        </div>
      </section>
    );
  }

  const postsToShow = blogPosts.slice(0, 3);

  return (
    <section className="yp-wrap py-16 md:py-24">
      <Heading showLink />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {postsToShow.map((post: any, index: number) => {
          const tint = coverTints[index % coverTints.length];
          const date = formatDate(post.publishedAt);
          const minutes = post.readingTime || 3;
          return (
            <Link
              key={post.id}
              href={`/blogs/${post.slug}`}
              className="home-blog-card group flex flex-col gap-3.5 text-[#0A0A0A] hover:text-[#0A0A0A]"
            >
              <div
                className="aspect-[16/10] overflow-hidden rounded-[20px]"
                style={{ background: tint.bg, color: tint.fg }}
              >
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center" aria-hidden="true">
                    <Newspaper className="h-10 w-10" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <span className="yp-label">
                {[date, `${minutes} min read`].filter(Boolean).join(" · ")}
              </span>
              <span className="line-clamp-2 text-[21px] font-semibold leading-[1.3] tracking-[-0.02em] group-hover:text-[#0B6B2E]">
                {post.title}
              </span>
              {post.excerpt && (
                <span className="line-clamp-2 text-[15px] leading-[1.55] text-[#4B5565]">{post.excerpt}</span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
