/**
 * Movie Poster Generator
 * Generates SVG placeholders for movie posters
 */

/**
 * Generate an SVG placeholder for a movie poster
 * @param {string} title - The movie title
 * @param {string} color - Optional background color (defaults to random color)
 * @returns {string} - SVG data URI
 */
function generatePosterPlaceholder(title, color) {
  // Generate a random color if none provided
  if (!color) {
    const colors = [
      '#1a365d', // Deep blue
      '#064e3b', // Deep green
      '#7c2d12', // Deep brown
      '#9f580a', // Amber
      '#7e22ce', // Purple
      '#831843', // Deep pink
      '#0f172a', // Navy
      '#3f6212', // Olive
    ];
    color = colors[Math.floor(Math.random() * colors.length)];
  }

  // Format title for display
  const displayTitle = formatTitleForDisplay(title || 'No Title');
  
  // Create SVG content
  const svgContent = `
    <svg width="600" height="900" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="900" fill="${color}" />
      
      <!-- Film strip design -->
      <rect x="100" y="150" width="400" height="600" fill="none" stroke="#ffffff40" stroke-width="2" />
      <rect x="135" y="190" width="330" height="520" fill="none" stroke="#ffffff30" stroke-width="2" />
      
      <!-- Film perforations -->
      <circle cx="120" cy="190" r="10" fill="#ffffff20" stroke="#ffffff40" stroke-width="2" />
      <circle cx="120" cy="290" r="10" fill="#ffffff20" stroke="#ffffff40" stroke-width="2" />
      <circle cx="120" cy="390" r="10" fill="#ffffff20" stroke="#ffffff40" stroke-width="2" />
      <circle cx="120" cy="490" r="10" fill="#ffffff20" stroke="#ffffff40" stroke-width="2" />
      <circle cx="120" cy="590" r="10" fill="#ffffff20" stroke="#ffffff40" stroke-width="2" />
      <circle cx="120" cy="690" r="10" fill="#ffffff20" stroke="#ffffff40" stroke-width="2" />
      
      <circle cx="480" cy="190" r="10" fill="#ffffff20" stroke="#ffffff40" stroke-width="2" />
      <circle cx="480" cy="290" r="10" fill="#ffffff20" stroke="#ffffff40" stroke-width="2" />
      <circle cx="480" cy="390" r="10" fill="#ffffff20" stroke="#ffffff40" stroke-width="2" />
      <circle cx="480" cy="490" r="10" fill="#ffffff20" stroke="#ffffff40" stroke-width="2" />
      <circle cx="480" cy="590" r="10" fill="#ffffff20" stroke="#ffffff40" stroke-width="2" />
      <circle cx="480" cy="690" r="10" fill="#ffffff20" stroke="#ffffff40" stroke-width="2" />
      
      <!-- Decorative elements -->
      <rect x="150" y="200" width="300" height="5" fill="white" />
      
      <!-- Star rating symbol -->
      <polygon points="300,250 315,285 355,285 325,310 335,345 300,325 265,345 275,310 245,285 285,285" fill="gold" />
      
      <!-- Title -->
      ${displayTitle.map((line, i) => 
        `<text x="300" y="${620 + i * 50}" font-family="Arial" font-size="30" 
         fill="white" text-anchor="middle">${line}</text>`
      ).join('')}
    </svg>
  `;
  
  // Convert to data URI
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent.trim());
}

/**
 * Format a movie title for display in the SVG
 * Breaks into multiple lines if needed
 * @param {string} title - The movie title
 * @returns {string[]} - Array of lines
 */
function formatTitleForDisplay(title) {
  // Maximum characters per line (approximate)
  const maxCharsPerLine = 18;
  
  // Split into words
  const words = title.split(' ');
  let lines = [];
  let currentLine = words[0];
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  // Add the last line
  lines.push(currentLine);
  
  return lines;
}

/**
 * Generate a completely random poster with decorative elements
 * @param {string} title - The movie title 
 * @returns {string} - SVG data URI
 */
function generateRandomPoster(title) {
  // Generate random pastel color
  const hue = Math.floor(Math.random() * 360);
  const color = `hsl(${hue}, 70%, 30%)`;
  
  return generatePosterPlaceholder(title, color);
} 