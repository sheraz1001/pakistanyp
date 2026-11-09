import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link, useLocation } from "wouter";
import {
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PasswordStrengthMeter } from "@/components/password-strength-meter";
import { AuthTopBar, AuthCard, AuthHeading, AuthIcon, authInputClass, authBtnClass } from "@/components/auth-shell";

const STEPS = ["Your account", "Verify email"];

function RegisterSteps({ current }: { current: number }) {
  return (
    <ol className="list-none m-0 p-0 flex gap-2" aria-label="Steps">
      {STEPS.map((label, i) => (
        <li key={label} className="flex-1 flex flex-col gap-2" aria-current={i === current ? "step" : undefined}>
          <span className={`h-1 rounded-full ${i <= current ? "bg-[#0B6B2E]" : "bg-[#DDE1E8]"}`} />
          <span className={`text-[13px] ${i === current ? "font-semibold text-[#0A0A0A]" : "text-[#5B6475]"}`}>
            {i + 1}. {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function RegisterShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3] text-[#0A0A0A] font-sans">
      <AuthTopBar
        right={
          <span className="text-[15px] text-[#5B6475]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#0B6B2E] hover:text-[#05501F]">Sign in</Link>
          </span>
        }
      />
      <main className="flex-1 flex justify-center px-4 sm:px-6 pt-4 pb-16">
        <div className="w-full max-w-[560px] flex flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'form' | 'verification' | 'complete'>('form');
  const [userEmail, setUserEmail] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Email availability check with debounce
  const checkEmailAvailability = useCallback(
    debounce(async (email: string) => {
      if (!email || !z.string().email().safeParse(email).success) {
        setEmailAvailable(null);
        return;
      }

      setCheckingEmail(true);
      try {
        const response = await apiRequest("POST", "/api/auth/check-email", { email });
        setEmailAvailable(!response.exists);
      } catch (error) {
        console.error('Email check failed:', error);
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 500),
    []
  );

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { confirmPassword, ...registrationData } = data;
      return await apiRequest("POST", "/api/auth/register", registrationData);
    },
    onSuccess: (data) => {
      setUserEmail(data.user.email);
      setRegistrationStep('verification');
      toast({
        title: "Registration Successful!",
        description: data.emailSent 
          ? "Please check your email to verify your account." 
          : "Your account has been created. You can now log in.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/auth/resend-verification", { email });
    },
    onSuccess: () => {
      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the verification link.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  // Handle email field changes for availability checking
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'email' && value.email) {
        checkEmailAvailability(value.email);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, checkEmailAvailability]);

  // Show verification step if needed
  if (registrationStep === 'verification') {
    return (
      <RegisterShell>
        <RegisterSteps current={1} />
        <AuthCard className="max-w-none">
          <AuthIcon><Mail className="h-6 w-6" aria-hidden="true" /></AuthIcon>
          <AuthHeading
            title="Verify your email"
            subtitle={<>We've sent a verification link to <strong className="text-[#0A0A0A]">{userEmail}</strong></>}
          />
          <div className="yp-tint rounded-[14px] p-4 flex gap-3 text-sm text-[#3A4354] leading-relaxed">
            <CheckCircle className="h-5 w-5 shrink-0 text-[#0B6B2E]" aria-hidden="true" />
            <span>Please check your email and click the verification link to activate your account.</span>
          </div>
          <p className="m-0 text-sm text-[#5B6475]">
            Didn't receive the email? Check your spam folder or request a new one.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className={authBtnClass}
              onClick={() => resendVerificationMutation.mutate(userEmail)}
              disabled={resendVerificationMutation.isPending}
            >
              {resendVerificationMutation.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </Button>
            <Button className={authBtnClass} onClick={() => setLocation('/login')}>
              Go to Login
            </Button>
          </div>
        </AuthCard>
      </RegisterShell>
    );
  }

  return (
    <RegisterShell>
      <RegisterSteps current={0} />
      <AuthCard className="max-w-none">
        <AuthHeading title="Create your account" subtitle="Free for customers and business owners." />

        {isSuccessful ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-16 w-16 text-[#0B6B2E] mb-4" />
            <h3 className="text-xl font-semibold text-[#0A0A0A] mb-2">Account Created Successfully!</h3>
            <p className="text-[#4B5565] mb-4">
              Please check your email to verify your account before logging in.
            </p>
            <p className="text-sm text-[#5B6475]">
              Redirecting to login page...
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-[#283141]">First name</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" autoComplete="given-name" placeholder="John" className={authInputClass} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-[#283141]">Last name</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" autoComplete="family-name" placeholder="Doe" className={authInputClass} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-[#283141]">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.pk"
                          className={`${authInputClass} pe-12`}
                        />
                        {checkingEmail && (
                          <Loader2 className="absolute end-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-[#5B6475]" />
                        )}
                        {!checkingEmail && emailAvailable === true && (
                          <CheckCircle className="absolute end-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#0B6B2E]" />
                        )}
                        {!checkingEmail && emailAvailable === false && (
                          <AlertCircle className="absolute end-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#D71920]" />
                        )}
                      </div>
                    </FormControl>
                    {emailAvailable === false && (
                      <p className="text-sm text-[#B91C1C] mt-1">
                        This email is already registered. <Link href="/login" className="underline font-medium text-[#0B6B2E] hover:text-[#05501F]">Sign in instead?</Link>
                      </p>
                    )}
                    {emailAvailable === true && (
                      <p className="text-sm text-[#047857] mt-1 flex items-center">
                        <CheckCircle className="me-1 h-3 w-3" />
                        Email is available
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-[#283141]">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Create a strong password"
                          className={`${authInputClass} pe-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute end-1 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-lg text-[#5B6475] hover:text-[#0A0A0A]"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    {/* Password Strength Meter */}
                    <PasswordStrengthMeter
                      password={field.value || ''}
                      onStrengthChange={(strength, isValid) => {
                        setPasswordStrength(strength);
                        setIsPasswordValid(isValid);
                      }}
                      className="mt-3"
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-[#283141]">Confirm password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Confirm your password"
                          className={`${authInputClass} pe-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          className="absolute end-1 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-lg text-[#5B6475] hover:text-[#0A0A0A]"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Terms & Conditions */}
              <label htmlFor="terms" className="flex gap-2.5 items-start text-sm text-[#3A4354] leading-normal cursor-pointer">
                <input
                  id="terms"
                  type="checkbox"
                  className="w-[18px] h-[18px] mt-0.5 shrink-0 accent-[#0B6B2E]"
                  required
                />
                <span>
                  I agree to the{" "}
                  <Link href="/pages/terms-of-service" className="text-[#0B6B2E] hover:text-[#05501F] font-medium">Terms of Service</Link>{" "}
                  and{" "}
                  <Link href="/pages/privacy-policy" className="text-[#0B6B2E] hover:text-[#05501F] font-medium">Privacy Policy</Link>.
                </span>
              </label>

              <Button
                type="submit"
                disabled={registerMutation.isPending || emailAvailable === false || !isPasswordValid}
                className={`${authBtnClass} min-h-[52px] h-[52px]`}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>

              {!isPasswordValid && passwordStrength > 0 && (
                <p className="m-0 text-sm text-[#B45309] text-center">
                  Please create a stronger password to continue
                </p>
              )}
            </form>
          </Form>
        )}
      </AuthCard>
    </RegisterShell>
  );
}
