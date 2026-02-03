const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const Artist = require("../models/Artist");
const Album = require("../models/Album");
const Song = require("../models/Song");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");

//@desc - Create a new artist
//@route - POST /create_artist
//@Access - Private

const createArtist = asyncHandler(async (req, res) => {
  //check req.body
  if (!req.body) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Request body required");
  }

  const { name, bio, genres } = req.body;

  if (!name) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Name is required");
  }
  if (!bio) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Bio is required");
  }
  if (!genres) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Genres is required");
  }

  const artistExists = await Artist.findOne({ name });

  if (artistExists) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Artist already Exists");
  }

  //upload artist image if provided
  let imageUrl = "";
  if (req.file) {
    const result = await uploadToCloudinary(req.file.path, "spotify/artists");
    imageUrl = result.secure_url;
  }

  //Create The artists
  const artist = await Artist.create({
    name,
    bio,
    genres,
    isVerified: true,
    image: imageUrl,
  });

  res.status(StatusCodes.CREATED).json({ artist });
  console.log("Artist Created Succefully");
});

//@desc - Get All artists with filtering and pagination
//@route - GET /artists
//@Access - Public

const getArtist = asyncHandler(async (req, res) => {
  const { genre, search, page = 1, limit = 10 } = req.query;
  //Build filter Object
  const filter = {};
  if (genre) filter.genres = { $in: [genre] };
  //in = include  (if user providing genres then return users with the specify genres)
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } }, //change everything to lowercase
      { bio: { $regex: search, $options: "i" } },
    ];
  }

  //Count total artists with filter
  const count = await Artist.countDocuments(filter);
  //Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  //Get artists
  const artists = await Artist.find(filter)
    .sort({ followers: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  res.status(StatusCodes.OK).json({
    artists,
    page: parseInt(page),
    pages: Math.ceil(count / parseInt(limit)),
    totalArtist: count,
  });
});

//! @desc - Get artist by id
//@route - GET /artists/id
//@Access - Public

const getArtistById = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id);

  if (artist) {
    res.status(StatusCodes.OK).json(artist);
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Artist Not Found");
  }
});

//@desc - Update artist details
//@route - PUT /artists/id
//@Access - Public

const updateArtist = asyncHandler(async (req, res) => {
  const { name, bio, genres, isVerified } = req.body;
  const artist = await Artist.findById(req.params.id);

  if (!artist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Artist Not Found");
  }

  //Update artist details
    artist.name = name || artist.name,
    artist.bio = bio || artist.bio,
    artist.genres = genres || artist.genres,
    artist.isVerified =
      isVerified !== undefined ? isVerified === "true" : artist.isVerified; // if the user is providing is verified if not undefined then take isVerified =true

  //Upload image if provided
  if (req.file) {
    const result = await uploadToCloudinary(req.file.path, "spotify/artists");
    artist.image = result.secure_url;
  }

  //reSave
  const updatedArtist = await artist.save();
  res.status(StatusCodes.OK).json(updatedArtist);
});

//@desc - delete artist
//@route - DELETE /artists/id
//@Access - Private Admin

const deleteArtist = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id);
  if (!artist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Artist Not Found");
  }
  //Delete all songs by artist
  await Song.deleteMany({
    artist: artist._id,
  });
  //Delete all albums by artist
  await Album.deleteMany({
    artist: artist._id,
  });
  await artist.deleteOne();
  res.status(StatusCodes.OK).json({ message: "Artist removed" });
});

//@desc - Get top 10 artist by followers
//@route - GET /artists/top?limit=10
//@Access - Public

const getTopArtist = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const artists = await Artist.find()
    .sort({ followers: -1 })
    .limit(parseInt(limit));
  res.status(StatusCodes.OK).json(artists);
});


//@desc - Get artist top songs
//@route - GET /artists/:id/top-songs?limit=5
//@Access - Public

const getTopArtistToSongs = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const songs = await Song.find()
    .sort({ plays: -1 })  //-1 => DESC
    .limit(parseInt(limit)).populate('album', 'title coverImage');

    if(songs.length > 0){

        res.status(StatusCodes.OK).json(songs);
    } else {
        res.status(StatusCodes.NOT_FOUND);
    throw new Error("Songs Not Found");

    }
});

module.exports = {
  createArtist,
  getArtist,
  getArtistById,
  updateArtist,
  deleteArtist,
  getTopArtist,
  getTopArtistToSongs
};
