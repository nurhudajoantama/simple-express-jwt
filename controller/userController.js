const User = require("../models/user");
const bcrypt = require("bcrypt");
const { query, body, validationResult } = require("express-validator");
const { createSuccessTokenRespond } = require("../utils/token");

exports.user_login = async (req, res) => {
  try {
    // input validation
    await body("username").notEmpty().isAlphanumeric().toLowerCase().run(req);
    await body("password").notEmpty().run(req);
    // check if have error in validation
    const valiadatorError = validationResult(req);
    if (!valiadatorError.isEmpty()) {
      return res.status(400).json({ success: false, message: "validation error", error: valiadatorError.array() });
    }
    // search user in database
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      return res.status(401).json({ success: false, message: "could not find user" });
    }
    // compare password
    const passwordVerified = await bcrypt.compare(req.body.password, user.password);
    if (!passwordVerified) {
      return res.status(401).json({ success: false, message: "you entered the wrong password" });
    }
    // sending respond token to user
    return res.status(200).json(createSuccessTokenRespond(user));
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

exports.user_register = async (req, res) => {
  try {
    // user validation
    await body("username")
      .isLength({
        min: 5,
        max: 20,
      })
      .isAlphanumeric()
      .toLowerCase()
      .custom(async (value) => {
        const notUniqueUsername = await User.findOne({ username: value });
        if (notUniqueUsername) throw new Error("username already registered");
        return true;
      })
      .run(req);
    await body("name").notEmpty().escape().run(req);
    await body("password")
      .isStrongPassword({
        minSymbols: 0,
      })
      .run(req);
    await body("role").isIn(["student", "teacher", "admin"]).run(req);
    // check if have error in validation
    const valiadatorError = validationResult(req);
    if (!valiadatorError.isEmpty()) {
      return res.status(400).json({ success: false, message: "validation error", error: valiadatorError.array() });
    }
    // all good
    // hashing pssword
    const password = await bcrypt.hash(req.body.password, 10);
    // insert user into database
    const user = await User.create({
      username: req.body.username,
      password: password,
      role: req.body.role,
      name: req.body.name,
    });
    // sending respond token to user
    return res.status(201).json(createSuccessTokenRespond(user));
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

exports.refresh_token = async (req, res) => {
  try {
    //   take user data from token
    const dataToken = req.decodedRefreshToken;
    // make sure the user is in the database
    const user = await User.findOne({ _id: dataToken.sub });
    if (!user) {
      return res.status(401).json({ success: false, message: "could not find user" });
    }
    // sending respond token to user
    return res.status(200).json(createSuccessTokenRespond(user));
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

exports.user_profile_detail = async (req, res) => {
  try {
    const decodedToken = req.decodedToken;
    const user = await User.findOne({
      _id: decodedToken.sub,
    }).select("-password -createdAt -updatedAt");
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

exports.user_profile_update = async (req, res) => {
  try {
    // validator
    await body("username")
      .isLength({
        min: 5,
        max: 20,
      })
      .isAlphanumeric()
      .toLowerCase()
      .custom(async (value, { req }) => {
        if (value === req.decodedToken.username) return true;
        const notUniqueUsername = await User.findOne({ username: value });
        if (notUniqueUsername) throw new Error("username already registered");
        return true;
      })
      .run(req);
    await body("name").notEmpty().escape().run(req);
    // validation error
    const valiadatorError = validationResult(req);
    if (!valiadatorError.isEmpty()) {
      return res.status(400).json({ success: false, message: "validation error", error: valiadatorError.array() });
    }
    const decodedToken = req.decodedToken;
    const user = await User.findOneAndUpdate(
      {
        _id: decodedToken.sub,
      },
      {
        username: req.body.username,
        name: req.body.name,
      },
      {
        new: true,
      }
    );
    res.status(201).json(createSuccessTokenRespond(user));
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

exports.user_delete_account = async (req, res) => {
  try {
    // validation
    await body("password").notEmpty().run(req);
    // validation error
    const valiadatorError = validationResult(req);
    if (!valiadatorError.isEmpty()) {
      return res.status(400).json({ success: false, message: "validation error", error: valiadatorError.array() });
    }
    const decodedToken = req.decodedToken;
    const user = await User.findOne({
      _id: decodedToken.sub,
      username: decodedToken.username,
    });
    const passwordVerified = await bcrypt.compare(req.body.password, user.password);
    if (!passwordVerified) {
      return res.status(401).json({ success: false, message: "you entered the wrong password" });
    }
    // deleting user
    const deleteUser = await User.deleteOne(user);
    res.status(200).json({ success: true, result: deleteUser.ok });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

// Admin access

exports.admin_user_list = async (req, res) => {
  try {
    const perPage = 10;
    const page = Math.max(0, req.query.page - 1);
    const userResult = await User.find()
      .select("username name role")
      .limit(perPage)
      .skip(perPage * page)
      .sort({ name: "asc" });
    res.status(200).json({ success: true, data: userResult });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

exports.admin_user_profile_detail = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "user not found" });
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};
