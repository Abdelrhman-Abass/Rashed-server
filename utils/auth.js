import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Password utilities
export const hashPassword = async (password) => bcrypt.hash(password, 12);

export const verifyPassword = async (password, hashedPassword) => bcrypt.compare(password, hashedPassword);

// Token utilities
export const generateAccessToken = (user) => 
  jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

export const generateRefreshToken = (user) => 
  jwt.sign(
    { userId: user.id, tokenVersion: user.refreshToken ? user.refreshToken.split(':')[0] : '0' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

export const verifyAccessToken = (token) => jwt.verify(token, JWT_SECRET);

export const verifyRefreshToken = (token) => jwt.verify(token, JWT_REFRESH_SECRET);

// Authentication middleware
export const authenticateJWT = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Authorization header missing');

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { profile: true }
  });

  if (!user) throw new Error('User not found');
  if (!user.isActive) throw new Error('User account is inactive');

  return user;
};

// Token refresh system
export const refreshTokens = async (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

  if (!user || !user.refreshToken) throw new Error('Invalid refresh token');

  const [tokenVersion] = user.refreshToken.split(':');
  if (tokenVersion !== decoded.tokenVersion) throw new Error('Token version mismatch');

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Update refresh token version in DB
  const newTokenVersion = parseInt(tokenVersion) + 1;
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: `${newTokenVersion}:${newRefreshToken}` }
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};