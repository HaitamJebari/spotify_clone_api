const asyncHandler = require("express-async-handler")
const Playlist = require("../models/Playlist")
const { uploadToCloudinary } = require("../utils/cloudinaryUpload")
const { StatusCodes } = require("http-status-codes");
const Song = require("../models/Song");
const User = require("../models/User");


//@desc - Create a new playlist
//@route - POST /create_playlist
//@Access - Private

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description, isPublic } = req.body

  if (description < 3 && description > 100) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Description should be between 3 and 100 characters");
  }

  const playlist = await Playlist.findOne({ name, creator: req.user._id })
  if (playlist) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Playlist Already Exists");
  }



  //Upload coverImage
  let coverImageUrl = ""
  if (!req.file) {
    const imageResult = await uploadToCloudinary(req.file.path, "spotify/playlists")
    coverImageUrl = imageResult.secure_url
  }

  const playlists = await Playlist.create({
    name,
    description,
    creator: req.user._id,
    coverImage: coverImageUrl || undefined,
    isPublic: isPublic === "true"
  })

  res.status(StatusCodes.CREATED).json(playlists);

})

//@desc - get all playlists with filtering and pagination
//@route - GET /playlists?search=summar&page=1&limit=10
//@Access - Public

const getPlaylists = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query
  //Build filer Object
  const filter = { isPublic: true }; //Only public playlists
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
    ]
  }

  //Count total playlists with filter
  const count = await Playlist.countDocuments(filter);
  //pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  //get playlists
  const playlists = await Song.find(filter)
    .sort({ followers: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .populate("creator", "name profilePicture")
    .populate("collaborators", "name profilePicture")
  res.status(StatusCodes.OK).json({
    playlists,
    page: parseInt(page),
    pages: Math.cell(count / parseInt(limit)),
    totalPlaylists: count
  });
})

//@desc - get playlist by ID
//@route - GET /playlists/:id
//@Access - Private

const getPlaylistById = asyncHandler(async (req, res) => {
  const playlist = await Playlist.findById(req.params.id).populate("creator", "name profilePicture")
    .populate("collaborators", "name profilePicture")

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND)
    throw new Error("Playlist Not found")
  }
  //check if playlist is private and current user is not the creator or collaborator
  if (!playlist.isPublic && !(req.user && (playlist.creator.equals(req.user._id) || playlist.collaborators.some((collab) => collab.equals(req.user._id))))) {
    res.status(StatusCodes.FORBIDDEN)
    throw new Error("This Playlist is Private")
  }
  res.status(StatusCodes.OK).json(playlist)

})

//@desc - get user's playlist
//@route - GET /playlists/user/me
//@Access - Private

const getUserPlaylists = asyncHandler(async (req, res) => {
  const playlists = await Playlist.find({
    $or: [{ creator: req.user._id }, { collaborators: req.user._id }],
  })
    .sort({ createdAt: -1 })
    .populate("creator", "name profilePicture")

  res.status(StatusCodes.OK).json(playlists)
})


//@desc - Update playlist
//@route - PUT /update_playlist/:id
//@Access - Private

const updatePlaylist = asyncHandler(async (req, res) => {
  const {
    name, description, isPublic
  } = req.body;

  const playlist = await Playlist.findById(req.params.id);

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("playlist Not Found");
  }

  //Check if current user is creator or collaborator
  if (!playlist.creator.equals(req.user._id) && !playlist.collaborators.some((collab) => collab.equals(req.user._id))) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("Not authorized to update this playlist");
  }

  //Update playlist details
  playlist.name = name || playlist.name
  playlist.description = description || playlist.description

  //Only creator can change privacy settings
  if (playlist.creator.equals(req.user._id)) {
    playlist.isPublic = isPublic !== undefined ? isPublic === "true" : playlist.isPublic;
  }

  //Update cover image if provided
  if (req.file) {
    const imageResult = await uploadToCloudinary(req.file.path, "spotify/playlists");
    playlist.coverImage = imageResult.secure_url
  }

  const updatedPlaylist = await playlist.save();
  res.status(StatusCodes.OK).json(updatedPlaylist);
})
//@desc - Delete playlist
//@route - DELETE /delete_playlist/:id
//@Access - Private

const deletePlaylist = asyncHandler(async (req, res) => {
  const playlist = await Playlist.findById(req.params.id)
  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Playlist not found");
  }
  //Only creator can delete it's own playlist
  if (!playlist.creator.equals(req.user._id)) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("Not authorized to delete this playlist");
  }

  await playlist.deleteOne();
  res.status(StatusCodes.OK).json({ message: "Playlist Removed" });
})

//@desc - add song to playlist
//@route - POST /playlist/:id/add-song
//@Access - Private

