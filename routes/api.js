const express = require("express");
const router = express.Router();

router.post("/post", (req, res) => {
  // For create threads
});

router.get("/recommend", (req, res) => {
  // For thread recommendations personalised per user
});

module.exports = router;
