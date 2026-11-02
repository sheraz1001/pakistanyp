import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { storage } from './storage';
import { emailTemplateService } from './emailTemplateService';

export class AuthService {
  private readonly saltRounds = 12;

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async registerUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{ user: any; emailSent: boolean }> {
    try {
      console.log('Starting user registration for:', data.email);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      console.log('Hashing password...');
      const hashedPassword = await this.hashPassword(data.password);

      // Generate verification token
      console.log('Generating verification token...');
      const verificationToken = this.generateToken();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      console.log('Creating user in database...');
      const user = await storage.createEmailUser({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      });

      console.log('User created successfully:', { id: user.id, email: user.email });

      // Send verification email using template service
      console.log('📧 Sending verification email to:', data.email);
      console.log('🔑 Using token:', verificationToken);
      const emailSent = await emailTemplateService.sendVerificationEmail(
        data.email,
        data.firstName,
        verificationToken
      );

      console.log('✅ Verification email sent result:', emailSent);
      if (!emailSent) {
        console.error('❌ Failed to send verification email - this is a critical issue');
      }

      return { user, emailSent };
    } catch (error) {
      console.error('Registration error in authService:', error);
      throw error;
    }
  }

  async loginUser(email: string, password: string): Promise<any> {
    console.log('Login attempt for:', email);
    const user = await storage.getUserByEmail(email);
    if (!user) {
      console.log('User not found:', email);
      throw new Error('Invalid email or password');
    }

    console.log('User found:', { id: user.id, email: user.email, authProvider: user.authProvider, hasPassword: !!user.password });

    // Check if user uses email authentication
    if (user.authProvider !== 'email' || !user.password) {
      throw new Error('Please use Google login for this account');
    }

    // Verify password
    console.log('Verifying password...');
    const isValidPassword = await this.verifyPassword(password, user.password);
    console.log('Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Skip email verification for admin users
    if (user.role !== 'admin' && !user.isEmailVerified) {
      throw new Error('Please verify your email before logging in');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async verifyEmail(token: string): Promise<any> {
    const user = await storage.verifyEmail(token);
    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async requestPasswordReset(email: string): Promise<boolean> {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return true;
    }

    // Check if user uses email authentication
    if (user.authProvider !== 'email') {
      return true; // Don't reveal authentication method
    }

    // Generate reset token
    const resetToken = this.generateToken();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await storage.setPasswordResetToken(email, resetToken, resetExpiry);

    // Send reset email using template service
    const emailSent = await emailTemplateService.sendPasswordResetEmail(
      email,
      user.firstName || 'User',
      resetToken
    );

    return emailSent;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      // Find user by reset token
      const users = await storage.getAllUsers();
      const user = users.find(u => 
        u.passwordResetToken === token && 
        u.passwordResetExpiry && 
        u.passwordResetExpiry > new Date()
      );

      if (!user || !user.email) {
        console.log('Invalid or expired reset token');
        return false;
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);
      
      // Update password and clear reset token
      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null
      });
      
      console.log('Password reset successful for user:', user.email);
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  }
}

export const authService = new AuthService();