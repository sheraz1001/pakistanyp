import { MailService } from '@sendgrid/mail';

interface EmailTestResult {
  sender: string;
  success: boolean;
  error?: string;
  message?: string;
}

class EmailTester {
  private mailService: MailService;

  constructor() {
    this.mailService = new MailService();
  }

  async runComprehensiveTest(recipientEmail: string): Promise<EmailTestResult[]> {
    const results: EmailTestResult[] = [];
    
    // Check API key configuration
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('❌ SENDGRID_API_KEY not configured');
      return [{ sender: 'N/A', success: false, error: 'API key not configured' }];
    }

    this.mailService.setApiKey(apiKey);
    console.log('✅ SendGrid API key configured');

    // Test different sender addresses systematically
    const testSenders = [
      'accounts@pakistanyp.com',
      'noreply@pakistanyp.com',
      'admin@pakistanyp.com',
      'support@pakistanyp.com',
      'hello@pakistanyp.com',
      'info@pakistanyp.com'
    ];

    console.log(`🧪 Testing ${testSenders.length} different sender addresses...`);

    for (const sender of testSenders) {
      const result = await this.testSender(sender, recipientEmail);
      results.push(result);
      
      // If we find a working sender, we can stop testing
      if (result.success) {
        console.log(`🎉 Found working sender: ${sender}`);
        break;
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  private async testSender(sender: string, recipient: string): Promise<EmailTestResult> {
    try {
      console.log(`📧 Testing sender: ${sender}`);
      
      const msg = {
        to: recipient,
        from: sender,
        subject: `SendGrid Test - ${sender}`,
        text: `Test email from ${sender} at ${new Date().toISOString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>SendGrid Test Email</h2>
            <p><strong>From:</strong> ${sender}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <p>This is a test email to verify sender configuration.</p>
            <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #0369a1;">
                ✅ If you received this email, the sender <strong>${sender}</strong> is properly verified in SendGrid!
              </p>
            </div>
          </div>
        `
      };

      await this.mailService.send(msg);
      console.log(`✅ SUCCESS: ${sender} sent email successfully`);
      
      return {
        sender,
        success: true,
        message: 'Email sent successfully'
      };
      
    } catch (error: any) {
      const errorMsg = error.response?.body?.errors?.[0]?.message || error.message;
      console.log(`❌ FAILED: ${sender} - ${errorMsg}`);
      
      return {
        sender,
        success: false,
        error: errorMsg
      };
    }
  }

  async testSpecificSender(sender: string, recipient: string): Promise<EmailTestResult> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return { sender, success: false, error: 'API key not configured' };
    }

    this.mailService.setApiKey(apiKey);
    return await this.testSender(sender, recipient);
  }
}

export const emailTester = new EmailTester();