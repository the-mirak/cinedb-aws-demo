const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Create directory for serving uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Load mock data
let movies = [];
const dataFile = path.join(__dirname, 'movies.json');

if (fs.existsSync(dataFile)) {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    movies = JSON.parse(data);
  } catch (err) {
    console.error('Error reading movies.json:', err);
    movies = [];
  }
} else {
  // Create sample data if file doesn't exist
  movies = [
    {
      id: '1',
      title: 'Interstellar',
      rating: '8.7',
      synopsis: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
      poster: '/uploads/interstellar.jpg',
      director: 'Christopher Nolan',
      year: '2014',
      duration: '169 min',
      genre: 'Adventure, Drama, Sci-Fi',
      cast: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain'
    },
    {
      id: '2',
      title: 'Inception',
      rating: '8.8',
      synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      poster: '/uploads/inception.jpg',
      director: 'Christopher Nolan',
      year: '2010',
      duration: '148 min',
      genre: 'Action, Adventure, Sci-Fi',
      cast: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page'
    },
    {
      id: '3',
      title: 'Pulp Fiction',
      rating: '8.9',
      synopsis: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
      poster: '/uploads/pulp_fiction.jpg',
      director: 'Quentin Tarantino',
      year: '1994',
      duration: '154 min',
      genre: 'Crime, Drama',
      cast: 'John Travolta, Uma Thurman, Samuel L. Jackson'
    },
    {
      id: '4',
      title: 'The Dark Horizon',
      rating: '7.5',
      synopsis: 'A brilliant scientist discovers a way to look into the future, but what she sees threatens her present reality.',
      poster: '/uploads/sample1.jpg',
      director: 'Emily Johnson',
      year: '2022',
      duration: '132 min',
      genre: 'Sci-Fi, Thriller',
      cast: 'Ana de Armas, John Boyega, Ryan Gosling'
    },
    {
      id: '5',
      title: 'Eternal Sunshine',
      rating: '8.3',
      synopsis: 'In a remote village untouched by time, a stranger arrives with a secret that could change the world forever.',
      poster: '/uploads/sample2.jpg',
      director: 'Miguel Sanchez',
      year: '2023',
      duration: '124 min',
      genre: 'Fantasy, Drama',
      cast: 'Zendaya, Tom Holland, Idris Elba'
    }
  ];
  
  // Save sample data
  fs.writeFileSync(dataFile, JSON.stringify(movies, null, 2));
  
  // Ensure sample poster images exist
  console.log('Sample data created. Be sure to run "npm run create-samples" to generate the sample images.');
}

// Helper function to save movies data
function saveMovies() {
  fs.writeFileSync(dataFile, JSON.stringify(movies, null, 2));
}

// GET all movies
app.get('/movies', (req, res) => {
  res.json(movies);
});

// GET a specific movie
app.get('/movies/:id', (req, res) => {
  const movie = movies.find(m => m.id === req.params.id);
  if (movie) {
    res.json(movie);
  } else {
    res.status(404).json({ error: 'Movie not found' });
  }
});

// POST a new movie
app.post('/movies', upload.single('poster'), (req, res) => {
  const { title, rating, synopsis, director, year, duration, genre, cast } = req.body;
  
  if (!title || !rating || !synopsis) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const newMovie = {
    id: uuidv4(),
    title,
    rating,
    synopsis,
    poster: req.file ? `/uploads/${req.file.filename}` : null,
    director: director || '',
    year: year || '',
    duration: duration || '',
    genre: genre || '',
    cast: cast || ''
  };
  
  movies.push(newMovie);
  saveMovies();
  
  res.status(201).json(newMovie);
});

// PUT/update a movie
app.put('/movies/:id', upload.single('poster'), (req, res) => {
  const { title, rating, synopsis, director, year, duration, genre, cast } = req.body;
  const movieIndex = movies.findIndex(m => m.id === req.params.id);
  
  if (movieIndex === -1) {
    return res.status(404).json({ error: 'Movie not found' });
  }
  
  const updatedMovie = {
    ...movies[movieIndex],
    title: title || movies[movieIndex].title,
    rating: rating || movies[movieIndex].rating,
    synopsis: synopsis || movies[movieIndex].synopsis,
    director: director || movies[movieIndex].director,
    year: year || movies[movieIndex].year,
    duration: duration || movies[movieIndex].duration,
    genre: genre || movies[movieIndex].genre,
    cast: cast || movies[movieIndex].cast
  };
  
  if (req.file) {
    updatedMovie.poster = `/uploads/${req.file.filename}`;
  }
  
  movies[movieIndex] = updatedMovie;
  saveMovies();
  
  res.json(updatedMovie);
});

// DELETE a movie
app.delete('/movies/:id', (req, res) => {
  const movieIndex = movies.findIndex(m => m.id === req.params.id);
  
  if (movieIndex === -1) {
    return res.status(404).json({ error: 'Movie not found' });
  }
  
  // Remove the movie from the array
  const deletedMovie = movies[movieIndex];
  movies.splice(movieIndex, 1);
  saveMovies();
  
  // If there's a poster, delete it (optional)
  if (deletedMovie.poster && deletedMovie.poster.startsWith('/uploads/')) {
    const posterPath = path.join(__dirname, deletedMovie.poster);
    if (fs.existsSync(posterPath)) {
      fs.unlinkSync(posterPath);
    }
  }
  
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
}); 