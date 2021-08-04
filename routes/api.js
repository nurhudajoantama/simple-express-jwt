const router = require("express").Router();
const { verifyToken, verifyRefreshToken } = require("../utils/token");
const user_controller = require("../controller/userController");

router.post("/login", user_controller.user_login);
router.post("/register", user_controller.user_register);
router.post("/refresh-token", verifyRefreshToken, user_controller.refresh_token);

router.get("/user", verifyToken(), user_controller.user_profile_detail);
router.put("/user", verifyToken(), user_controller.user_profile_update);
router.delete("/user", verifyToken(), user_controller.user_delete_account);

router.get("/admin/user", verifyToken(["admin"]), user_controller.admin_user_list);
router.get("/admin/user/:username", verifyToken(["admin"]), user_controller.admin_user_profile_detail);

module.exports = router;
