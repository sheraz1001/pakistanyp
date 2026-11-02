import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { AuthPage, AuthCard, AuthHeading, AuthIcon, authInputClass, authBtnClass } from '@/components/auth-shell';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/auth/forgot-password', data);
      setIsSubmitted(true);
      toast({
        title: "Email Sent",
        description: "If an account with this email exists, a password reset link has been sent.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthPage>
        <AuthCard>
          <AuthIcon><Mail className="h-6 w-6" aria-hidden="true" /></AuthIcon>
          <AuthHeading
            title="Check your email"
            subtitle="If an account with this email exists, we've sent you a password reset link. Please check your email and follow the instructions to reset your password."
          />
          <Button asChild className={authBtnClass}>
            <Link href="/login">
              <ArrowLeft className="me-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </AuthCard>
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <AuthCard>
        <AuthHeading
          title="Forgot password?"
          subtitle="Enter your email address and we'll send you a link to reset your password."
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-[#283141]">Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" placeholder="you@company.pk" className={authInputClass} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className={authBtnClass} disabled={isLoading}>
              {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>

            <Button asChild variant="outline" className={authBtnClass}>
              <Link href="/login">
                <ArrowLeft className="me-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </form>
        </Form>
      </AuthCard>
    </AuthPage>
  );
}
