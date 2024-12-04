const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const resultController = require("../controllers/result.controller");
const verifyToken = require("../utils/verifyUser");
const router = express.Router();

router.post("/", verifyToken, resultController.save);
router.get("/", verifyToken, resultController.index);
router.get("/:id", verifyToken, resultController.show);
router.patch("/:id", verifyToken, resultController.update);
router.delete("/:id", verifyToken, resultController.destroy);
router.post("/add-results", upload.array("csvFile"), resultController.importResultsFromCSVs);

module.exports = router;