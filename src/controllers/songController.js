const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const Artist = require("../models/Artist");
const Album = require("../models/Album");
const Song = require("../models/Song");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");

//@desc - Create a new song
//@route - POST /create_song
//@Access - Private

const createSong = asyncHandler(async (req, res) => {
  const {
    title,
    artistId,
    albumId,
    duration,
    coverImage,
    genre,
    lyrics,
    isExplicit,
    featuredArtists,
  } = req.body;

  if (
    !title ||
    !artistId ||
    !albumId ||
    !duration ||
    !coverImage ||
    !genre ||
    !lyrics ||
    !isExplicit ||
    !featuredArtists
  ) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error(
      "title, artistId, albumId,duration,audioUrl,coverImage, releaseDate, genre, lyrics,plays,likes,isExplicit,featuredArtists, is required",
    );
  }

  if (title.length < 3 || title.length > 100) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("title must be between 3 and 100 characteres");
  }

  const artistExists = await Artist.findById(artistId);
  if (!artistExists) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Artist Not Exists");
  }

  const albumExists = await Album.findById(albumId);
  if (!albumExists) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Album Not Exists");
  }

  //Upload audio file
  if (!req.file || !req.files.audio) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Audio file is required");
  }

  const audioResult = await uploadToCloudinary(req.files.audio[0].path, "spotify/songs")

  //Upload Cover Image if provided
  let coverImageUrl = ""
  if (!req.files && req.files.cover) { // using files but not file because in songRouter we using array 
    const result = await uploadToCloudinary(req.files.cover[0].path, "spotify/covers")
    coverImageUrl = result.secure_url
  }

  const songExists = await Song.findOne({ title, artistId });
  if (songExists) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Song Already Exists");
  }

  const song = await Song.create({
    title,
    artist: artistId,
    album: albumId,
    coverImage: coverImageUrl || undefined,
    duration,
    audioUrl: audioResult.secure_url,
    genre,
    lyrics,
    isExplicit: isExplicit === "true",
    featuredArtists: featuredArtists ? JSON.parse(featuredArtists) : [],
  });

  //add songs to artist's songs
  artistExists.songs.push(song._id);
  await artistExists.save();
  //add song to album if album id provided
  if (albumId) {
    const album = await Album.findById(albumId)
    album.songs.push(song._id)
    await album.save()
  }

  res.status(StatusCodes.CREATED).json(song);
});

//@desc - Get songs with filetring and Pagination
//@route - GET /songs
//@Access - Public

const getSongs = asyncHandler(async (req, res) => {
  const {
    artist,
    genre,
    search,
    page = 1,
    limit = 10,
  } = req.query;
  //Build filer Object
  const filter = {};
  if (genre) filter.genre = genre
  if (artist) filter.artist = artist
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { genre: { $regex: search, $options: "i" } },
    ]
  }

  //Count total songs with filter
  const count = await Song.countDocuments(filter);
  //pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  //get songs
  const songs = await Song.find(filter)
    .sort({ releaseDate: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .populate("artist", "name image")
    .populate("album", "name coverImage")
    .populate("featuredArtists", "name");
  res.status(StatusCodes.OK).json({
    songs,
    page: parseInt(page),
    pages: Math.ceil(count / parseInt(limit)),
    totalSongs: count
  });

});

//! @desc - Get song by Id
//@route - GET /songs/:id
//@Access - Public

const getSongsById = asyncHandler(async (req, res) => {
  const songs = await Song.findById(req.params.id)
    .populate("artist", "name image bio")
    .populate("album", "title coverImage releasedDate")
    .populate("featuredArtists", "name image")
  if (songs) {
    //Inscrement plays count when send request
    songs.plays += 1;
    await songs.save()
    res.status(StatusCodes.OK).json(songs);
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Song Not Found");
  }
});

//@desc - Update song details
//@route - PUT /songs/:id
//@Access - Private

const updateSong = asyncHandler(async (req, res) => {
  const {
    title,
    artistId,
    albumId,
    duration,
    coverImage,
    genre,
    lyrics,
    isExplicit,
    featuredArtists
  } = req.body;

  const song = await Song.findById(req.params.id);

  if (!song) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Song Not Found");
  }

  //Update Song details
  song.title = title || song.title
  song.artist = artistId || song.artist
  song.album = albumId || song.album
  song.duration = duration || song.duration
  song.lyrics = lyrics || song.lyrics
  song.genre = genre || song.genre
  song.isExplicit = isExplicit !== undefined ? isExplicit === 'true' : song.isExplicit
  song.featuredArtists = featuredArtists ? JSON.parse(featuredArtists) : song.featuredArtists

  //Update cover image if provided
  if (req.files && req.files.cover) {
    const imageResult = await uploadToCloudinary(req.files.cover[0].path, "spotify/covers");
    song.coverImage = imageResult.secure_url
  }

  //Update audio File if provided 
  if (req.files && req.files.audio) {
    const audioResult = await uploadToCloudinary(req.files.audio[0].path, "spotify/songs");
    song.audioUrl = audioResult.secure_url
  }

  const updatedSong = await song.save();
  res.status(StatusCodes.OK).json(updatedSong);
});

//@desc - delete song details
//@route - DELETE /songs/:id
//@Access - Private

const deleteSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Song Not Found");
  }

  //Remove song from artist'songs
  await Artist.updateOne({ _id: song.artist }, { $pull: { songs: song._id } })

  //Remove song from album if it belongs to one
  if (song.album) {
    await Album.updateOne({ _id: song.album }, { $pull: { songs: song._id } })
  }

  //Remove Song
  await song.deleteOne();
  res.status(StatusCodes.OK).json({ message: "Song removed" });
});

//@desc - get top songs by plays
//@route - DELETE /songs/top?limit=5
//@Access - Public

const getTopSongs = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query

  const songs = await Song.find().sort({ plays: -1 }).limit(limit).populate("artist", "name image").populate("album","title coverImage")
  res.status(StatusCodes.OK).json(songs);

});

//@desc - get new releases (recently added songs)
//@route - DELETE /songs/new-releases?limit=10
//@Access - Public

const getNewReleases = asyncHandler(async (req, res) => { 
  const { limit = 10 } = req.query

  const songs = await Song.find().sort({ createdAt: -1 })
  .limit(limit)
  .populate("artist", "name image")
  .populate("album","title coverImage")
  
  res.status(StatusCodes.OK).json(songs);
});

module.exports = {
  createSong,
  getSongs,
  getSongsById,
  updateSong,
  deleteSong,
  getTopSongs,
  getNewReleases,
};
