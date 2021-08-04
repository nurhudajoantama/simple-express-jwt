const express = require("express");
const cors = require("cors");

require("dotenv").config();

const app = express();
const port = process.env.PORT;
const host = process.env.HOST;

// database onfiguration
require("./config/database");

// express json
app.use(express.json());
// for nested json
app.use(express.urlencoded({ extended: true }));
// using cors
app.use(cors());

// static folder
app.use("/public", express.static("public"));

// routes
app.use(require("./routes"));

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
