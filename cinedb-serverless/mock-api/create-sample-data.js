const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Sample movie data
const movies = [
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

// Create sample placeholder images (simple colored rectangles)
function createPlaceholderImage(filename, color) {
  // This creates an SVG file which doesn't require the canvas library
  const svg = `
    <svg width="600" height="900" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="900" fill="${color}" />
      <rect x="150" y="200" width="300" height="5" fill="white" />
      <text x="300" y="500" font-family="Arial" font-size="40" fill="white" text-anchor="middle">${filename.replace('.jpg', '')}</text>
      <polygon points="300,250 315,285 355,285 325,310 335,345 300,325 265,345 275,310 245,285 285,285" fill="gold" />
    </svg>
  `;
  
  fs.writeFileSync(path.join(uploadDir, filename.replace('.jpg', '.svg')), svg);
  
  // Also create a simple file with the .jpg extension for compatibility
  fs.writeFileSync(path.join(uploadDir, filename), 'Placeholder image');
  
  console.log(`Created placeholder for: ${filename}`);
}

// Create movie data file
const dataFile = path.join(__dirname, 'movies.json');
fs.writeFileSync(dataFile, JSON.stringify(movies, null, 2));
console.log(`Created movie data file: ${dataFile}`);

// Create sample placeholder images
const placeholders = [
  { filename: 'interstellar.jpg', color: '#0f172a' },
  { filename: 'inception.jpg', color: '#064e3b' },
  { filename: 'pulp_fiction.jpg', color: '#7c2d12' },
  { filename: 'sample1.jpg', color: '#1a365d' },
  { filename: 'sample2.jpg', color: '#9f580a' }
];

placeholders.forEach(p => createPlaceholderImage(p.filename, p.color));

console.log('Sample data and placeholder images created successfully!');
console.log('You can now run the mock API server with: npm start'); 