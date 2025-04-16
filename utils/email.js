import nodemailer from 'nodemailer';
import { config } from '../config/config.js';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass,
  },
});

export const sendVerificationEmail = async (email, token) => {
  const verificationLink = `http://localhost:3000/auth/verify-email?token=${token}`;
  await transporter.sendMail({
    from: config.email.auth.user,
    to: email,
    subject: 'Verify Your Email',
    html: `<p>Please verify your email by clicking the link below:</p>
           <a href="${verificationLink}">Verify Email</a>`,
  });
};

export const sendResetPasswordEmail = async (email, token) => {
  const resetLink = `http://localhost:3000/auth/reset-password?token=${token}`;
  await transporter.sendMail({
    from: config.email.auth.user,
    to: email,
    subject: 'Reset Your Password',
    html: `<p>Reset your password by clicking the link below:</p>
           <a href="${resetLink}">Reset Password</a>`,
  });
};