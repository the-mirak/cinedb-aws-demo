const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Function to generate a sample movie poster
function createMoviePoster(filename, title, color) {
  // Create a 600x900 canvas (typical movie poster aspect ratio)
  const canvas = createCanvas(600, 900);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 600, 900);

  // Add some design elements
  // Gradient overlay at the bottom
  const gradient = ctx.createLinearGradient(0, 600, 0, 900);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 600, 600, 300);

  // Add movie title text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 50px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Break title into multiple lines if too long
  const words = title.split(' ');
  let lines = [];
  let currentLine = words[0];
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < 550) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  
  // Draw title text
  lines.forEach((line, i) => {
    ctx.fillText(line, 300, 800 - (lines.length - 1 - i) * 60);
  });

  // Add some decorative elements
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(150, 200, 300, 5);
  
  // Draw a decorative rating star
  ctx.fillStyle = '#FFD700'; // Gold color
  const starX = 300;
  const starY = 250;
  const spikes = 5;
  const outerRadius = 40;
  const innerRadius = 15;
  
  let rot = Math.PI / 2 * 3;
  let x = starX;
  let y = starY;
  const step = Math.PI / spikes;
  
  ctx.beginPath();
  ctx.moveTo(starX, starY - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = starX + Math.cos(rot) * outerRadius;
    y = starY + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;
    
    x = starX + Math.cos(rot) * innerRadius;
    y = starY + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(starX, starY - outerRadius);
  ctx.closePath();
  ctx.fill();

  // Save to file
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  
  console.log(`Created poster: ${filename}`);
}

// Create sample movie posters
createMoviePoster('sample1.jpg', 'The Dark Horizon', '#1a365d');
createMoviePoster('sample2.jpg', 'Eternal Sunshine', '#9f580a');
createMoviePoster('interstellar.jpg', 'Interstellar', '#0f172a');
createMoviePoster('inception.jpg', 'Inception', '#064e3b');
createMoviePoster('pulp_fiction.jpg', 'Pulp Fiction', '#7c2d12');

console.log('Sample movie posters created successfully!'); 