import nodemailer from "nodemailer";

console.log("=== Email Configuration Test ===\n");

// Check environment variables
console.log("EMAIL_USER:", process.env.EMAIL_USER || "NOT SET");
console.log("EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "SET (hidden)" : "NOT SET");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "SET (hidden)" : "NOT SET");

const emailUser = process.env.EMAIL_USER || "kaushal.bule@iitgn.ac.in";
const emailPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

if (!emailPass) {
  console.log("\n❌ ERROR: No email password configured!");
  console.log("Please set EMAIL_USER and EMAIL_PASS in docker-compose.yml");
  console.log("\nExample:");
  console.log("  EMAIL_USER: your-email@gmail.com");
  console.log("  EMAIL_PASS: your-16-char-app-password");
  console.log("\nTo generate Gmail App Password:");
  console.log("1. Go to Google Account Settings");
  console.log("2. Security → 2-Step Verification (must be enabled)");
  console.log("3. App passwords → Generate new app password");
  console.log("4. Copy the 16-character password (no spaces)");
  process.exit(1);
}

console.log("\n=== Testing Email Connection ===\n");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

try {
  await transporter.verify();
  console.log("✅ Email service is configured correctly!");
  console.log(`   Connected to Gmail as: ${emailUser}`);
  
  console.log("\n=== Sending Test Email ===\n");
  
  const testEmail = emailUser; // Send to self for testing
  
  const info = await transporter.sendMail({
    from: emailUser,
    to: testEmail,
    subject: "Grade Management System - Email Test",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">✅ Email Service Test Successful</h2>
        <p>This is a test email from the Grade Management System.</p>
        <p><strong>Email service is working correctly!</strong></p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Sent at: ${new Date().toLocaleString()}
        </p>
      </div>
    `,
  });
  
  console.log("✅ Test email sent successfully!");
  console.log(`   Message ID: ${info.messageId}`);
  console.log(`   Sent to: ${testEmail}`);
  console.log("\n✅ All email tests passed!");
  
} catch (error) {
  console.error("\n❌ Email service error:", error.message);
  
  if (error.code === 'EAUTH') {
    console.log("\n💡 Authentication failed. Common causes:");
    console.log("1. Incorrect email or password");
    console.log("2. Using regular password instead of App Password");
    console.log("3. 2-Step Verification not enabled on Google account");
    console.log("4. App Password not generated correctly");
  } else if (error.code === 'ECONNECTION') {
    console.log("\n💡 Connection failed. Common causes:");
    console.log("1. No internet connection");
    console.log("2. Firewall blocking SMTP");
    console.log("3. Gmail SMTP temporarily unavailable");
  }
  
  process.exit(1);
}
