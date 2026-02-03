const express = require('express')
const { protect, isAdmin } = require('../middlewares/auth')
const upload = require('../middlewares/upload')
const { 
    createPlaylist, 
    updatePlaylist, 
    deletePlaylist, 
    getPlaylists,
    getUserPlaylists,
    getPlaylistById,
    addSongToPlaylist,
    addCollaborator,
    removeCollaborator,
    removeFromPlaylist,
    getFeaturedPlaylists } = require('../controllers/playlistController')
const playlistRouter = express.Router()

//Public
playlistRouter.get("/", getPlaylists)
playlistRouter.get("/featured", getFeaturedPlaylists)
playlistRouter.get("/:id", getPlaylistById)

//Private
playlistRouter.post("/create_playlist", protect, isAdmin, upload.single("coverImage"), createPlaylist)
playlistRouter.put("/update_playlist/:id", protect, isAdmin, upload.single("coverImage"), updatePlaylist)
playlistRouter.delete("/delete_playlist", protect, isAdmin, deletePlaylist)
playlistRouter.delete("/:id/delete_song_from_playlist/:songId", protect, isAdmin, removeFromPlaylist)
playlistRouter.post("/:id/add-songs", protect, isAdmin, addSongToPlaylist)
playlistRouter.post("/:id/add-collaborator", protect, isAdmin, addCollaborator)
playlistRouter.delete("/:id/remove-collaborator", protect, isAdmin, removeCollaborator)
playlistRouter.get("/user/me", protect, isAdmin, getUserPlaylists)

module.exports = playlistRouter