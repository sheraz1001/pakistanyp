import { storage } from './storage';
import { simpleEmailService } from './simpleEmailService';
import { EmailTemplate } from '@shared/schema';

export class EmailTemplateService {
  private initialized = false;

  constructor() {
    this.initializeDefaultTemplates();
  }

  async initializeDefaultTemplates(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Check if account verification template exists
      const verificationTemplate = await storage.getEmailTemplate('account_verification');
      if (!verificationTemplate) {
        await this.createDefaultVerificationTemplate();
      }

      // Check if password reset template exists
      const resetTemplate = await storage.getEmailTemplate('password_reset');
      if (!resetTemplate) {
        await this.createDefaultPasswordResetTemplate();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize default email templates:', error);
    }
  }

  private async createDefaultVerificationTemplate(): Promise<void> {
    const template = {
      name: 'account_verification',
      subject: 'PakistanYP.com | Please Verify Your Email Address',
      htmlContent: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Email Verification - PakistanYP</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { max-width: 200px; height: auto; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 10px; margin: 20px 0; }
              .button { 
                display: inline-block; 
                background: #007bff; 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-weight: bold;
                margin: 20px 0;
              }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
              .link-text { word-break: break-all; color: #007bff; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://pakistanyp.com/assets/pakistanyp-logo.png" alt="PakistanYP Logo" class="logo">
              </div>
              
              <div class="content">
                <h2>Hello {{user_name}},</h2>
                
                <p>Thank you for registering at PakistanYP.com. To complete your registration and activate your account, please click the button below.</p>
                
                <div style="text-align: center;">
                  <a href="{{verification_link}}" class="button">Verify My Email</a>
                </div>
                
                <p><strong>This link will expire in 24 hours.</strong></p>
                
                <p>If you are having trouble with the button, you can also copy and paste the following link into your browser:</p>
                <p class="link-text">{{verification_link}}</p>
              </div>
              
              <div class="footer">
                <p>Sincerely,<br>The PakistanYP.com Team</p>
                <p>© 2025 pakistanyp.com. All rights reserved.</p>
                <p>You received this email because you recently created an account on our website. If you did not do this, please ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      placeholders: JSON.stringify([
        { name: 'user_name', description: 'User\'s first name' },
        { name: 'verification_link', description: 'Email verification URL' }
      ]),
      description: 'Template for account verification emails sent to new users',
      isActive: true
    };

    await storage.createEmailTemplate(template);
  }

  private async createDefaultPasswordResetTemplate(): Promise<void> {
    const template = {
      name: 'password_reset',
      subject: 'PakistanYP.com | Password Reset Request',
      htmlContent: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Password Reset - PakistanYP</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { max-width: 200px; height: auto; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 10px; margin: 20px 0; }
              .button { 
                display: inline-block; 
                background: #dc3545; 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-weight: bold;
                margin: 20px 0;
              }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
              .link-text { word-break: break-all; color: #dc3545; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://pakistanyp.com/assets/pakistanyp-logo.png" alt="PakistanYP Logo" class="logo">
              </div>
              
              <div class="content">
                <h2>Hello {{user_name}},</h2>
                
                <p>We received a request to reset your password for your PakistanYP.com account. Click the button below to reset your password.</p>
                
                <div style="text-align: center;">
                  <a href="{{reset_link}}" class="button">Reset My Password</a>
                </div>
                
                <p><strong>This link will expire in 1 hour.</strong></p>
                
                <p>If you are having trouble with the button, you can also copy and paste the following link into your browser:</p>
                <p class="link-text">{{reset_link}}</p>
                
                <p>If you did not request a password reset, please ignore this email or contact our support team.</p>
              </div>
              
              <div class="footer">
                <p>Sincerely,<br>The PakistanYP.com Team</p>
                <p>© 2025 pakistanyp.com. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      placeholders: JSON.stringify([
        { name: 'user_name', description: 'User\'s first name' },
        { name: 'reset_link', description: 'Password reset URL' }
      ]),
      description: 'Template for password reset emails',
      isActive: true
    };

    await storage.createEmailTemplate(template);
  }

  private async sendEmailWithTemplate(toEmail: string, subject: string, htmlContent: string): Promise<boolean> {
    try {
      console.log(`📧 Starting email send to ${toEmail} with subject: ${subject}`);
      
      // SMTP first (pakistanyp.com mailbox on Stackmail); SendGrid below is only a fallback
      if (await simpleEmailService.sendMail(toEmail, subject, htmlContent)) {
        console.log(`📧 Sent via SMTP to ${toEmail}`);
        return true;
      }
      // Use SendGrid API for reliable email delivery
      const { MailService } = await import('@sendgrid/mail');
      const mailService = new MailService();
      
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        console.error('❌ SendGrid API key not configured');
        return false;
      }

      console.log('🔑 SendGrid API key configured, setting up mail service...');
      mailService.setApiKey(apiKey);

      const emailData = {
        to: toEmail,
        from: 'accounts@pakistanyp.com', // Verified sender
        subject: subject,
        html: htmlContent
      };

      console.log('📤 Sending email with data:', {
        to: emailData.to,
        from: emailData.from,
        subject: emailData.subject,
        htmlLength: htmlContent.length
      });

      await mailService.send(emailData);

      console.log(`✅ Email sent successfully to ${toEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Template email send error:', error);
      console.error('❌ Error details:', error.response?.body || error.message);
      return false;
    }
  }

  async sendTemplatedEmail(templateName: string, toEmail: string, placeholders: Record<string, string>): Promise<boolean> {
    try {
      await this.initializeDefaultTemplates();
      
      const template = await storage.getEmailTemplate(templateName);
      if (!template || !template.isActive) {
        console.error(`Email template '${templateName}' not found or inactive`);
        return false;
      }

      // Replace placeholders in subject and content
      let subject = template.subject;
      let htmlContent = template.htmlContent;

      Object.entries(placeholders).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
      });

      // Send email using simple email service (custom implementation)
      return await this.sendEmailWithTemplate(toEmail, subject, htmlContent);
    } catch (error) {
      console.error('Failed to send templated email:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, firstName: string, token: string): Promise<boolean> {
    const verificationLink = `https://pakistanyp.com/api/auth/verify-email/${token}`;
    return await this.sendTemplatedEmail('account_verification', email, {
      user_name: firstName,
      verification_link: verificationLink
    });
  }

  async sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<boolean> {
    const resetLink = `https://pakistanyp.com/reset-password?token=${token}`;
    return await this.sendTemplatedEmail('password_reset', email, {
      user_name: firstName,
      reset_link: resetLink
    });
  }

  async sendTestEmail(templateName: string, testEmail: string = 'sheraz19@gmail.com'): Promise<boolean> {
    return await this.sendTemplatedEmail(templateName, testEmail, {
      user_name: 'Test User',
      verification_link: 'https://pakistanyp.com/verify-email?token=test-token',
      reset_link: 'https://pakistanyp.com/reset-password?token=test-token'
    });
  }
}

export const emailTemplateService = new EmailTemplateService();