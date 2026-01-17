const router = require("express").Router();

router.get("/", (req, res) => {
  res.json({ message: "customers route works" });
});

router.get("/boom", (req, res, next) => {
  const err = new Error("Something exploded");
  err.statusCode = 400;
  next(err);
});


module.exports = router;
