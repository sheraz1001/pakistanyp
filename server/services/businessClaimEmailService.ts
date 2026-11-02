import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not configured - business claim email notifications will not be sent");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface SubmissionConfirmationParams {
  userEmail: string;
  userName: string;
  businessName: string;
  claimId: number;
}

interface AdminNotificationParams {
  adminEmail: string;
  businessName: string;
  claimerName: string;
  claimerEmail: string;
  relationshipToBusiness: string;
  claimId: number;
  businessId: number;
}

interface ApprovalNotificationParams {
  userEmail: string;
  userName: string;
  businessName: string;
  claimId: number;
  businessId: number;
}

interface RejectionNotificationParams {
  userEmail: string;
  userName: string;
  businessName: string;
  claimId: number;
  businessId: number;
  rejectionReason: string;
}

export class BusinessClaimEmailService {
  static async sendSubmissionConfirmation(params: SubmissionConfirmationParams): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log("Skipping email notification - SENDGRID_API_KEY not configured");
      return false;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Business Claim Submitted</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 30px 20px; border: 1px solid #ddd; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .status-badge { background: #ffc107; color: #333; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .info-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Business Claim Submitted</h1>
              <p>We've received your business ownership claim</p>
            </div>
            
            <div class="content">
              <p>Dear ${params.userName},</p>
              
              <p>Thank you for submitting your business ownership claim for <strong>${params.businessName}</strong>.</p>
              
              <div class="info-box">
                <h3>Claim Details</h3>
                <p><strong>Claim ID:</strong> #${params.claimId}</p>
                <p><strong>Business:</strong> ${params.businessName}</p>
                <p><strong>Status:</strong> <span class="status-badge">PENDING REVIEW</span></p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <h3>What happens next?</h3>
              <ol>
                <li>Our team will review your claim within 2-3 business days</li>
                <li>We may contact you if additional verification is needed</li>
                <li>You'll receive an email notification once your claim is processed</li>
                <li>If approved, you'll gain full management access to the business profile</li>
              </ol>
              
              <p>You can track the status of your claim by visiting your dashboard:</p>
              <a href="https://pakistanyp.com/my-business-claims" class="button">View My Claims</a>
              
              <p>If you have any questions about your claim, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br>The Pakistani Business Directory Team</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Pakistani Business Directory. All rights reserved.</p>
              <p>This email was sent to ${params.userEmail}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
        Business Claim Submitted - Pakistani Business Directory
        
        Dear ${params.userName},
        
        Thank you for submitting your business ownership claim for ${params.businessName}.
        
        Claim Details:
        - Claim ID: #${params.claimId}
        - Business: ${params.businessName}
        - Status: PENDING REVIEW
        - Submitted: ${new Date().toLocaleDateString()}
        
        What happens next?
        1. Our team will review your claim within 2-3 business days
        2. We may contact you if additional verification is needed
        3. You'll receive an email notification once your claim is processed
        4. If approved, you'll gain full management access to the business profile
        
        You can track the status of your claim at: https://pakistanyp.com/my-business-claims
        
        If you have any questions about your claim, please contact our support team.
        
