import nodemailer from 'nodemailer';
import { storage } from './storage';

interface EmailProvider {
  name: string;
  test: () => Promise<boolean>;
  send: (to: string, subject: string, html: string, text?: string) => Promise<boolean>;
}

class MultipleEmailService {
  private providers: EmailProvider[] = [];
  private initialized = false;

  constructor() {
    // Will be initialized when first used
  }

  private async initializeProviders(): Promise<void> {
    if (this.initialized) return;
    
    console.log('Initializing email providers...');
    
    // 1. SendGrid SMTP Provider
    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (sendgridKey && sendgridKey !== 'your_sendgrid_api_key_here') {
      const sendgridTransporter = nodemailer.createTransporter({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: sendgridKey
        }
      });
      
      this.providers.push({
        name: 'SendGrid',
        test: async () => {
          try {
            await sendgridTransporter.verify();
            return true;
          } catch (error) {
            console.warn('SendGrid verification failed:', error);
            return false;
          }
        },
        send: async (to, subject, html, text) => {
          try {
            await sendgridTransporter.sendMail({
              from: '"Pakistan Yellow Pages" <noreply@pakistanyp.com>',
              to, subject, html, text
            });
            return true;
          } catch (error) {
            console.error('SendGrid send failed:', error);
            return false;
          }
        }
      });
    }

    // 2. Gmail SMTP Provider (with App Password)
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;
    if (gmailUser && gmailPass) {
      const gmailTransporter = nodemailer.createTransporter({
        service: 'gmail',
        port: 587,
        secure: false,
        auth: {
          user: gmailUser,
          pass: gmailPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      this.providers.push({
        name: 'Gmail',
        test: async () => {
          try {
            await gmailTransporter.verify();
            return true;
          } catch (error) {
            console.warn('Gmail verification failed:', error);
            return false;
          }
        },
        send: async (to, subject, html, text) => {
          try {
            await gmailTransporter.sendMail({
              from: `"Pakistan Yellow Pages" <${gmailUser}>`,
              to, subject, html, text
            });
            return true;
          } catch (error) {
            console.error('Gmail send failed:', error);
            return false;
          }
        }
      });
    }

    // 3. Outlook/Hotmail SMTP Provider
    const outlookUser = process.env.OUTLOOK_USER;
    const outlookPass = process.env.OUTLOOK_PASS;
    if (outlookUser && outlookPass) {
      const outlookTransporter = nodemailer.createTransporter({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: outlookUser,
          pass: outlookPass
        },
        tls: {
          ciphers: 'SSLv3'
        }
      });
      
      this.providers.push({
        name: 'Outlook',
        test: async () => {
          try {
            await outlookTransporter.verify();
            return true;
          } catch (error) {
            console.warn('Outlook verification failed:', error);
            return false;
          }
        },
        send: async (to, subject, html, text) => {
          try {
            await outlookTransporter.sendMail({
              from: `"Pakistan Yellow Pages" <${outlookUser}>`,
              to, subject, html, text
            });
            return true;
          } catch (error) {
            console.error('Outlook send failed:', error);
            return false;
          }
        }
      });
    }

    // 4. Generic SMTP Provider (from system settings)
    const emailHost = await storage.getSystemSetting('EMAIL_HOST');
    const emailPort = await storage.getSystemSetting('EMAIL_PORT');
    const emailUser = await storage.getSystemSetting('EMAIL_USER');
    const emailPass = await storage.getSystemSetting('EMAIL_PASS');
    
    if (emailHost?.value && emailUser?.value && emailPass?.value) {
      const customTransporter = nodemailer.createTransporter({
        host: emailHost.value,
        port: parseInt(emailPort?.value || '587'),
        secure: false,
        auth: {
          user: emailUser.value,
          pass: emailPass.value
        }
      });
      
      this.providers.push({
        name: `Custom SMTP (${emailHost.value})`,
        test: async () => {
          try {
            await customTransporter.verify();
            return true;
          } catch (error) {
            console.warn(`Custom SMTP verification failed:`, error);
            return false;
          }
        },
        send: async (to, subject, html, text) => {
          try {
            const result = await customTransporter.sendMail({
              from: `"Pakistan Yellow Pages" <${emailUser.value}>`,
              to, subject, html, text
            });
            console.log(`✓ Custom SMTP email sent successfully via ${emailHost.value}:`, result.messageId);
            return true;
          } catch (error) {
            console.error(`Custom SMTP send failed:`, error);
            return false;
          }
        }
      });
    }

    console.log(`Initialized ${this.providers.length} email providers:`, 
      this.providers.map(p => p.name));
    this.initialized = true;
  }

  private async getWorkingProvider(): Promise<EmailProvider | null> {
    await this.initializeProviders();
    
    for (const provider of this.providers) {
      console.log(`Testing provider: ${provider.name}`);
      try {
        const isWorking = await provider.test();
        if (isWorking) {
          console.log(`✓ Provider ${provider.name} is working`);
          return provider;
        } else {
          console.log(`✗ Provider ${provider.name} failed test`);
        }
      } catch (error) {
        console.log(`✗ Provider ${provider.name} threw error:`, error);
      }
    }
    
    console.error('No working email providers found');
    return null;
  }

  async sendVerificationEmail(email: string, firstName: string, token: string): Promise<boolean> {
    console.log(`Attempting to send verification email to ${email} for ${firstName}`);
    
    const provider = await this.getWorkingProvider();
    if (!provider) {
      console.log(`Email service not available. Verification link for ${firstName}: https://pakistanyp.com/verify-email?token=${token}`);
      return false;
    }

    try {
      const verificationUrl = `https://pakistanyp.com/verify-email?token=${token}`;
      
      const html = `
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
      `;
      
      const text = `Hi ${firstName}! Please verify your email by clicking this link: ${verificationUrl}`;
      
      console.log(`Sending email via ${provider.name} to ${email}`);
      const success = await provider.send(email, 'Verify Your Email - Pakistan Yellow Pages', html, text);
      
      if (success) {
        console.log(`✓ Verification email sent successfully to ${email} via ${provider.name}`);
      } else {
        console.log(`✗ Failed to send verification email to ${email} via ${provider.name}`);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      console.log(`Email verification link for ${firstName}: https://pakistanyp.com/verify-email?token=${token}`);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<boolean> {
    console.log(`Attempting to send password reset email to ${email} for ${firstName}`);
    
    const provider = await this.getWorkingProvider();
    if (!provider) {
      console.log(`Password reset link for ${firstName}: https://pakistanyp.com/reset-password?token=${token}`);
      return false;
    }

    try {
      const resetUrl = `https://pakistanyp.com/reset-password?token=${token}`;
      
      const html = `
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
      `;
      
      const text = `Hi ${firstName}! Reset your password by clicking this link: ${resetUrl}`;
      
      console.log(`Sending password reset email via ${provider.name} to ${email}`);
      const success = await provider.send(email, 'Reset Your Password - Pakistan Yellow Pages', html, text);
      
      if (success) {
        console.log(`✓ Password reset email sent successfully to ${email} via ${provider.name}`);
      } else {
        console.log(`✗ Failed to send password reset email to ${email} via ${provider.name}`);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }
}

export const multipleEmailService = new MultipleEmailService();