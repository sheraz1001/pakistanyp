import { MailService } from '@sendgrid/mail';
import { storage } from './storage';

class EmailService {
  private mailService: MailService;
  private initialized = false;

  constructor() {
    this.mailService = new MailService();
  }

  private async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Check if SendGrid API key is configured
      let apiKey = process.env.SENDGRID_API_KEY;
      
      if (!apiKey) {
        // Try to get from system settings
        const setting = await storage.getSystemSetting('SENDGRID_API_KEY');
        apiKey = setting?.value;
      }

      if (!apiKey) {
        console.warn('SendGrid API key not configured. Email functionality disabled.');
        return false;
      }

      this.mailService.setApiKey(apiKey);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, firstName: string, token: string): Promise<boolean> {
    const canSend = await this.initialize();
    if (!canSend) return false;

    try {
      // Use the production domain for email links
      const domain = 'pakistanyp.com';
      const verificationUrl = `https://${domain}/verify-email?token=${token}`;
      
      await this.mailService.send({
        to: email,
        from: 'accounts@pakistanyp.com',
        subject: 'Verify Your Email - Pakistan Yellow Pages',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Pakistan Yellow Pages</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Welcome to Pakistan Business Directory</p>
            </div>
            
            <div style="padding: 40px; background: white;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hi ${firstName}!</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                Thank you for signing up for Pakistan Yellow Pages. To complete your registration and start exploring 
                thousands of businesses across Pakistan, please verify your email address.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                If you didn't create this account, you can safely ignore this email.
                <br>
                This verification link will expire in 24 hours.
              </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2025 Pakistan Yellow Pages. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<boolean> {
    const canSend = await this.initialize();
    if (!canSend) return false;

    try {
      // Use the production domain for email links
      const domain = 'pakistanyp.com';
      const resetUrl = `https://${domain}/reset-password?token=${token}`;
      
      await this.mailService.send({
        to: email,
        from: 'accounts@pakistanyp.com',
        subject: 'Reset Your Password - Pakistan Yellow Pages',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Pakistan Yellow Pages</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
            </div>
            
            <div style="padding: 40px; background: white;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hi ${firstName}!</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                We received a request to reset your password for your Pakistan Yellow Pages account.
                Click the button below to create a new password.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                If you didn't request this password reset, you can safely ignore this email.
                <br>
                This reset link will expire in 1 hour.
              </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2025 Pakistan Yellow Pages. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  // Test email functionality
  async sendTestEmail(testEmail: string): Promise<{ success: boolean; message: string }> {
    const canSend = await this.initialize();
    if (!canSend) {
      return { success: false, message: 'Email service not initialized - Check SendGrid API key' };
    }

    try {
      console.log('Attempting to send test email to:', testEmail);
      
      await this.mailService.send({
        to: testEmail,
        from: 'support@pakistanyp.com',
        subject: 'PakistanYP Email Test - System Working!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">✅ Email System Test</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">PakistanYP Email Service is Working!</p>
            </div>
            
            <div style="padding: 30px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 20px;">
              <h2 style="color: #1f2937; margin: 0 0 15px 0;">Test Email Successful!</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                This is a test email from the Pakistan Yellow Pages (PakistanYP) platform. If you received this email, 
                it means our email sending system is working correctly.
              </p>
              
              <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <strong>Timestamp:</strong> ${new Date().toISOString()}<br>
                  <strong>Service:</strong> SendGrid Email Service<br>
                  <strong>From:</strong> PakistanYP Platform
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 12px; margin: 20px 0 0 0;">
                This is an automated test email. No action required.
              </p>
            </div>
          </div>
        `,
        text: `
          PakistanYP Email Test - System Working!
          
          This is a test email from the Pakistan Yellow Pages platform.
          If you received this email, our email sending system is working correctly.
          
          Timestamp: ${new Date().toISOString()}
          Service: SendGrid Email Service
          
          This is an automated test email. No action required.
        `
      });
      
      console.log('✅ Test email sent successfully to:', testEmail);
      return { success: true, message: 'Test email sent successfully!' };
      
    } catch (error: any) {
      console.error('❌ Failed to send test email:', error);
      return { 
        success: false, 
        message: `Failed to send test email: ${error.message || 'Unknown error'}` 
      };
    }
  }
}

export const emailService = new EmailService();