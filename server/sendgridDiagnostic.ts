import { MailService } from '@sendgrid/mail';

class SendGridDiagnostic {
  private mailService: MailService;

  constructor() {
    this.mailService = new MailService();
  }

  async runDiagnostic(): Promise<void> {
    try {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        console.error('❌ SENDGRID_API_KEY not found');
        return;
      }

      this.mailService.setApiKey(apiKey);
      console.log('✅ SendGrid API key configured');

      // Test different sender addresses that are commonly pre-verified
      const testSenders = [
        'accounts@pakistanyp.com',
        'noreply@pakistanyp.com',
        'admin@pakistanyp.com',
        'test@pakistanyp.com'
      ];

      console.log('🔍 Testing different sender addresses...');

      for (const sender of testSenders) {
        try {
          console.log(`\n📧 Testing sender: ${sender}`);
          
          const msg = {
            to: 'sheraz19@gmail.com',
            from: sender,
            subject: 'SendGrid Test - Sender Verification',
            text: `This is a test email to verify sender: ${sender}`,
            html: `<p>This is a test email to verify sender: <strong>${sender}</strong></p>`
          };

          await this.mailService.send(msg);
          console.log(`✅ SUCCESS: ${sender} is verified and working!`);
          break; // Stop on first success
        } catch (error: any) {
          console.log(`❌ FAILED: ${sender} - ${error.response?.body?.errors?.[0]?.message || error.message}`);
        }
      }

    } catch (error) {
      console.error('🚨 Diagnostic failed:', error);
    }
  }
}

export const sendGridDiagnostic = new SendGridDiagnostic();