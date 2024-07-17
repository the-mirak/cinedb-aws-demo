const express = require('express');
const path = require('path');
const cors = require('cors');
const AWS = require('aws-sdk');

const app = express();
const port = process.env.PORT || 80;

app.use(cors());

// Configure AWS SDK
AWS.config.update({ region: 'us-west-2' });

const dynamodb = new AWS.DynamoDB.DocumentClient();

// API endpoint to fetch movies from DynamoDB
app.get('/api/movies', async (req, res) => {
  const params = {
    TableName: 'cinedb',
  };

  try {
    const result = await dynamodb.scan(params).promise();
    res.json(result.Items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle any requests that don't match the above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
