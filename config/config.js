import dotenv from 'dotenv';

dotenv.config();

export const config = {
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenExpiresIn: '4d',
    refreshTokenExpiresIn: '7d',
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
  aiModel: {
    apiUrl: process.env.AI_MODEL_API_URL || 'https://ai-model-api.com/ask',
    apiKey: process.env.AI_MODEL_API_KEY || 'api-key',
  },
};