        Best regards,
        The Pakistani Business Directory Team
      `;

      await mailService.send({
        to: params.userEmail,
        from: 'noreply@pakistanyp.com',
        subject: `Business Claim Submitted - ${params.businessName}`,
        text: textContent,
        html: htmlContent,
      });

      return true;
    } catch (error) {
      console.error('Failed to send submission confirmation email:', error);
      return false;
    }
  }

  static async sendAdminNotification(params: AdminNotificationParams): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log("Skipping admin notification - SENDGRID_API_KEY not configured");
      return false;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Business Claim Requires Review</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 30px 20px; border: 1px solid #ddd; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
            .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 5px; }
            .urgent-badge { background: #ff6b6b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .info-box { background: #f8f9fa; border-left: 4px solid #ff6b6b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Business Claim</h1>
              <p><span class="urgent-badge">REQUIRES REVIEW</span></p>
            </div>
            
            <div class="content">
              <p>A new business ownership claim has been submitted and requires admin review.</p>
              
              <div class="info-box">
                <h3>Claim Details</h3>
                <p><strong>Claim ID:</strong> #${params.claimId}</p>
                <p><strong>Business:</strong> ${params.businessName} (ID: ${params.businessId})</p>
                <p><strong>Claimant:</strong> ${params.claimerName}</p>
                <p><strong>Email:</strong> ${params.claimerEmail}</p>
                <p><strong>Relationship:</strong> ${params.relationshipToBusiness.replace('_', ' ')}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              </div>
              
              <h3>Action Required</h3>
              <p>Please review this claim and take appropriate action:</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="https://pakistanyp.com/admin/business-claims" class="button">Review Claim</a>
                <a href="https://pakistanyp.com/business/${params.businessId}" class="button" style="background: #667eea;">View Business</a>
              </div>
              
              <p><strong>Important:</strong> Business ownership claims should be reviewed within 2-3 business days to maintain good user experience.</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Pakistani Business Directory - Admin Notification System</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
        New Business Claim Requires Review - Pakistani Business Directory Admin
        
        A new business ownership claim has been submitted and requires admin review.
        
        Claim Details:
        - Claim ID: #${params.claimId}
        - Business: ${params.businessName} (ID: ${params.businessId})
        - Claimant: ${params.claimerName}
        - Email: ${params.claimerEmail}
        - Relationship: ${params.relationshipToBusiness.replace('_', ' ')}
        - Submitted: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        
        Please review this claim at: https://pakistanyp.com/admin/business-claims
        View business profile at: https://pakistanyp.com/business/${params.businessId}
        
        IMPORTANT: Business ownership claims should be reviewed within 2-3 business days.
      `;

      await mailService.send({
        to: params.adminEmail,
        from: 'admin@pakistanyp.com',
        subject: `🔔 New Business Claim: ${params.businessName} - Requires Review`,
        text: textContent,
        html: htmlContent,
      });

