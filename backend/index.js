const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Test API endpoint
app.get("/", (req, res) => {
  res.send({ message: "Hello from Node.js backend!" });
});

// Another test API endpoint
app.get("/test", (req, res) => {
  res.json({
    Developer: "Satyam Babu",
    status: "success",
    message: "Hello from Node.js backend!",
    timestamp: new Date(),
    serverInfo: {
      port: PORT,
      environment: process.env.NODE_ENV || "development",
    },
  });
});

// Endpoint to list all registered routes
app.get("/routes", (req, res) => {
  const routes = app._router.stack
    .filter((r) => r.route) // Only consider routes
    .map((r) => ({
      method: Object.keys(r.route.methods)[0].toUpperCase(),
      path: r.route.path,
    }));

  res.json({ availableRoutes: routes });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
