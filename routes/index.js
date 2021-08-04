const router = require("express").Router();

router.use("/api", require("./api"));

// return 404
router.use((req, res) => {
  return res.status(404).json({ success: false, message: "page not found" });
});

module.exports = router;
