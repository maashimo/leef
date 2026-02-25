const express = require("express");
const path = require("path");

const app = express();
app.use(express.static(__dirname)); // serve all html/css/js in this folder

app.listen(3000, () => {
  console.log("Frontend running on http://localhost:3000");
});
