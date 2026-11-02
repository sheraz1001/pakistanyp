import { country } from "@shared/country";
import { MailService } from '@sendgrid/mail';

class SendGridAPIService {
  private mailService: MailService;
  private initialized = false;

  constructor() {
    this.mailService = new MailService();
  }

  private async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey || apiKey === 'your_sendgrid_api_key_here') {
        console.error('SendGrid API key not configured');
        return false;
      }

      this.mailService.setApiKey(apiKey);
      this.initialized = true;
      console.log('SendGrid API service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize SendGrid API service:', error);
      return false;
    }
  }

  async sendTestEmail(email: string, firstName: string, token: string): Promise<boolean> {
    console.log(`🔧 SendGrid API: Attempting to send test email to ${email}`);
    const canSend = await this.initialize();
    if (!canSend) {
      console.log('❌ SendGrid API service not available');
      return false;
    }

    try {
      const domain = process.env.PUBLIC_HOST || country.domain;
      const verificationUrl = `https://${domain}/#/verify-email?token=${token}`;
      
      // Try different sender addresses that might be verified
      const possibleSenders = [
        'accounts@pakistanyp.com',
        'noreply@pakistanyp.com', 
        'admin@pakistanyp.com',
        'support@pakistanyp.com'
      ];
      
      const msg = {
        to: email,
        from: possibleSenders[0], // Start with accounts@pakistanyp.com
        subject: 'Test Email - Pakistan Yellow Pages',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Pakistan Yellow Pages</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Test Email</p>
            </div>
            
            <div style="padding: 40px; background: white;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hi ${firstName}!</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                This is a test email from Pakistan Yellow Pages to verify that the email system is working correctly.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Test Link
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                This is a test email. If you received this unexpectedly, you can safely ignore it.
              </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 12px;">
                © 2025 Pakistan Yellow Pages. All rights reserved.
              </p>
            </div>
          </div>
        `,
      };

      console.log('📤 SendGrid API: Sending email...');
      console.log('📧 From:', msg.from);
      console.log('📧 To:', msg.to);
      console.log('📧 Subject:', msg.subject);
      
      await this.mailService.send(msg);
      console.log('✅ Test email sent successfully via SendGrid API');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send test email via SendGrid API:', error);
      if (error.response) {
        console.error('📛 SendGrid API error response:', error.response.body);
        
        // If sender identity issue, provide helpful guidance
        if (error.response.body?.errors?.[0]?.message?.includes('verified Sender Identity')) {
          console.error('🔧 SendGrid Setup Required:');
          console.error('   1. Login to SendGrid dashboard');
          console.error('   2. Go to Settings → Sender Authentication');
          console.error('   3. Verify the sender email:', msg.from);
          console.error('   4. Check your email for verification link');
          console.error('   5. Complete the verification process');
        }
      }
      return false;
    }
  }
}

export const sendGridAPIService = new SendGridAPIService();