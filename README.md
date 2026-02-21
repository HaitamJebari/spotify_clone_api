🎵 Spotify API Backend

A RESTful API built with Node.js and Express.js that integrates Spotify-style features such as authentication, media handling, and secure user management.
The project follows best practices for scalable backend development, including JWT authentication, async error handling, and cloud-based file storage.

🚀 Features

🔐 JWT Authentication & Authorization

🧑‍💻 Secure user registration & login

📁 File uploads with Multer

☁️ Media storage using Cloudinary

🗄️ MongoDB database with Mongoose

⚡ Centralized error handling using express-async-handler

📊 Standard HTTP response handling with http-status-codes

🧩 Clean and modular project structure

🔄 RESTful API architecture

🛠️ Tech Stack

Backend

Node.js

Express.js

Database

MongoDB

Mongoose

Authentication & Security

JSON Web Token (JWT)

bcryptjs

File Upload & Storage

Multer

Cloudinary

Utilities

express-async-handler

http-status-codes

dotenv


📦 Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/HaitamJebari/spotify_clone_api.git
cd spotify-api-backend

2️⃣ Install dependencies
npm install

3️⃣ Environment Variables

Create a .env file in the root directory:

PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

▶️ Running the Project
Development Mode
npm run dev

🧪 Error Handling

Centralized error handler middleware

Async errors handled with express-async-handler

Proper HTTP status codes using http-status-codes

☁️ Media Uploads

Files uploaded using Multer

Stored securely on Cloudinary

Only validated file types allowed

🔒 Security Best Practices

Password hashing

JWT token expiration

Protected routes

Environment variables for sensitive data

👨‍💻 Author

Haitam Jebari
Full-Stack Developer
📍 Morocco
💼 Open to internship & backend opportunities

⭐ Support

If you like this project, consider giving it a star ⭐ on GitHub!

If you want, I can also:

Customize it for internship applications

Add Swagger docs section

Rewrite it to sound more senior-level

Add badges (Node, MongoDB, JWT, etc.)

Just tell me 👍
