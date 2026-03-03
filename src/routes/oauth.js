const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/redirect",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // 🔑 SAME JWT FORMAT your protect() expects
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT,
      { expiresIn: "1d" }
    );

    res.redirect(
      `http://localhost:5173/oauth-success?token=${token}`
    );
  }
);

module.exports = router;