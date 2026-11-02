import { country } from "@shared/country";
import nodemailer from 'nodemailer';
import { storage } from './storage';

class SimpleEmailService {
  private transporter: any;
  private initialized = false;
  private fromAddress = '"Pakistan Yellow Pages" <accounts@pakistanyp.com>';

  constructor() {
    // Will be initialized when first used
  }

  private async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // First priority: Custom PakistanYP SMTP server
      console.log(`Initializing SMTP ${process.env.SMTP_HOST || 'smtp.stackmail.com'}...`);
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.stackmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: false, // Use STARTTLS
        auth: {
          user: process.env.SMTP_USER || 'accounts@pakistanyp.com',
          pass: process.env.SMTP_PASS || 'Ku082549f'
        },
        tls: {
          rejectUnauthorized: false // Accept self-signed certificates if needed
        }
      });
      
      // Test the connection
      try {
        await this.transporter.verify();
        console.log('PakistanYP SMTP server verified successfully');
        this.initialized = true;
        return true;
      } catch (verifyError) {
        console.error('PakistanYP SMTP verification failed:', verifyError);
        // Continue to fallback options
      }

      // Try SendGrid directly (skip Gmail)
      console.log('Custom SMTP failed, trying SendGrid...');
      const sendgridKey = process.env.SENDGRID_API_KEY;
      if (sendgridKey && sendgridKey !== 'your_sendgrid_api_key_here') {
        console.log('Gmail not available, trying SendGrid...');
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: sendgridKey
          }
        });
        console.log('Using SendGrid for email service');
        // Set a verified SendGrid from address
        this.fromAddress = '"Pakistan Yellow Pages" <noreply@pakistanyp.com>';
        this.initialized = true;
        return true;
      }

      // Fallback to system settings
      const emailHost = await storage.getSystemSetting('EMAIL_HOST');
      const emailPort = await storage.getSystemSetting('EMAIL_PORT');
      const emailUser = await storage.getSystemSetting('EMAIL_USER');
      const emailPass = await storage.getSystemSetting('EMAIL_PASS');
      
      if (emailHost?.value && emailUser?.value && emailPass?.value) {
        this.transporter = nodemailer.createTransport({
          host: emailHost.value,
          port: parseInt(emailPort?.value || '587'),
          secure: false,
          auth: {
            user: emailUser.value,
            pass: emailPass.value
          }
        });
        console.log(`Using custom SMTP (${emailHost.value}) for email service`);
        this.initialized = true;
        return true;
      }

      console.error('No email service configured. Email functionality disabled.');
      console.error('Available environment variables:', {
        SENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
        GMAIL_USER: !!process.env.GMAIL_USER,
        GMAIL_PASS: !!process.env.GMAIL_PASS
      });
      return false;
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, firstName: string, token: string): Promise<boolean> {
    console.log(`Attempting to send verification email to ${email} for ${firstName}`);
    const canSend = await this.initialize();
    if (!canSend) {
      console.log(`Email service not available. Verification link for ${firstName}: https://${process.env.PUBLIC_HOST || country.domain}/#/verify-email?token=${token}`);
      return false;
    }

    try {
      const verificationUrl = `${process.env.SITE_ORIGIN || country.origin}/verify-email?token=${token}`;
      
      console.log(`Sending email from transporter to ${email}`);
      const result = await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
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
        text: `Hi ${firstName}! Please verify your email by clicking this link: ${verificationUrl}`
      });
      
      console.log('Email send result:', result);
      console.log(`Verification email sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      console.error('Email error details:', error);
      console.log(`Email verification link for ${firstName}: https://pakistanyp.com/verify-email?token=${token}`);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<boolean> {
    const canSend = await this.initialize();
    if (!canSend) {
      console.log(`Password reset link for ${firstName}: https://pakistanyp.com/reset-password?token=${token}`);
      return false;
    }

    try {
      const resetUrl = `https://pakistanyp.com/reset-password?token=${token}`;
      
      await this.transporter.sendMail({
        from: '"Pakistan Yellow Pages" <accounts@pakistanyp.com>',
        to: email,
        subject: 'Reset Your Password - Pakistan Yellow Pages',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Pakistan Yellow Pages</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
            </div>
            
            <div style="padding: 40px; background: white;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hi ${firstName}!</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                We received a request to reset your password for your Pakistan Yellow Pages account. 
                Click the button below to set a new password.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                If you didn't request this password reset, you can safely ignore this email.
                <br>
                This reset link will expire in 1 hour for security reasons.
              </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2025 Pakistan Yellow Pages. All rights reserved.
              </p>
            </div>
          </div>
        `,
        text: `Hi ${firstName}! Reset your password by clicking this link: ${resetUrl}`
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      console.log(`Password reset link for ${firstName}: https://pakistanyp.com/reset-password?token=${token}`);
      return false;
    }
  }

  async sendEmailToAdmin(subject: string, htmlContent: string): Promise<boolean> {
    console.log(`Attempting to send admin email: ${subject}`);
    const canSend = await this.initialize();
    if (!canSend) {
      console.log(`Email service not available. Admin notification: ${subject}`);
      console.log(`Content: ${htmlContent}`);
      return false;
    }

    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@pakistanyp.com';
      
      console.log(`Sending admin email to ${adminEmail}`);
      const result = await this.transporter.sendMail({
        from: this.fromAddress,
        to: adminEmail,
        subject: `[Pakistan Yellow Pages Admin] ${subject}`,
        html: htmlContent
      });
      
      console.log('Admin email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send admin email:', error);
      return false;
    }
  }

  async sendCategoryRequestConfirmation(
    userEmail: string, 
    userName: string, 
    categoryName: string
  ): Promise<boolean> {
    console.log(`Attempting to send category request confirmation to ${userEmail}`);
    const canSend = await this.initialize();
    if (!canSend) {
      console.log(`Email service not available. Confirmation for ${userName}: Category "${categoryName}" request received`);
      return false;
    }

    try {
      console.log(`Sending confirmation email to ${userEmail}`);
      const result = await this.transporter.sendMail({
        from: this.fromAddress,
        to: userEmail,
        subject: 'Category Request Received - Pakistan Yellow Pages',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Pakistan Yellow Pages</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Category Request Confirmation</p>
            </div>
            
            <div style="padding: 40px; background: white;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Thank you, ${userName}!</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                We have received your request to add "<strong>${categoryName}</strong>" to our business directory categories.
              </p>
              
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0;">
                <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">What happens next?</h3>
                <ul style="color: #374151; margin: 0; padding-left: 20px;">
                  <li>Our team will review your category request</li>
                  <li>We'll evaluate its relevance to Pakistan business market</li>
                  <li>If approved, the category will be added to our directory</li>
                  <li>You'll receive an email notification about the decision</li>
                </ul>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                Typical review time: 2-5 business days
                <br>
                Reference: Category Request #${Date.now()}
              </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2025 Pakistan Yellow Pages. All rights reserved.
              </p>
            </div>
          </div>
        `,
        text: `Thank you ${userName}! We received your request for "${categoryName}" category. Our team will review it within 2-5 business days.`
      });
      
      console.log('Category request confirmation email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send category request confirmation email:', error);
      return false;
    }
  }

  // Newsletter subscription functions
  async sendNewsletterConfirmationEmail(email: string, name: string, confirmationToken: string): Promise<boolean> {
    console.log(`Attempting to send newsletter confirmation to ${email}`);
    const canSend = await this.initialize();
    if (!canSend) {
      console.log(`Email service not available. Confirmation link for ${email}: https://pakistanyp.com/newsletter-confirm/${confirmationToken}`);
      return false;
    }

    try {
      const confirmationUrl = `https://pakistanyp.com/newsletter-confirm/${confirmationToken}`;
      const result = await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject: 'Confirm Your Newsletter Subscription - Pakistan Yellow Pages',
        headers: {
          'X-SMTPAPI': JSON.stringify({
            "filters": {
              "clicktrack": {
                "settings": {
                  "enable": 0
                }
              },
              "opentrack": {
                "settings": {
                  "enable": 0
                }
              }
            }
          })
        },
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Pakistan Yellow Pages</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Newsletter Subscription</p>
            </div>
            
            <div style="padding: 40px; background: white;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hi ${name || 'there'}!</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                Thank you for subscribing to the Pakistan Yellow Pages business newsletter! 
                Please confirm your subscription by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationUrl}" style="background: #D4AF37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Confirm Subscription
                </a>
              </div>
              
              <div style="background: #fff7ed; border-left: 4px solid #D4AF37; padding: 20px; margin: 30px 0;">
                <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">What to expect:</h3>
                <ul style="color: #374151; margin: 0; padding-left: 20px;">
                  <li>Weekly Pakistani business news and opportunities</li>
                  <li>Market insights and investment updates</li>
                  <li>New business listings and featured companies</li>
                  <li>Government announcements and policy changes</li>
                </ul>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                If you didn't sign up for this newsletter, you can safely ignore this email.
              </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2025 Pakistan Yellow Pages. All rights reserved.
              </p>
            </div>
          </div>
        `,
        text: `Hi ${name || 'there'}! Please confirm your Pakistan Yellow Pages newsletter subscription: ${confirmationUrl}`
      });
      
      console.log('Newsletter confirmation email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send newsletter confirmation email:', error);
      return false;
    }
  }

  async sendNewsletterWelcomeEmail(email: string, name: string, unsubscribeToken?: string): Promise<boolean> {
    console.log(`Attempting to send newsletter welcome email to ${email}`);
    const canSend = await this.initialize();
    if (!canSend) {
      console.log(`Email service not available. Welcome message for ${email}: Newsletter subscription confirmed!`);
      return false;
    }

    try {
      const result = await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject: 'Welcome to Pakistan Yellow Pages Newsletter!',
        headers: {
          'X-SMTPAPI': JSON.stringify({
            "filters": {
              "clicktrack": {
                "settings": {
                  "enable": 0
                }
              },
              "opentrack": {
                "settings": {
                  "enable": 0
                }
              }
            }
          })
        },
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Pakistan Yellow Pages!</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Newsletter Subscription Confirmed</p>
            </div>
            
            <div style="padding: 40px; background: white;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Welcome ${name || 'to our community'}!</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                Your subscription to the Pakistan Yellow Pages newsletter has been confirmed! 
                You're now part of our community of business professionals and entrepreneurs.
              </p>
              
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0;">
                <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">Stay Connected:</h3>
                <ul style="color: #374151; margin: 0; padding-left: 20px;">
                  <li>📊 Weekly business insights and market trends</li>
                  <li>🏢 New business listings and opportunities</li>
                  <li>📈 Investment updates and success stories</li>
                  <li>🏛️ Government announcements and policy changes</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://pakistanyp.com" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 10px;">
                  Explore Directory
                </a>
                <a href="https://pakistanyp.com/news" style="background: #6b7280; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Latest News
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                You can update your preferences or <a href="https://pakistanyp.com/newsletter-unsubscribe/${unsubscribeToken || 'token'}" style="color: #6b7280; text-decoration: underline;">unsubscribe</a> at any time.
              </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2025 Pakistan Yellow Pages. All rights reserved.
              </p>
            </div>
          </div>
        `,
        text: `Welcome ${name || 'to our community'}! Your Pakistan Yellow Pages newsletter subscription is confirmed. Visit https://pakistanyp.com for more.`
      });
      
      console.log('Newsletter welcome email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send newsletter welcome email:', error);
      return false;
    }
  }

  async sendAdminNotificationEmail(email: string, name: string, action: 'subscribe' | 'unsubscribe' | 'resubscribe'): Promise<boolean> {
    console.log(`Attempting to send admin notification for ${action} action by ${email}`);
    const canSend = await this.initialize();
    if (!canSend) {
      console.log(`Email service not available. Admin notification: ${email} ${action}d newsletter`);
      return false;
    }

    try {
      const actionText = {
        subscribe: 'subscribed to',
        resubscribe: 'resubscribed to',
        unsubscribe: 'unsubscribed from'
      };

      const actionColor = {
        subscribe: '#10b981',
        resubscribe: '#f59e0b', 
        unsubscribe: '#ef4444'
      };

      const result = await this.transporter.sendMail({
        from: this.fromAddress,
        to: 'admin@pakistanyp.com',
        subject: `Newsletter ${action.charAt(0).toUpperCase() + action.slice(1)} - ${email}`,
        headers: {
          'X-SMTPAPI': JSON.stringify({
            "filters": {
              "clicktrack": {
                "settings": {
                  "enable": 0
                }
              },
              "opentrack": {
                "settings": {
                  "enable": 0
                }
              }
            }
          })
        },
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #374151 0%, #1f2937 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Pakistan Yellow Pages Admin</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Newsletter Activity</p>
            </div>
            
            <div style="padding: 40px; background: white;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Newsletter ${action.charAt(0).toUpperCase() + action.slice(1)}</h2>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <strong>Email:</strong>
                  <span>${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <strong>Name:</strong>
                  <span>${name || 'Not provided'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <strong>Action:</strong>
                  <span style="color: ${actionColor[action]}; font-weight: bold;">${actionText[action]} newsletter</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <strong>Time:</strong>
                  <span>${new Date().toLocaleString('en-AE', { timeZone: 'Asia/Karachi' })} (Pakistani Time)</span>
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://pakistanyp.com/admin/newsletter" style="background: #374151; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Manage Newsletter
                </a>
              </div>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2025 Pakistan Yellow Pages Admin Panel. All rights reserved.
              </p>
            </div>
          </div>
        `,
        text: `Newsletter ${action}: ${email} (${name || 'No name'}) ${actionText[action]} the newsletter at ${new Date().toLocaleString('en-AE', { timeZone: 'Asia/Karachi' })}`
      });
      
      console.log('Admin notification email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send admin notification email:', error);
      return false;
    }
  }

  /** Generic transactional email used by verification, reviews and leads. */
  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    const canSend = await this.initialize();
    if (!canSend) { console.log(`[mail] not configured – would send "${subject}" to ${to}`); return false; }
    try {
      await this.transporter.sendMail({ from: this.fromAddress, to, subject, html });
      return true;
    } catch (error) {
      console.error('[mail] send failed:', error);
      return false;
    }
  }
}

export const simpleEmailService = new SimpleEmailService();