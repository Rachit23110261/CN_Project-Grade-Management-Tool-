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
      subject: "Password Reset - Grade Management System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password for the Grade Management System.</p>
          <p>Your temporary password is:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong style="font-size: 18px; color: #1f2937;">${tempPassword}</strong>
          </div>
          <p>Please use this temporary password to log in and change it immediately for security reasons.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you didn't request this password reset, please contact your administrator immediately.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            This is an automated message from Grade Management System. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
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
