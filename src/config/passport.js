const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/redirect",
    },
    async (accessToken, refreshToken, profile, done) => {
      // find or create user in DB
      const user = {
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
      };

      return done(null, user);
    }
  )
);

module.exports = passport;