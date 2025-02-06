const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Test API endpoint
app.get("/", (req, res) => {
  res.send({ message: "Hello from Node.js backend!" });
});


// Test API endpoint
app.get("/test", (req, res) => {
  res.json({
    Developer : "Satyam Babu",
    status: "success",
    message: "Hello from Node.js backend!",
    timestamp: new Date(),
    serverInfo: {
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
