require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const app = express();
const port = 8000;

// ✅ Middleware
app.use(express.json());

// ✅ Cloudinary Configuration (For Image Uploads)
cloudinary.config({
    cloud_name: 'dazwerdxb',
    api_key: '153212566631821',
    api_secret: 'Fss-NdTtG2huRtBZ5hI3gILtcwM'
});

// ✅ MongoDB Connection
mongoose.connect('mongodb+srv://debbiswas2002:meowamishameow@instaclone.5sbfg.mongodb.net/?retryWrites=true&w=majority&appName=InstaClone', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err));

// ✅ User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    age: Number,
    city: String
});
const User = mongoose.model('User', userSchema);

// ✅ Post Schema
const postSchema = new mongoose.Schema({
    id: String,
    username: String,
   comment: { type: [String], default: [] }, 
    likes: Number,
    imageUrl: String,
    content: String
});
const Post = mongoose.model('Post', postSchema);

// ✅ Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// ✅ Signup API - Register a new user
app.post('/signup', async (req, res) => {
    const { name, email, password, age, city } = req.body;

    if (!name || !email || !password || !age || !city) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, age, city });
        await newUser.save();

        res.json({ message: "✅ Signup successful", user: { name, age, city } });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Login API - Authenticate user
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid password" });
        }

        res.json({ message: "✅ Login successful", user: { name: user.name, age: user.age, city: user.city } });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Upload Post API (Image stored in Cloudinary, data in MongoDB)
app.post('/upload', upload.single('image'), async (req, res) => {
    const { username, comment, likes } = req.body;

    if (!username || !req.file) {
        return res.status(400).json({ error: "Username and image are required" });
    }

    try {
        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);
        fs.unlinkSync(req.file.path); // Delete local file after upload

        // Save post details in MongoDB
        const newPost = new Post({
            id: uuidv4(),
            username,
            comment: comment || "",
            likes: parseInt(likes) || 0,
            imageUrl: result.secure_url
        });

        await newPost.save();
        res.json({ message: "✅ Post uploaded successfully", post: newPost });
    } catch (error) {
        res.status(500).json({ error: "Failed to upload post" });
    }
});
app.post('/upload-News', upload.single('image'), async (req, res) => {
    const { username, comment, likes,content } = req.body;

    if (!username || !req.file) {
        return res.status(400).json({ error: "Username and image are required" });
    }

    try {
        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);
        fs.unlinkSync(req.file.path); // Delete local file after upload

        // Save post details in MongoDB
        const newPost = new Post({
            id: uuidv4(),
            username,
            comment:  [],
            likes: parseInt(likes) || 0,
            imageUrl: result.secure_url,content:content
        });

        await newPost.save();
        res.json({ message: "✅ Post uploaded successfully", post: newPost });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to upload post" });
    }
});

// ✅ Get All Posts API
app.get('/posts', async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        const totalPosts = await Post.countDocuments();
        const posts = await Post.find()
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            totalPosts,
            totalPages: Math.ceil(totalPosts / limit),
            currentPage: page,
            posts
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});


// ✅ Start Server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
