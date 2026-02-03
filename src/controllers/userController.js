const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const Song = require("../models/Song");
const Artist = require("../models/Artist");
const Playlist = require("../models/Playlist");
const generateToken = require("../utils/generateToken");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");

//@desc - Register a new user
//@route - POST /users/register
//@Access - Public

const registerUser = asyncHandler(async (req, res) => {
  //ayncHandler avoid try catch
  //Get The Payload (what is the user sending for user registration)

  const { name, email, password } = req.body;
  //Check if user already exists

  const existsUser = await User.findOne({ email });

  if (existsUser) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("User already exists");
  }
  //Create new user
  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    // if user found
    res.status(StatusCodes.CREATED).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      profilePicture: user.profilePicture,
    });
  } else {
    res.status(StatusCodes.BAD_REQUEST);
  }
});

//@desc - Login user
//@route - POST /api/users/login
//@Access - Public



const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.status(StatusCodes.OK).json({
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      profilePicture: user.profilePicture,
      token: generateToken(user._id),
    });
  }
});




const getUserProfile = asyncHandler(async (req, res) => {
  //find the user
  const user = await User.findById(req.user._id)
    .select("-password") //not including the password in response
    .populate("likedSongs", "title artist duration")
    .populate("likedAlbums", "title artist coverImage")
    .populate("followedArtists", "name image")
    .populate("followedPlaylists", "name creator coverImage");
  if (user) {
    res.status(StatusCodes.OK).json(user);
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User Not Found");
  }
});




const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = name || user.name;
    user.email = email || user.email;
    //check if password being updated
    if (password) {
      user.password = password;
    }

    //upload profile picture if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path, "spotify/users");
      user.profilePicture = result.secure_url;
    }
    const updatedUser = await user.save();
    res.status(StatusCodes.OK).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profilePicture: updatedUser.profilePicture,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Not Found")
  }
});


const toggleLikeSong = asyncHandler(async (req, res) => {
  const songId = req.params.id
  const song = await Song.findById(songId)
  const user = await User.findById(req.user._id)

  if (!user) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User Not Found")
  }



  //check if song already liked
  const songIndex = user.likedSongs.indexOf(songId)
  if (songIndex === -1) {
    //add song to liked songs
    user.likedSongs.push(songId)
    //increase song likes count
    song.likes += 1
  } else {
    //Remove song from liked songs
    user.likedSongs.splice(songIndex, 1)
    // Decrement song's likes count (ensure it doesn't go below 0)
    if (song.likes > 0) {
      song.likes -= 1;
    }
  }

  await Promise.all([user.save(), song.save()])

  res.status(StatusCodes.OK).json({
    likedSongs: user.likedSongs,
    message: songIndex === -1 ? 'Song added from liked songs' : 'Song removed from liked songs'
  });
})

const toggleFollowArtist = asyncHandler(async (req, res) => {
  const artistId = req.params.id
  //find the artist the we want follow or unfollow
  const artist = await Artist.findById(artistId)

  const user = await User.findById(req.user._id)
  if (!user) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Artist not found")
  }
  //check if artist already followed
  const artistIndex = user.followedArtists.indexOf(artistId);
  if (artistIndex === -1) {
    //add artist to followed artist
    user.followedArtists.push(artistId)
    artist.followedArtists += 1
  } else {
    //remove artist from followed artist
    user.followedArtists.slice(artistIndex, 1)
    // Decrement followr's likes count (ensure it doesn't go below 0)
    if (artist.followers > 0) {
      artist.followers -= 1;
    }
  }

  await Promise.all([user.save(), artist.save()])

  res.status(StatusCodes.OK).json({
    followedArtists: user.followedArtists,
    message: artistIndex === -1 ? 'Artist followed' : 'Artist unfollowed'
  });
})

const toggleFollowPlaylist = asyncHandler(async (req, res) => {
  const playlistId = req.params.id

  const user = await User.findById(req.user._id)

  if (!user) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User Not Found")
  }

  const playlist = await Playlist.findById(playlistId)
  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Playlist not found")
  }

  //check if playlist already followed
  const playlistIndex = user.followedPlaylists.indexOf(playlistId);
  if (playlistIndex === -1) {
    //add playlist to followed playlist
    user.followedPlaylists.push(playlistId)
    playlist.followers += 1
  } else {
    //remove playlist from followed playlist
    user.followedPlaylists.slice(playlistIndex, 1)
    // Decrement playlist followr's likes count (ensure it doesn't go below 0)
    if (playlist.followers > 0) {
      playlist.followers -= 1;
    }
  }

  await Promise.all([user.save(), playlist.save()])

  res.status(StatusCodes.OK).json({
    followedPlaylists: user.followedPlaylists,
    message: playlistIndex === -1 ? 'Playlist followed' : 'Playlist unfollowed'
  });
})


module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  toggleLikeSong,
  toggleFollowArtist,
  toggleFollowPlaylist
};
