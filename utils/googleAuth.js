const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { PrismaClient } = require('@prisma/client');
const { generateAccessToken, generateRefreshToken } = require('./auth');

const prisma = new PrismaClient();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('No email found in Google profile'), null);

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: profile.id }, { email }] }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value,
          googleId: profile.id,
          googleProfile: profile,
          emailVerified: true,
          profile: {
            create: {}
          }
        }
      });
    } else if (!user.googleId) {
      // Update existing user with Google ID
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.id,
          googleProfile: profile,
          emailVerified: true
        }
      });
    }

    // Generate tokens
    const tokens = {
      accessToken: generateAccessToken(user),
      refreshToken: generateRefreshToken(user)
    };

    // Store refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: `0:${tokens.refreshToken}` }
    });

    return done(null, { user, tokens });
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user);
});

const googleAuthMiddleware = passport.authenticate('google', { session: false });
const googleAuthCallbackMiddleware = passport.authenticate('google', {
  session: false,
  failureRedirect: '/login'
});

module.exports = {
  googleAuthMiddleware,
  googleAuthCallbackMiddleware
};