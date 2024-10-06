const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const usersController = require("../controllers/user.controller");
const verifyToken = require("../utils/verifyUser");
const router = express.Router();

router.post("/", usersController.save);
router.post("/add-user", upload.single("csvFile"), usersController.addUserFromCsv);
router.post("/add-users", upload.array("csvFiles"), usersController.addUsersFromCsv);
router.get("/", usersController.index);
router.get("/:id", usersController.show);
router.get("/account/:accountNumber", usersController.showByAccount);
router.patch("/:id", usersController.update);
router.patch("/account/:accountNumber", usersController.updateByAccount);
router.delete("/:id", usersController.destroy);

module.exports = router;
