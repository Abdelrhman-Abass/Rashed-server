import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../prisma/client.js';
import { generateToken } from '../utils/auth.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/chat',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (!user) {
          // Check if email already exists
          user = await prisma.user.findUnique({
            where: { email: profile.emails[0].value },
          });

          if (user) {
            // Link Google account to existing user
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id },
            });
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName,
                emailVerified: true, // Google emails are verified
                googleProfile: profile._json, // Optional: store profile data
              },
            });
          }
        }

        // Generate JWT token
        const token = generateToken(user);
        return done(null, { user, token });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Serialize user to session
passport.serializeUser((userObj, done) => {
  done(null, userObj.user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;