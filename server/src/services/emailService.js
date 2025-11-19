import nodemailer from "nodemailer";

// Get frontend URL - prioritize environment variable, fallback to network address
// Note: Update FRONTEND_URL in .env with your network IP (e.g., http://10.1.2.3:5173)
const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
};

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || "kaushal.bule@iitgn.ac.in",
      pass: process.env.EMAIL_PASSWORD, // App password for Gmail
    },
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (to, tempPassword) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || "kaushal.bule@iitgn.ac.in",
      to,
      subject: "Temporary Password - Grade Management System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">🔐 Temporary Password Generated</h2>
          <p>Hello,</p>
          <p>You have requested a temporary password for the Grade Management System.</p>
          <p><strong>Your temporary password is:</strong></p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong style="font-size: 18px; color: #1f2937;">${tempPassword}</strong>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>⚠️ Important Security Notes:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #92400e;">
              <li><strong>Valid for 1 hour:</strong> This temporary password expires in 60 minutes</li>
              <li><strong>Your original password is safe:</strong> Your main password has NOT been changed</li>
              <li><strong>Two ways to use it:</strong>
                <ul style="margin-top: 5px;">
                  <li>Use it to login (you'll be redirected to change password)</li>
                  <li>OR use it as "current password" when changing your password within 1 hour</li>
                </ul>
              </li>
              <li><strong>Change password immediately:</strong> Set a new permanent password after logging in</li>
              <li><strong>Can be used multiple times:</strong> Valid for 1 hour or until you change your password</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p>Login with your temporary password:</p>
            <a href="${getFrontendUrl()}/login" 
               style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
              Login Now
            </a>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 10px;">
              Or copy this link: ${getFrontendUrl()}/login
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you didn't request this temporary password, please ignore this email or contact your administrator.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            This is an automated message from Grade Management System. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Temporary password email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

// Send grade challenge notification to professor
export const sendChallengeNotification = async (professorEmail, studentName, courseName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || "kaushal.bule@iitgn.ac.in",
      to: professorEmail,
      subject: `New Grade Challenge - ${courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">New Grade Challenge Submitted</h2>
          <p>Hello,</p>
          <p><strong>${studentName}</strong> has submitted a grade challenge for <strong>${courseName}</strong>.</p>
          <p>Please log in to the Grade Management System to review and respond to this challenge.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${getFrontendUrl()}/login" 
               style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Review Challenge
            </a>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 10px;">
              Or visit: ${getFrontendUrl()}/login
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            This is an automated notification from Grade Management System.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending challenge notification:", error);
    // Don't throw error - challenge should still be created even if email fails
  }
};

// Send challenge response notification to student
export const sendChallengeResponseNotification = async (studentEmail, courseName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || "kaushal.bule@iitgn.ac.in",
      to: studentEmail,
      subject: `Grade Challenge Response - ${courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Your Grade Challenge Has Been Reviewed</h2>
          <p>Hello,</p>
          <p>Your professor has responded to your grade challenge for <strong>${courseName}</strong>.</p>
          <p>Please log in to the Grade Management System to view the response.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${getFrontendUrl()}/login" 
               style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Response
            </a>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 10px;">
              Or visit: ${getFrontendUrl()}/login
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            This is an automated notification from Grade Management System.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending response notification:", error);
  }
};

// Send welcome email when admin registers a new user
export const sendWelcomeEmail = async (to, username, password, role) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || "kaushal.bule@iitgn.ac.in",
      to,
      subject: "Welcome to Grade Management System - Account Created",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">🎉 Welcome to Grade Management System</h2>
          <p>Hello,</p>
          <p>Your account has been successfully created by the system administrator.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
            <p style="margin: 5px 0;"><strong>Username:</strong> ${username}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 3px; font-size: 16px; font-family: monospace;">${password}</code></p>
            <p style="margin: 5px 0;"><strong>Role:</strong> ${role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'}</p>
          </div>
          
          <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>🔒 IMPORTANT SECURITY NOTICE:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #991b1b;">
              <li><strong>Change your password IMMEDIATELY</strong> after your first login</li>
              <li>Do not share your credentials with anyone</li>
              <li>Keep this email secure and delete it after changing your password</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p>Login to the system and change your password:</p>
            <a href="${getFrontendUrl()}/login" 
               style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
              Login Now
            </a>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 10px;">
              Or copy this link: ${getFrontendUrl()}/login
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you have any questions or did not expect this account, please contact your administrator immediately.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            This is an automated message from Grade Management System. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }
};

// Send registration request confirmation email to user
export const sendRegistrationRequestEmail = async (to, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || "kaushal.bule@iitgn.ac.in",
      to,
      subject: "Registration Request Received - Grade Management System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">📝 Registration Request Received</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with the Grade Management System!</p>
          
          <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;"><strong>✓ Your registration request has been submitted successfully</strong></p>
            <p style="margin: 10px 0 0 0; color: #1e40af;">Our admin team will review your request and get back to you shortly.</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>What happens next?</strong></p>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li>An administrator will review your registration request</li>
              <li>You will receive an email notification once your request is approved or rejected</li>
              <li>If approved, you will receive your login credentials</li>
              <li>If rejected, you will receive the reason for rejection</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This process typically takes 24-48 hours. Please be patient while we review your request.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            This is an automated message from Grade Management System. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Registration request email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending registration request email:", error);
    throw new Error("Failed to send registration request email");
  }
};

// Send registration approved email to user
export const sendRegistrationApprovedEmail = async (to, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || "kaushal.bule@iitgn.ac.in",
      to,
      subject: "Registration Approved - Grade Management System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">✅ Registration Approved!</h2>
          <p>Hello ${name},</p>
          <p>Great news! Your registration request has been approved by our administrator.</p>
          
          <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;"><strong>Your account is now active!</strong></p>
            <p style="margin: 10px 0 0 0; color: #065f46;">You can now log in to the Grade Management System using your registered email address.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p><strong>Login with your email and password:</strong></p>
            <a href="${getFrontendUrl()}/login" 
               style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
              Login Now
            </a>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 10px;">
              Or copy this link: ${getFrontendUrl()}/login
            </p>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>🔒 Security Reminder:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #92400e;">
              <li>Use the password you created during registration</li>
              <li>Keep your credentials secure and don't share them with anyone</li>
              <li>You can change your password anytime from your account settings</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you have any questions or need assistance, please contact your administrator.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            This is an automated message from Grade Management System. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Registration approved email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending registration approved email:", error);
    throw new Error("Failed to send registration approved email");
  }
};

// Send registration rejected email to user
export const sendRegistrationRejectedEmail = async (to, name, reason) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || "kaushal.bule@iitgn.ac.in",
      to,
      subject: "Registration Request Update - Grade Management System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Registration Request Update</h2>
          <p>Hello ${name},</p>
          <p>Thank you for your interest in the Grade Management System.</p>
          
          <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Unfortunately, your registration request has not been approved.</strong></p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Reason for rejection:</strong></p>
            <p style="margin: 5px 0; color: #374151; font-style: italic;">${reason}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you believe this is an error or have questions about this decision, please contact your administrator for clarification.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            You may submit a new registration request if the issue has been resolved.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            This is an automated message from Grade Management System. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Registration rejected email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending registration rejected email:", error);
    throw new Error("Failed to send registration rejected email");
  }
};
