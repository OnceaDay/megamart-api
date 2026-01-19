const mongoose = require("mongoose");

module.exports = (id, label = "id") => {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error(`Invalid ${label}`);
    err.statusCode = 400;
    throw err;
  }
};
