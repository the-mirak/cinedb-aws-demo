const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 80;

app.use(cors());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle any requests that don't match the above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});