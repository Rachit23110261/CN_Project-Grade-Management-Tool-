import nodemailer from "nodemailer";

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
