const express = require("express");
const usersController = require("../controllers/user.controller");
const router = express.Router();

router.post("/", usersController.save);
router.get("/", usersController.index);
router.get("/:id", usersController.show);
router.patch("/:id", usersController.update);
router.delete("/:id", usersController.destroy);

module.exports = router;
