import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AuthSplit, AuthAside, AuthAsideCard, AuthHeading, AdminTag, authInputClass, authBtnClass } from "@/components/auth-shell";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await apiRequest("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // apiRequest already handles response parsing and error checking
      toast({
        title: "Login Successful",
        description: `Welcome back, ${result.user.firstName}!`,
      });

      // Redirect based on user role
      switch (result.user.role) {
        case "super_admin":
          setLocation("/super-admin");
          break;
        case "admin":
          setLocation("/admin-dashboard");
          break;
        case "moderator":
          setLocation("/moderator-dashboard");
          break;
        case "content_manager":
          setLocation("/content-dashboard");
          break;
        case "business_manager":
          setLocation("/business-dashboard");
          break;
        default:
          setLocation("/admin-dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error type:", typeof error);
      console.error("Error constructor:", error.constructor?.name);
      console.error("Is Error instance:", error instanceof Error);
      
      let errorMessage = "Login failed. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplit
      badge={<AdminTag />}
      footnote={<>© {new Date().getFullYear()} PakistanYP · Secure admin access</>}
      aside={
        <AuthAside
          eyebrow="Admin portal"
          title="Keep the directory accurate and trusted."
          card={
            <AuthAsideCard
              icon={<Shield className="h-5 w-5" aria-hidden="true" />}
              title="Administrator access"
              subtitle="Role-based tools for the PakistanYP team"
              items={[
                "Review business listings and claims",
                "Moderate reviews and content",
                "Manage users and permissions",
              ]}
            />
          }
          checks={["Role-based access", "Secure sessions"]}
          footnote="Authorised staff only."
        />
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <AuthHeading title="Admin sign in" subtitle="Secure access to PakistanYP administration." />

        {error && (
          <Alert className="bg-[#FDECEC] border-[#F5C2C4] text-[#B91C1C] rounded-xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="yp-field">
          <Label htmlFor="email" className="text-sm font-medium text-[#283141]">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@pakistanyp.com"
            required
            className={authInputClass}
            disabled={isLoading}
          />
        </div>

        <div className="yp-field">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-sm font-medium text-[#283141]">Password</Label>
            <button
              type="button"
              className="text-sm font-medium text-[#0B6B2E] hover:text-[#05501F]"
              onClick={() => setLocation("/admin-forgot-password")}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className={`${authInputClass} pr-12`}
              disabled={isLoading}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-lg text-[#5B6475] hover:text-[#0A0A0A] disabled:opacity-50"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className={authBtnClass} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </AuthSplit>
  );
}
