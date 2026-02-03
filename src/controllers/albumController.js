const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const Artist = require("../models/Artist");
const Album = require("../models/Album");
const Song = require("../models/Song");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");

//@desc - Create a new album
//@route - POST /create_album
//@Access - Private

const createAlbum = asyncHandler(async (req, res) => {
  //check if request body is defined
  if (!req.body) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Request body doesn't exists check server.js");
  }
  const { title, artistId, releaseDate, genre, description, isExplicit } =
    req.body;

  if (!title || !artistId || !releaseDate || !genre || !description) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error(
      "title, artistId, releaseDate, genre, description is required",
    );
  }

  if (title.length < 3 || title.length > 100) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("title must be between 3 and 100 characteres");
  }

  if (description.length < 10 || description.length > 200) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("description must be between 10 and 200 characteres");
  }

  //Check if artist not exists

  const existsArtist = await Artist.findById(artistId);
  if (!existsArtist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Artist Not Exists");
  }

  //Check if album already exists

  const existsAlbum = await Album.findOne({ title });
  if (existsAlbum) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Album already Exists");
  }

  //Upload Cover Image if provided
  let coverImageUrl = "";
  if (req.file) {
    const result = await uploadToCloudinary(req.file.path, "spotify/albums");
    coverImageUrl = result.secure_url;
  }

  const album = await Album.create({
    title,
    artist: artistId,
    releaseDate: releaseDate ? new Date(releaseDate) : Date.now(),
    coverImage: coverImageUrl || undefined,
    genre,
    description,
    isExplicit: isExplicit === "true",
  });

  //Add Album to artist's albums
  existsArtist.albums.push(album._id);
  await existsArtist.save();

  res.status(StatusCodes.CREATED).json(album);
});

//@desc - Get albums with filetring and Pagination
//@route - GET /albums
//@Access - Public

const getAlbums = asyncHandler(async (req, res) => {
  const { genre, artist, search, page = 1, limit = 10 } = req.query;
  //Build Filter Object
  const filter = {};
  if (genre) filter.genre = genre;
  if (artist) filter.artist = artist;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { genre: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const count = await Artist.countDocuments(filter);
  const skip = (parseInt(page) - 1) * parseInt(limit);

  //Get albums
  const albums = await Album.find(filter)
    .sort({ releaseDate: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .populate("artist","name image");

  res.status(StatusCodes.OK).json({
    albums,
    page: parseInt(page),
    pages: Math.ceil(count / parseInt(limit)),
    totalAlbums: count,
  });
});

//! @desc - Get album by Id
//@route - GET /albums/:id
//@Access - Public

const getAlbumById = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id).populate("artist","name image bio")

  if (album) {
    res.status(StatusCodes.OK).json(album);
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Album Not Found");
  }
});


//@desc - Update album details
//@route - PUT /albums/:id
//@Access - Private

const updateAlbum = asyncHandler(async (req, res) => {
  const { title, releasedDate, genre, description, isExplicit } = req.body;
  const album = await Album.findById(req.params.id);

  if (!album) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("album Not Found");
  }

  //Update album details
  (
    (album.title = title || album.title),
    (album.releasedDate = releasedDate || album.releasedDate),
    (album.genre = genre || album.genre),
    (album.description = description || album.description),
    (album.isExplicit =
      isExplicit !== undefined ? isExplicit === "true" : album.isExplicit)); // if the user is providing is verified if not undefined then take isVerified =true

  //Upload image if provided
  if (req.file) {
    const result = await uploadToCloudinary(req.file.path, "spotify/albums");
    album.image = result.secure_url;
  }

  //reSave
  const updatedAlbum = await Album.save();
  res.status(StatusCodes.OK).json(updatedAlbum);
});

//@desc - delete album details
//@route - DELETE /albums/:id
//@Access - Private

const deleteAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Album Not Found");
  }
  //Delete album from artist's albums
  await Artist.updateOne(
    { _id: album.artist},
    { $pull: { albums: album._id}},  //pull: removing
  );

  //update songs to remove album reference 
   await Song.updateMany(
    {album: album._id,},
    {$unset: { album: 1}}
  );

  await album.deleteOne();
  res.status(StatusCodes.OK).json({ message: "Album removed" });
});

//@desc - Add songs to album
//@route - PUT /albums/:id/add-songs
//@Access - Private

const addSongsToAlbum = asyncHandler(async (req, res) => {
  // const {} = req.body
  const albums = await Album.findOne(req.params.id);
});

//@desc - Remove song from album
//@route - PUT /albums/:id/remove-songs/songId
//@Access - Private

const removeSongFromAlbum = asyncHandler(async (req, res) => {
  // const {} = req.body
  const albums = await Album.findOne(req.params.id);
});

//@desc - Get new releases (recently added albums)
//@route - GET /albums/:id/new-releases?limit=10
//@Access - Private

const getNewReleases = asyncHandler(async (req, res) => {
  // const {} = req.body
  const albums = await Album.findOne(req.params.id);
});

module.exports = {
  createAlbum,
  getAlbums,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  addSongsToAlbum,
  removeSongFromAlbum,
  getNewReleases,
};
