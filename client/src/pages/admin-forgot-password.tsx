import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Header from "@/components/header";
import Footer from "@/components/footer";

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function AdminForgotPassword() {
  const [, setLocation] = useLocation();
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
      const response = await fetch("/api/admin/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Email Sent",
          description: "If an admin account with this email exists, a password reset link has been sent.",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to send password reset email");
      }
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
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 bg-[#FAF8F3] px-4 py-12 sm:py-16 flex items-center justify-center">
          <Card className="w-full max-w-[480px] rounded-[24px] shadow-[0_24px_60px_-36px_rgba(10,10,10,.3)]">
            <CardHeader className="text-center px-6 sm:px-10 pt-8 sm:pt-10">
              <div className="mx-auto mb-4 w-12 h-12 rounded-[14px] grid place-items-center bg-[#E8F4EC]">
                <Mail className="h-6 w-6 text-[#0B6B2E]" />
              </div>
              <CardTitle className="text-[28px] leading-[1.15] tracking-[-0.04em] font-bold text-[#0A0A0A]">Check Your Email</CardTitle>
              <CardDescription>
                If an admin account with this email exists, we've sent you a password reset link.
                Please check your email and follow the instructions to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-10 pb-8 sm:pb-10">
              <Button 
                onClick={() => setLocation('/admin-login')}
                className="w-full h-12 rounded-xl text-[15px] font-semibold"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin Login
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-[#FAF8F3] px-4 py-12 sm:py-16 flex items-center justify-center">
        <Card className="w-full max-w-[480px] rounded-[24px] shadow-[0_24px_60px_-36px_rgba(10,10,10,.3)]">
          <CardHeader className="text-center px-6 sm:px-10 pt-8 sm:pt-10">
            <div className="mx-auto mb-4 w-12 h-12 rounded-[14px] grid place-items-center bg-[#E8F4EC]">
              <Shield className="h-6 w-6 text-[#0B6B2E]" />
            </div>
            <CardTitle className="text-[28px] leading-[1.15] tracking-[-0.04em] font-bold text-[#0A0A0A]">Reset Admin Password</CardTitle>
            <CardDescription>
              Enter your admin email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 sm:px-10 pb-8 sm:pb-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Admin Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="admin@pakistanyp.com"
                          className="w-full h-12 text-base md:text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-[15px] font-semibold" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12 rounded-xl text-[15px] font-semibold"
                  onClick={() => setLocation('/admin-login')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Admin Login
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}