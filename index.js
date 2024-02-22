const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI);

const UserSchema = new Schema({
  username: String,
});

const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
});

const Exercise = mongoose.model('Exercise', ExerciseSchema);

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Create a new user
app.post("/api/users", async (req, res) => {
  try {
    const user = new User({
      username: req.body.username
    });
    const savedUser = await user.save();
    res.json({
      username: savedUser.username,
      _id: savedUser._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get list of all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Add an exercise
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { description, duration, date } = req.body;
    const exercise = new Exercise({
      user_id: req.params._id,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date()
    });
    await exercise.save();
    res.json({
      username: user.username,
      _id: user._id,
      description,
      duration: parseInt(duration),
      date: exercise.date.toDateString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add exercise' });
  }
});

// Get full exercise log of any user
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    let query = { user_id: req.params._id };
    if (req.query.from || req.query.to) {
      query.date = {};
      if (req.query.from) {
        query.date.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        query.date.$lte = new Date(req.query.to);
      }
    }
    let log = await Exercise.find(query).select('-_id description duration date');
    if (req.query.limit) {
      log = log.slice(0, parseInt(req.query.limit));
    }
    res.json({
      username: user.username,
      _id: user._id,
      count: log.length,
      log: log.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch exercise log' });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
