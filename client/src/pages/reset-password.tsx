import { useState } from 'react';
import { useSearch, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { PasswordStrengthMeter } from '@/components/password-strength-meter';
import { AuthPage, AuthCard, AuthHeading, AuthIcon, authInputClass, authBtnClass } from '@/components/auth-shell';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const { toast } = useToast();
  const search = useSearch();
  const [, setLocation] = useLocation();

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    const params = new URLSearchParams(search);
    const token = params.get('token');

    if (!token) {
      toast({
        title: "Error",
        description: "Invalid reset link. No token provided.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/auth/reset-password', {
        token,
        password: data.password
      });
      
      setIsSuccess(true);
      toast({
        title: "Success",
        description: "Password reset successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    setLocation('/login');
  };

  if (isSuccess) {
    return (
      <AuthPage>
        <AuthCard>
          <AuthIcon><CheckCircle className="h-6 w-6" aria-hidden="true" /></AuthIcon>
          <AuthHeading
            title="Password reset"
            subtitle="Your password has been successfully reset. You can now log in with your new password."
          />
          <Button onClick={handleLoginRedirect} className={authBtnClass}>
            Continue to Login
          </Button>
        </AuthCard>
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <AuthCard>
        <AuthHeading title="Set a new password" subtitle="Enter your new password below." />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-[#283141]">New password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Enter new password"
                        {...field}
                        className={`${authInputClass} pe-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute end-1 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-lg text-[#5B6475] hover:text-[#0A0A0A]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                        {...field}
                        className={`${authInputClass} pe-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        className="absolute end-1 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-lg text-[#5B6475] hover:text-[#0A0A0A]"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className={authBtnClass}
              disabled={isLoading || !isPasswordValid}
            >
              {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
            {!isPasswordValid && passwordStrength > 0 && (
              <p className="m-0 text-sm text-[#B45309] text-center">
                Please create a stronger password to continue
              </p>
            )}
          </form>
        </Form>
      </AuthCard>
    </AuthPage>
  );
}
