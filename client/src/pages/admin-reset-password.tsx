import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, EyeOff, CheckCircle, ArrowLeft, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Header from "@/components/header";
import Footer from "@/components/footer";

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function AdminResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

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
      // apiRequest throws with the server's message on failure and returns parsed JSON on success
      await apiRequest("POST", "/api/admin/reset-password", { token, password: data.password });
      setIsSuccess(true);
      toast({
        title: "Success",
        description: "Admin password reset successfully!",
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
    setLocation('/admin-login');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 bg-[#FAF8F3] px-4 py-12 sm:py-16 flex items-center justify-center">
          <Card className="w-full max-w-[480px] rounded-[24px] shadow-[0_24px_60px_-36px_rgba(10,10,10,.3)]">
            <CardHeader className="text-center px-6 sm:px-10 pt-8 sm:pt-10">
              <div className="mx-auto mb-4 w-12 h-12 rounded-[14px] grid place-items-center bg-[#E8F4EC]">
                <CheckCircle className="h-6 w-6 text-[#0B6B2E]" />
              </div>
              <CardTitle className="text-[28px] leading-[1.15] tracking-[-0.04em] font-bold text-[#0A0A0A]">Password Reset!</CardTitle>
              <CardDescription>
                Your admin password has been successfully reset. You can now log in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-10 pb-8 sm:pb-10">
              <Button 
                onClick={handleLoginRedirect}
                className="w-full h-12 rounded-xl text-[15px] font-semibold"
              >
                <Shield className="mr-2 h-4 w-4" />
                Continue to Admin Login
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
              Enter your new password below to reset your admin account password.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 sm:px-10 pb-8 sm:pb-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            className="h-12 pr-12 text-base md:text-base"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            className="h-12 pr-12 text-base md:text-base"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
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
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Reset Password
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