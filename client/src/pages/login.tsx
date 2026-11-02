import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, LayoutDashboard, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { country, localize } from "@shared/country";
import { AuthSplit, AuthAside, AuthAsideCard, AuthHeading, authInputClass, authBtnClass } from "@/components/auth-shell";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      console.log('Attempting login with:', credentials.email);
      return await apiRequest("POST", "/api/auth/login", credentials);
    },
    onSuccess: async (data) => {
      console.log('Login successful, data:', data);

      // Invalidate auth query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      // Check onboarding status after successful login
      try {
        const user = await apiRequest("GET", "/api/auth/user");
        if (!user.onboardingCompleted) {
          setLocation("/onboarding");
        } else {
          setLocation("/dashboard");
        }
      } catch (error) {
        // If we can't check onboarding status, just go to dashboard
        setLocation("/dashboard");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    },
  });

  // Google sign-in removed - using email/password only

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <AuthSplit
      aside={
        <AuthAside
          eyebrow="For business owners"
          title="Your next customer is already searching."
          card={
            <AuthAsideCard
              icon={<LayoutDashboard className="h-5 w-5" aria-hidden="true" />}
              title="Your business dashboard"
              subtitle="Everything about your listing in one place"
              items={[
                "Keep hours, photos and contact details up to date",
                "Reply to customer reviews",
                "See how people find your business",
              ]}
            />
          }
          checks={["Free to claim", "Verified badge", "Reply to reviews"]}
          footnote={localize("Listing businesses across all provinces and territories.")}
        />
      }
      footnote={
        <>
          © {new Date().getFullYear()}{` ${country.brand} ·`}{" "}
          <Link href="/privacy" className="text-[#5B6475] hover:text-[#0A0A0A]">Privacy</Link> ·{" "}
          <Link href="/terms" className="text-[#5B6475] hover:text-[#0A0A0A]">Terms</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <AuthHeading title="Welcome back" subtitle="Sign in to manage your account and listings." />

        <div className="yp-field">
          <Label htmlFor="email" className="text-sm font-medium text-[#283141]">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.pk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
            required
          />
        </div>

        <div className="yp-field">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-sm font-medium text-[#283141]">Password</Label>
            <Link href="/forgot-password" className="text-sm font-medium text-[#0B6B2E] hover:text-[#05501F]">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${authInputClass} pr-12`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-lg text-[#5B6475] hover:text-[#0A0A0A]"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-[#3A4354] min-h-6 cursor-pointer">
          <input type="checkbox" className="w-[18px] h-[18px] m-0 accent-[#0B6B2E]" />
          Keep me signed in
        </label>

        <Button type="submit" disabled={loginMutation.isPending} className={authBtnClass}>
          {loginMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <p className="m-0 text-center text-[15px] text-[#5B6475]">
          {localize("New to PakistanYP?")}{" "}
          <Link href="/register" className="font-semibold text-[#0B6B2E] hover:text-[#05501F]">
            Create an account
          </Link>
        </p>

        <p className="m-0 text-center text-xs text-[#5B6475]">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-[#0A0A0A]">Terms of Service</Link> and{" "}
          <Link href="/privacy" className="underline hover:text-[#0A0A0A]">Privacy Policy</Link>.
        </p>
      </form>
    </AuthSplit>
  );
}
