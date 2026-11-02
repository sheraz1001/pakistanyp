import { useQuery } from "@tanstack/react-query";
import { Building2, Users, Target, Globe, Award, TrendingUp } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import SEO from '@/components/seo';
import { country, localize } from '@shared/country';
import { t as tx } from "@shared/i18n";

export default function About() {
  // Live directory figures (no invented numbers)
  const { data: live } = useQuery<any>({ queryKey: ['/api/stats'] });
  const fmt = (n: unknown) => (typeof n === 'number' && n > 0 ? n.toLocaleString('en-US') : null);
  const stats = [
    { label: 'Businesses Listed', value: fmt(live?.totalBusinesses), icon: Building2 },
    { label: 'Categories', value: fmt(live?.totalCategories), icon: Target },
    { label: 'Localities', value: fmt(live?.totalLocalities ?? live?.totalCities), icon: Users },
    { label: localize('Provinces Covered'), value: String(country.regions.length), icon: Globe },
  ].filter((s) => s.value);

  const features = [
    {
      icon: Target,
      title: 'Smart Business Discovery',
      description: tx("Advanced AI-powered search and recommendations help users find exactly what they need across all {0} {1} {2}.", country.regions.length, country.adjective, country.regionTerm.plural.toLowerCase()),
    },
    {
      icon: Users,
      title: 'Verified Business Network',
      description: 'All businesses go through our verification process ensuring authentic, reliable business information for our users.',
    },
    {
      icon: Award,
      title: 'Premium Features',
      description: 'Enhanced business profiles, analytics, and marketing tools help businesses grow and connect with customers.',
    },
    {
      icon: TrendingUp,
      title: 'Business Growth Tools',
      description: 'Comprehensive dashboard with insights, customer management, and growth analytics for business success.',
    },
  ];

  const tiles = [
    'bg-[#E8F4EC] text-[#0B6B2E]',
    'bg-[#FFF4E0] text-[#B45309]',
    'bg-[#E6F6F1] text-[#047857]',
    'bg-[#FDECEC] text-[#B91C1C]',
  ];

  const values = [
    { icon: Target, title: 'Excellence', description: 'We strive for excellence in everything we do, from our technology to our customer service.' },
    { icon: Users, title: 'Community', description: "We believe in building strong business communities that support each other's growth and success." },
    { icon: TrendingUp, title: 'Innovation', description: 'We continuously innovate to provide cutting-edge solutions that drive business growth.' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#0A0A0A]">
      <SEO 
        title="About Us - Pakistani Business Directory"
        description="Learn about PakistanYP, the leading Pakistani business directory platform connecting businesses and customers across all provinces and territories with advanced AI-powered discovery."
        canonical="https://pakistanyp.com/about"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-white border-b border-[#E7E9EE]">
          <div className="yp-wrap py-16 md:py-24 text-center flex flex-col items-center gap-5">
            <span className="yp-label !text-[#0B6B2E]">About us</span>
            <h1 className="yp-h1 max-w-4xl">{localize("About PakistanYP")}</h1>
            <p className="yp-lead max-w-3xl">
              {tx("{0}'s premier business directory platform, connecting entrepreneurs, businesses, and customers across all {1} {2} through innovative technology.", country.name, country.regions.length, country.regionTerm.plural.toLowerCase())}
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="yp-wrap pt-16 md:pt-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="yp-label">Our mission</span>
              <h2 className="yp-h2 mt-2 mb-6">Our Mission</h2>
              <p className="text-lg leading-relaxed text-[#3A4354] mb-5">
                {localize("To empower businesses across Pakistan by providing the most comprehensive, intelligent, and user-friendly business discovery platform.")}
              </p>
              <p className="text-lg leading-relaxed text-[#3A4354]">
                {tx("We believe every business deserves the opportunity to be discovered, whether it's a local restaurant or a tech startup {0}. Our platform bridges the gap between businesses and their potential customers through advanced AI technology and deep local market understanding.", country.inName)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <div key={stat.label} className="yp-card p-6">
                  <span className={`w-12 h-12 rounded-[14px] grid place-items-center mb-5 ${tiles[i % tiles.length]}`}>
                    <stat.icon className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <div className="text-3xl font-bold tracking-[-0.04em]">{stat.value}</div>
                  <div className="text-sm text-[#5B6475] mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="yp-wrap pt-16 md:pt-24">
          <div className="max-w-3xl mb-10">
            <span className="yp-label">{localize("Why PakistanYP")}</span>
            <h2 className="yp-h2 mt-2 mb-4">What Makes Us Different</h2>
            <p className="yp-lead">
              {localize("We're not just another business directory. We're a comprehensive ecosystem designed to help Pakistani businesses thrive in the digital age.")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <div key={feature.title} className="yp-card yp-card-link p-6 flex flex-col gap-4">
                <span className={`w-12 h-12 rounded-[14px] grid place-items-center ${tiles[i % tiles.length]}`}>
                  <feature.icon className="w-6 h-6" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-semibold tracking-[-0.02em]">{feature.title}</h3>
                <p className="text-[15px] leading-relaxed text-[#4B5565]">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values Section */}
        <section className="yp-wrap pt-16 md:pt-24">
          <div className="mb-10">
            <span className="yp-label">What we stand for</span>
            <h2 className="yp-h2 mt-2">Our Values</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {values.map((value, i) => (
              <div key={value.title} className="yp-card p-7 flex flex-col gap-4">
                <span className={`w-12 h-12 rounded-[14px] grid place-items-center ${tiles[i % tiles.length]}`}>
                  <value.icon className="w-6 h-6" aria-hidden="true" />
                </span>
                <h3 className="yp-h3">{value.title}</h3>
                <p className="text-[15px] leading-relaxed text-[#4B5565]">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="yp-wrap py-16 md:py-24">
          <div className="yp-tint rounded-[28px] p-8 md:p-16 flex flex-col items-center text-center gap-5">
            <span className="yp-label !text-[#0B6B2E]">For business owners</span>
            <h2 className="text-[clamp(32px,4vw,48px)] font-bold tracking-[-0.04em] leading-[1.05]">
              Ready to Grow Your Business?
            </h2>
            <p className="text-[17px] leading-relaxed text-[#3A4354]">
              Join thousands of businesses already thriving on our platform.
            </p>
            <div className="flex flex-wrap gap-2.5 justify-center">
              <a href="/add-business-enhanced" className="yp-btn yp-btn-red yp-btn-lg">
                List Your Business
              </a>
              <a href="/contact-us" className="yp-btn yp-btn-ghost yp-btn-lg">
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
