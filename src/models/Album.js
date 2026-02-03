const mongoose = require("mongoose");

//Schema
const albumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Album title is required"],
      trim: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Artist is required"],
      ref: "Artist",
    },
    releasedDate: {
      type: Date,
      default: Date.now(),
    },

    coverImage: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2016/11/29/12/39/recording-studio-1869560_1280.jpg",
    },
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    genre: {
      type: String,
      trim: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    isExplicit: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

//Compile to for the model
const Album = mongoose.model("Album", albumSchema);

module.exports = Album;