const addSongToPlaylist = asyncHandler(async (req, res) => {
  const { songIds } = req.body;

  if (!songIds || !Array.isArray(songIds)) {
    res.status(StatusCodes.BAD_REQUEST)
    throw new Error("Song IDS are required")
  }

  const playlist = await Playlist.findById(req.params.id)
  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND)
    throw new Error("PLaylist Not Found")
  }

  //check if current user is creator or collaborator
  if (!playlist.creator.equals(req.user._id) && !playlist.collaborators.some((collab) => collab.equals(req.user._id))) {
    res.status(StatusCodes.FORBIDDEN)
    throw new Error("Not authorized to modify this playlist")
  }

  //add songs to playlist 
  for (const songId of songIds) {
    //check if song exist
    const song = await Song.findById(songId)
    if (!song) {
      continue //Skip if song doesnt exists
    }
    if (playlist.songs.includes(songId)) {
      continue; //skip if song already exists
    }

    //add song
    playlist.songs.push(songId)
  }
  await playlist.save()
  res.status(StatusCodes.OK).json(playlist)

})

//@desc - remove from playlist
//@route - POST /playlist/:id/remove-song/:songId
//@Access - Private

const removeFromPlaylist = asyncHandler(async (req, res) => {

  const playlist = await Playlist.findById(req.params.id)
  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND)
    throw new Error("PLaylist Not Found")
  }

  //check if current user is creator or collaborator
  if (!playlist.creator.equals(req.user._id) && !playlist.collaborators.some((collab) => collab.equals(req.user._id))) {
    res.status(StatusCodes.FORBIDDEN)
    throw new Error("Not authorized to modify this playlist")
  }


  const songId = req.params.songId;
  //check if song in playlist
  if (!playlist.songs.includes(songId)) {
    res.status(StatusCodes.BAD_REQUEST)
    throw new Error("Song is not in playlist")
  }
  //remove song from playlist
  playlist.songs = playlist.songs.filter((id) => id.toString() !== songId);
  await playlist.save()

  res.status(StatusCodes.OK).json({ message: "Song removed from playlist" })
})

//@desc - add collaborator to playlist
//@route - POST /playlist/:id/add-collaborator
//@Access - Private

const addCollaborator = asyncHandler(async (req, res) => {
  const userId = req.body.userId
  if (!userId) {
    res.status(StatusCodes.NOT_FOUND)
    throw new Error("UserId Not Found")
  }

  //check if user exists
  const user = await User.findById(userId)
  if (!user) {
    res.status(StatusCodes.NOT_FOUND)
    throw new Error("User Not Found")
  }

  //find playlist
  const playlist = await Playlist.findById(req.params.id)
  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND)
    throw new Error("playlist Not Found")
  }

  //Only creator can add collaborators
  if (!playlist.creator.equals(req.user._id)) {
    res.status(StatusCodes.FORBIDDEN)
    throw new Error("Only creator can add collaborators")
  }
  //check if user already collaborator
  if (playlist.collaborators.includes(userId)) {
    res.status(StatusCodes.BAD_REQUEST)
    throw new Error("user already collaborator")
  }

  //add user to collaborators
  playlist.collaborators.push(userId);
  res.status(StatusCodes.OK).json(playlist)

})

//@desc - remove collaborator from playlist
//@route - DELETE /playlist/:id/remove-collaborator
//@Access - Private

const removeCollaborator = asyncHandler(async (req, res) => {
  const userId = req.body.userId
  if (!userId) {
    res.status(StatusCodes.NOT_FOUND)
    throw new Error("UserId Not Found")
  }

  //find playlist
  const playlist = await Playlist.findById(req.params.id)
  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND)
    throw new Error("playlist Not Found")
  }

  //Only creator can remove collaborators
  if (!playlist.creator.equals(req.user._id)) {
    res.status(StatusCodes.FORBIDDEN)
    throw new Error("Only creator can remove collaborators")
  }


  //check if user already collaborator
  if (!playlist.collaborators.includes(userId)) {
    res.status(StatusCodes.BAD_REQUEST)
    throw new Error("user not collaborator")
  }

  //remove user from collaborators
  playlist.collaborators = playlist.collaborators.filter((id) => id.toString() !== userId)

  await playlist.save()
  res.status(StatusCodes.OK).json(playlist)
})

//@desc - get featured playlist
//@route - GET /playlist/featured?limit=5
//@Access - Private

const getFeaturedPlaylists = asyncHandler(async (req, res) => { //high follower account
  const { limit = 5 } = req.query
  const filter = { isPublic: true }
  const playlist = await Playlist.find(filter)
    .limit(parseInt(limit))
    .sort({ followers: -1 })
    .populate("creator", "name profilePicture")

  res.status(StatusCodes.OK).json(playlist)

})



module.exports = {
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
  getFeaturedPlaylists
}