const router = require("express").Router();

router.get("/", (req, res) => {
  res.json({ message: "products route works" });
});

module.exports = router;
