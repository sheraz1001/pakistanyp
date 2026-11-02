import { useId, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { localize } from "@shared/country";

interface NewsletterSubscriptionProps {
  className?: string;
  /** "footer" (default) uses footer.css classes; "inline" is a green-tint in-page box. */
  variant?: "footer" | "inline";
  title?: string;
  description?: string;
}

export default function NewsletterSubscription({
  className = "",
  variant = "footer",
  title,
  description,
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const formId = useId();
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: async ({ email, name }: { email: string; name?: string }) => {
      return await apiRequest("POST", "/api/newsletter/subscribe", { email, name });
    },
    onSuccess: () => {
      setIsSuccess(true);
      setErrorMessage("");
      setEmail("");
      setName("");
      toast({
        title: "Successfully Subscribed!",
        description: "Please check your email to confirm your subscription.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error("Newsletter subscription error:", error);
      setErrorMessage("We couldn't subscribe you. Please try again.");
      toast({
        title: "Subscription Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (subscribeMutation.isPending || isSuccess) return;
    setErrorMessage("");
    
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    subscribeMutation.mutate({ email: email.trim(), name: name.trim() });
  };

  if (variant === "inline") {
    const busy = subscribeMutation.isPending || isSuccess;
    return (
      <section
        className={`rounded-[28px] bg-[#E8F4EC] p-7 sm:p-10 lg:p-14 flex flex-wrap items-center justify-between gap-6 ${className}`}
        aria-labelledby={`${formId}-heading`}
      >
        <div className="flex-[1_1_360px] min-w-0">
          <h2 id={`${formId}-heading`} className="m-0 text-[28px] sm:text-[32px] font-bold tracking-[-0.035em] text-[#0A0A0A]">
            {title || localize("Get Pakistan business brief")}
          </h2>
          <p className="mt-2 text-base text-[#3A4354]">
            {description || localize("New guides and Pakistani business news, straight to your inbox.")}
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-busy={subscribeMutation.isPending}
          className="flex-[1_1_380px] min-w-0"
        >
          <div className="flex flex-wrap gap-2">
            <label htmlFor={`${formId}-email`} className="flex-[1_1_220px] min-w-0">
              <span className="sr-only">Email address</span>
              <input
                id={`${formId}-email`}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="you@company.pk"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage("");
                }}
                disabled={busy}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={`${formId}-status`}
                required
                className="w-full min-h-[52px] rounded-[14px] border border-[#BFE0CB] bg-white px-4 text-[15px] text-[#0A0A0A] focus:outline focus:outline-[3px] focus:outline-[#BFE3CD] focus:border-[#0B6B2E]"
              />
            </label>
            <button type="submit" disabled={busy} className="yp-btn yp-btn-primary yp-btn-lg">
              {isSuccess ? "Subscribed" : subscribeMutation.isPending ? "Subscribing…" : "Subscribe"}
              {isSuccess ? <Check size={16} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
            </button>
          </div>
          <div
            id={`${formId}-status`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`mt-2 min-h-[20px] text-sm ${errorMessage ? "text-[#B3141B]" : "text-[#05501F]"}`}
          >
            {errorMessage || (isSuccess
              ? "You're subscribed. Check your email to confirm your subscription."
              : subscribeMutation.isPending ? "Your subscription is being submitted." : "")}
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className={className} aria-labelledby={`${formId}-heading`}>
      <div className="footer-newsletter-intro">
        <h2 id={`${formId}-heading`} className="footer-heading">Business Newsletter</h2>
        <p className="footer-newsletter-copy">
          {localize("Pakistani business news, straight to your inbox.")}
        </p>
      </div>
      <form onSubmit={handleSubmit} noValidate aria-busy={subscribeMutation.isPending}>
        <div className="footer-newsletter-fields">
          <div className="footer-field">
            <label htmlFor={`${formId}-name`}>Your name <span>(optional)</span></label>
            <input
              id={`${formId}-name`}
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={subscribeMutation.isPending || isSuccess}
            />
          </div>
          <div className="footer-field">
            <label htmlFor={`${formId}-email`}>Email address</label>
            <input
              id={`${formId}-email`}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage("");
              }}
              disabled={subscribeMutation.isPending || isSuccess}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={`${formId}-status ${formId}-privacy`}
              required
            />
          </div>
        </div>
        <button type="submit" disabled={subscribeMutation.isPending || isSuccess} className="footer-subscribe">
          {isSuccess ? "Subscribed" : subscribeMutation.isPending ? "Subscribing…" : "Subscribe"}
          {isSuccess ? <Check size={16} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
        </button>
        <div id={`${formId}-status`} role="status" aria-live="polite" aria-atomic="true" className={`footer-form-status ${errorMessage ? "footer-form-error" : ""}`}>
          {errorMessage || (isSuccess ? (
            <span className="footer-form-success">
              <Check size={18} aria-hidden="true" />
              <span>You're subscribed. Check your email to confirm your subscription.</span>
            </span>
          ) : subscribeMutation.isPending ? "Your subscription is being submitted." : "")}
        </div>
      </form>
      <p id={`${formId}-privacy`} className="footer-privacy">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </section>
  );
}