      return true;
    } catch (error) {
      console.error('Failed to send admin notification email:', error);
      return false;
    }
  }

  static async sendApprovalNotification(params: ApprovalNotificationParams): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log("Skipping approval notification - SENDGRID_API_KEY not configured");
      return false;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Business Claim Approved!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 30px 20px; border: 1px solid #ddd; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
            .button { display: inline-block; background: #2ecc71; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 5px; }
            .success-badge { background: #2ecc71; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .info-box { background: #f8f9fa; border-left: 4px solid #2ecc71; padding: 15px; margin: 20px 0; }
            .celebration { font-size: 24px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="celebration">🎉</div>
              <h1>Congratulations!</h1>
              <p>Your business claim has been approved</p>
            </div>
            
            <div class="content">
              <p>Dear ${params.userName},</p>
              
              <p>Great news! Your business ownership claim for <strong>${params.businessName}</strong> has been approved.</p>
              
              <div class="info-box">
                <h3>Claim Approved</h3>
                <p><strong>Claim ID:</strong> #${params.claimId}</p>
                <p><strong>Business:</strong> ${params.businessName}</p>
                <p><strong>Status:</strong> <span class="success-badge">APPROVED</span></p>
                <p><strong>Approved:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <h3>What you can do now:</h3>
              <ul>
                <li>Update and manage your business information</li>
                <li>Respond to customer reviews</li>
                <li>Add photos and enhance your business profile</li>
                <li>Access business analytics and insights</li>
                <li>Manage business hours and contact information</li>
              </ul>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="https://pakistanyp.com/business/${params.businessId}" class="button">Manage Business</a>
                <a href="https://pakistanyp.com/my-business-claims" class="button" style="background: #667eea;">View All Claims</a>
              </div>
              
              <p>Thank you for being part of Pakistan Business Directory community. We're excited to help you grow your business!</p>
              
              <p>Best regards,<br>The Pakistani Business Directory Team</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Pakistani Business Directory. All rights reserved.</p>
              <p>This email was sent to ${params.userEmail}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
        Business Claim Approved! - Pakistani Business Directory
        
        Dear ${params.userName},
        
        Congratulations! Your business ownership claim for ${params.businessName} has been approved.
        
        Claim Details:
        - Claim ID: #${params.claimId}
        - Business: ${params.businessName}
        - Status: APPROVED
        - Approved: ${new Date().toLocaleDateString()}
        
        What you can do now:
        - Update and manage your business information
        - Respond to customer reviews
        - Add photos and enhance your business profile
        - Access business analytics and insights
        - Manage business hours and contact information
        
        Manage your business: https://pakistanyp.com/business/${params.businessId}
        View all claims: https://pakistanyp.com/my-business-claims
        
        Thank you for being part of Pakistan Business Directory community!
        
        Best regards,
        The Pakistani Business Directory Team
      `;

      await mailService.send({
        to: params.userEmail,
        from: 'noreply@pakistanyp.com',
        subject: `🎉 Business Claim Approved - ${params.businessName}`,
        text: textContent,
        html: htmlContent,
      });

      return true;
    } catch (error) {
      console.error('Failed to send approval notification email:', error);
      return false;
    }
  }

  static async sendRejectionNotification(params: RejectionNotificationParams): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log("Skipping rejection notification - SENDGRID_API_KEY not configured");
      return false;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Business Claim Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 30px 20px; border: 1px solid #ddd; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 5px; }
            .rejected-badge { background: #e74c3c; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .info-box { background: #f8f9fa; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; }
            .reason-box { background: #ffeaa7; border: 1px solid #fdcb6e; padding: 15px; margin: 20px 0; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Business Claim Update</h1>
              <p>Regarding your claim for ${params.businessName}</p>
            </div>
            
            <div class="content">
              <p>Dear ${params.userName},</p>
              
              <p>Thank you for your interest in claiming <strong>${params.businessName}</strong>. After careful review, we were unable to approve your claim at this time.</p>
              
              <div class="info-box">
                <h3>Claim Status</h3>
                <p><strong>Claim ID:</strong> #${params.claimId}</p>
                <p><strong>Business:</strong> ${params.businessName}</p>
                <p><strong>Status:</strong> <span class="rejected-badge">NOT APPROVED</span></p>
                <p><strong>Reviewed:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div class="reason-box">
                <h3>Reason for Review Decision</h3>
                <p>${params.rejectionReason}</p>
              </div>
              
              <h3>What you can do next:</h3>
              <ul>
                <li>Review the reason provided above</li>
                <li>Gather additional verification documents if needed</li>
                <li>Submit a new claim with updated information</li>
                <li>Contact our support team if you have questions</li>
              </ul>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="https://pakistanyp.com/business/${params.businessId}/claim" class="button">Submit New Claim</a>
                <a href="https://pakistanyp.com/contact-us" class="button" style="background: #95a5a6;">Contact Support</a>
              </div>
              
              <p>We appreciate your understanding and encourage you to reapply if you can address the concerns mentioned above.</p>
              
              <p>Best regards,<br>The Pakistani Business Directory Team</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Pakistani Business Directory. All rights reserved.</p>
              <p>This email was sent to ${params.userEmail}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
        Business Claim Update - Pakistani Business Directory
        
        Dear ${params.userName},
        
        Thank you for your interest in claiming ${params.businessName}. After careful review, we were unable to approve your claim at this time.
        
        Claim Details:
        - Claim ID: #${params.claimId}
        - Business: ${params.businessName}
        - Status: NOT APPROVED
        - Reviewed: ${new Date().toLocaleDateString()}
        
        Reason for Review Decision:
        ${params.rejectionReason}
        
        What you can do next:
        - Review the reason provided above
        - Gather additional verification documents if needed
        - Submit a new claim with updated information
        - Contact our support team if you have questions
        
        Submit new claim: https://pakistanyp.com/business/${params.businessId}/claim
        Contact support: https://pakistanyp.com/contact-us
        
        We appreciate your understanding and encourage you to reapply if you can address the concerns mentioned.
        
        Best regards,
        The Pakistani Business Directory Team
      `;

      await mailService.send({
        to: params.userEmail,
        from: 'noreply@pakistanyp.com',
        subject: `Business Claim Update - ${params.businessName}`,
        text: textContent,
        html: htmlContent,
      });

      return true;
    } catch (error) {
      console.error('Failed to send rejection notification email:', error);
      return false;
    }
  }
}