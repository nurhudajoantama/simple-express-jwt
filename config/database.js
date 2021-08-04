const mongoose = require("mongoose");

require("dotenv").config();

const dbString = process.env.DB_STRING;

mongoose.connect(dbString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

mongoose.connection.on("connected", () => {
  console.log("Database connected");
});
