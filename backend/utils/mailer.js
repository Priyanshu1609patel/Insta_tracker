const nodemailer = require('nodemailer');

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendRegistrationAlert({ name, email, registeredAt }) {
  const transporter = getTransporter();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!transporter || !adminEmail) return;

  try {
    await transporter.sendMail({
      from: `"Amplify" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `New Registration Pending Approval — ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #E1306C;">New Agency Registration</h2>
          <p>A new user has registered and is awaiting your approval:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; font-weight: bold; color: #555;">Name</td><td style="padding: 8px;">${name}</td></tr>
            <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold; color: #555;">Email</td><td style="padding: 8px;">${email}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; color: #555;">Registered</td><td style="padding: 8px;">${new Date(registeredAt).toLocaleString('en-IN')}</td></tr>
          </table>
          <p>Log in to the admin panel to approve or reject this account.</p>
        </div>
      `,
    });
    console.log(`📧 Approval email sent to ${adminEmail} for ${email}`);
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

async function sendApprovalEmail({ name, email }) {
  const transporter = getTransporter();
  if (!transporter) return;

  try {
    await transporter.sendMail({
      from: `"Amplify" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Amplify account has been approved!',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Account Approved!</h2>
          <p>Hi ${name},</p>
          <p>Great news! Your Amplify agency account has been approved. You can now log in and start tracking your reels.</p>
          <p style="margin-top: 24px; color: #888;">— Amplify Team</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Approval email send failed:', err.message);
  }
}

async function sendRejectionEmail({ name, email }) {
  const transporter = getTransporter();
  if (!transporter) return;

  try {
    await transporter.sendMail({
      from: `"Amplify" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Update on your Amplify registration',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2>Registration Update</h2>
          <p>Hi ${name},</p>
          <p>Unfortunately, your Amplify agency account registration was not approved at this time.</p>
          <p>If you believe this was an error, please contact the administrator.</p>
          <p style="margin-top: 24px; color: #888;">— Amplify Team</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Rejection email send failed:', err.message);
  }
}

module.exports = { sendRegistrationAlert, sendApprovalEmail, sendRejectionEmail };
