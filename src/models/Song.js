const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Song title is required"],
      trim: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: [true, "Artist is required"],
    },
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
    },
    duration: {
      type: Number,
      required: [true, "Song duration is required"],
    },
    audioUrl: {
      type: String,
      required: [true, "Audio URL is required"],
    },
    coverImage: {
      type: String,
      default: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
    },
    releaseDate: {
      type: Date,
      default: Date.now,
    },
    genre: {
      type: String,
      trim: true,
    },
    lyrics: {
      type: String,
      trim: true,
    },
    plays: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    isExplicit: {
      type: Boolean,
      default: false,
    },
    featuredArtists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist",
      },
    ],
  },
  { timestamps: true }
);

// Format the song duration (mm:ss)
songSchema.virtual("formattedDuration").get(function () {
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
});

// Configure schema to include virtuals when converted to JSON
songSchema.set("toJSON", { virtuals: true });
songSchema.set("toObject", { virtuals: true });

const Song = mongoose.model("Song", songSchema);

module.exports = Song;
