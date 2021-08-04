const jwt = require("jsonwebtoken");
const { header, body, validationResult } = require("express-validator");

const tokenSecretKey = process.env.TOKEN_SECRET_KEY;
const refreshTokenSecretKey = process.env.REFRESH_TOKEN_SECRET_KEY;

const createSuccessTokenRespond = (user) => {
  // creating access token and refresh token
  const token = jwt.sign(getPayload(user), tokenSecretKey, {
    expiresIn: "2 hrs",
  });
  const refreshToken = jwt.sign(getPayload(user), refreshTokenSecretKey, {
    expiresIn: "2 days",
  });
  return {
    success: true,
    access_token: token,
    refresh_token: refreshToken,
    user: {
      username: user.username,
      role: user.role,
      name: user.name,
    },
  };
};

// middleware
const verifyToken = (permission) => {
  return async (req, res, next) => {
    try {
      // JWT validation
      await header("authorization").isJWT().run(req);
      // check if have error in validation
      const valiadatorError = validationResult(req);
      if (!valiadatorError.isEmpty()) {
        return res.status(400).json({ success: false, message: "validation error", error: valiadatorError.array() });
      }
      jwt.verify(req.headers.authorization, tokenSecretKey, (error, decoded) => {
        if (error) {
          return res.status(401).json({ success: false, message: "token not valid", error });
        }
        if (permission) {
          const roleUser = decoded.role;
          if (!permission.includes(roleUser)) {
            return res.status(401).json({ success: false, message: "you can't access this page" });
          }
        }
        req.decodedToken = decoded;
        next();
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "server error" });
    }
  };
};

const verifyRefreshToken = async (req, res, next) => {
  try {
    // JWT validation
    await body("refresh").isJWT().run(req);
    // check if have error in validation
    const valiadatorError = validationResult(req);
    if (!valiadatorError.isEmpty()) {
      return res.status(400).json({ success: false, message: "validation error", error: valiadatorError.array() });
    }
    jwt.verify(req.body.refresh, refreshTokenSecretKey, (error, decoded) => {
      if (error) {
        return res.status(401).json({ success: false, message: "refresh token not valid", error });
      }
      req.decodedRefreshToken = decoded;
      next();
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

const getPayload = (user) => {
  // token payload for token and refreah token
  return {
    sub: user._id,
    username: user.username,
    role: user.role,
  };
};

module.exports = {
  verifyToken,
  verifyRefreshToken,
  createSuccessTokenRespond,
};
