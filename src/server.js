const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors")
const dotenv = require("dotenv");
const userRouter  = require("./routes/userRouter");
const { StatusCodes } = require("http-status-codes");
const artistRouter = require("./routes/artistRouter");
const albumRouter = require("./routes/albumRouter");
const songRouter = require("./routes/songRouter");
const playlistRouter = require("./routes/playlistRouter");
dotenv.config();
const app = express();

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("Mongodb Connected ...");
  })
  .catch((e) => {
    console.log(e.messsage);
  });

app.use(cors());
app.use(express.json())
app.use("/users", userRouter)  
app.use("/artists", artistRouter)  
app.use("/albums", albumRouter)  
app.use("/songs", songRouter)  
app.use("/playlists", playlistRouter)  

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Frontend ↔ Backend connected 🎉",
    time: new Date().toISOString(),
  });
});


// //Error Handling middleware
// //404
// app.use((req, res, next) => {
//   const error = new Error("Not Found");
//   error.status = StatusCodes.NOT_FOUND;
//   next(error);
// });
// //Global error handler
// app.use((err, req, res, next) => {
//   res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
//     message: err.message || "Internal server Error",
//     status: "error",
//   });
// });

const port = process.env.PORT || 3000;
app.listen(port, console.log(`Server Running on http://localhost:${port}`));
