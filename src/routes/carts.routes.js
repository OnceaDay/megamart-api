const router = require("express").Router();

router.get("/", (req, res) => {
  res.json({ message: "carts route works" });
});

module.exports = router;
