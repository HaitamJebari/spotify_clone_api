const express = require ("express")
const { createArtist, getArtist, getArtistById, updateArtist, deleteArtist, getTopArtist, getTopArtistToSongs } = require("../controllers/artistController")
//Unless you are logged in
const { protect, isAdmin} = require("../middlewares/auth")
const upload = require("../middlewares/upload")


const artistRouter = express.Router()

//Public
artistRouter.get("/", getArtist)
artistRouter.get("/top", getTopArtist)
artistRouter.get("/:id", getArtistById)
artistRouter.get("/:id/top-songs", getTopArtistToSongs)

//Admin
artistRouter.post("/create_artist", protect, isAdmin, upload.single("image"), createArtist)
artistRouter.put("/update_artist/:id", protect, isAdmin, upload.single("image"), updateArtist)
artistRouter.delete("/delete_artist/:id", protect, isAdmin, deleteArtist)


module.exports = artistRouter