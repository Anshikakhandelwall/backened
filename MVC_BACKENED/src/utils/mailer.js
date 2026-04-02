import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from:    `"Timetable System" <${process.env.EMAIL_USER}>`,
    to:      toEmail,
    subject: 'Your OTP Code',
    html: `
      <h2>OTP Verification</h2>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>Valid for 10 minutes. Do not share this with anyone.</p>
    `,
  });
};