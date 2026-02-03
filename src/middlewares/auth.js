const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");

//Middlware to protect routes - verify JWT token and  set req.user

const protect = asyncHandler(async (req, res, next) => {
  let token;
  //check if user attaching token to the header
  if(!req.headers.authorization){
    res.status(StatusCodes.UNAUTHORIZED)
    throw new Error("No token Found in the header")
  }
  //Check if token exists in authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try{
    //get the token from the headers
    token = req.headers.authorization.split(" ")[1] // 9assem Bearer and token then take token
    //verify token
    const decoded = jwt.verify(token, process.env.JWT); //decode to get the actual id of the user
    //save user into req object
    req.user = await User.findById(decoded.id).select("-password")    
    console.log(req.user);
    next();
    } catch(err) {
       console.log(err);
       res.status(StatusCodes.UNAUTHORIZED)
       throw new Error ("Not authorized, token failed")
       
    }
    
  }
});

//Middlware to check if the user is an Admin 
const isAdmin = asyncHandler( async (req, res, next) =>{
    if(req.user && req.user.isAdmin){
        next()
    } else{
      res.status(StatusCodes.FORBIDDEN)
      throw new Error ("Not authorized as an admin")
    }
})

module.exports = {
  protect,
  isAdmin
};
