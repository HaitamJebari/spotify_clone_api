const express = require("express");
const {
  createAlbum,
  getAlbums,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  addSongsToAlbum,
  removeSongFromAlbum,
  getNewReleases,
} = require("../controllers/albumController");
const { protect, isAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const albumRouter = express.Router();

//Public Routes
albumRouter.get("/", getAlbums);
albumRouter.get("/new-releases", getNewReleases);
albumRouter.get("/:id", getAlbumById);


//Private admin
albumRouter.post("/create_album", protect, isAdmin,upload.single("coverImage"), createAlbum);
albumRouter.put("/update_album/:id", protect, isAdmin,upload.single("coverImage"), updateAlbum);
albumRouter.delete("/delete_album/:id", protect, isAdmin, deleteAlbum);
albumRouter.post("/add_songs_to_album", protect, isAdmin, addSongsToAlbum);
albumRouter.delete("/:id/remove_songs_from_album/:songId", protect, isAdmin, removeSongFromAlbum);



module.exports = albumRouter;
