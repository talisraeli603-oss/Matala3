const express = require("express");
const { reset } = require("../data/store");
const { publicStages, totalStages } = require("../game/stages");
const { sendApi } = require("../lib/http");

const router = express.Router();

router.get("/stages", (req, res) => {
  return sendApi(req, res, 200, {
    total: totalStages,
    stages: publicStages(),
  });
});

router.post("/reset", (req, res) => {
  reset();
  return sendApi(req, res, 200, {
    reset: true,
    message: "Catalog restored to the original seed data.",
  });
});

module.exports = router;
