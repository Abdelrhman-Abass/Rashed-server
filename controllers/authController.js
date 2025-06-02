import prisma from '../prisma/client.js';
// import { hashPassword, comparePassword } from '../utils/hash.js';
// import { generateAccessToken, generateRefreshToken , verifyRefreshToken   , generateToken } from '../utils/jwt.js';
import { hashPassword , comparePassword , generateToken } from '../utils/auth.js';
import { sendVerificationEmail, sendResetPasswordEmail } from '../utils/email.js';
import crypto from 'crypto';
import passport from 'passport';
// src/controllers/auth.ts (only the register function is updated)


export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        verificationToken,
      },
    });

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        token,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or user inactive",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Please login with Google",
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 4 * 24 * 60 * 60 * 1000, // 4 day
      path: "/",
    });

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          email: user.email,
          name: user.name,
        },
      },
      message: "Login successful",
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token required',
      });
    }

    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    await sendResetPasswordEmail(email, resetToken);

    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required',
      });
    }

    const user = await prisma.user.findFirst({ where: { resetToken: token } });
    if (!user || !user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    if (user.resetTokenExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired',
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // Clear the token cookie
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuthCallback = async (req, res, next) => {
  passport.authenticate('google', { session: false }, { failureRedirect: '/auth/login' }, (err, userObj) => {
    if (err || !userObj) {
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed',
      });
    }

    // Log the user in by setting the session
    req.login(userObj, async (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }

      try {
        // Update last login
        await prisma.user.update({
          where: { id: userObj.user.id },
          data: { lastLoginAt: new Date() },
        });

        // Set JWT token in cookie
        res.cookie('token', userObj.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 4 * 24 * 60 * 60 * 1000, // 4 days
          path: '/',
        });

        console.log(userObj.user)
        return res.status(200).json({
          success: true,
          data: {
            token: userObj.token,
            user: {
              email: userObj.user.email,
              name: userObj.user.name,
              token: userObj.user.token,
            },
          },
          message: 'Google authentication successful',
        });
      } catch (error) {
        next(error);
      }
    });
  })(req, res, next);
};