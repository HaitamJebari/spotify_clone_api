const express = require("express");
const {
  createSong,
  getSongs,
  getSongsById,
  updateSong,
  deleteSong,
  getNewReleases,
} = require("../controllers/songController");
const { protect, isAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const songRouter = express.Router();

//Configure multer to handle multiple file types
const songUpload = upload.fields([   //upload single audio with single cover image
  { name: "audio", maxCount: 1 },
  { name: "cover", maxCount: 1 },
]);
//Public
songRouter.get("/", getSongs);
songRouter.get("/top", getSongs);
songRouter.get("/new-releases", getNewReleases);
songRouter.get("/:id", getSongsById);

//Private
songRouter.post(
  "/create_song",
  protect,
  isAdmin,
  songUpload,
  createSong,
);
songRouter.put(
  "/update_song/:id",
  protect,
  isAdmin,
  songUpload,
  updateSong,
);

songRouter.delete("/delete_song/:id", protect, isAdmin, deleteSong);

module.exports = songRouter;
