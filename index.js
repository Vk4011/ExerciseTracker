const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('\n\t Connected to DB successfully');
})
.catch(error => {
  console.error('Error connecting to DB:', error.message);
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
  }
}, { versionKey: false });
const User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.create({ username });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('\n\t app is listening on port ' + listener.address().port);
});

