const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

app.use(cors());
app.use(express.json());

// Get all movies
app.get('/api/movies', async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME
    };
    const data = await dynamodb.scan(params).promise();
    res.json(data.Items);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Could not retrieve movies' });
  }
});

// Get a single movie by ID
app.get('/api/movies/:id', async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: { id: req.params.id }
    };
    const data = await dynamodb.get(params).promise();
    if (data.Item) {
      res.json(data.Item);
    } else {
      res.status(404).json({ error: 'Movie not found' });
    }
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ error: 'Could not retrieve movie' });
  }
});

app.listen(port, () => {
  console.log(`Index API server running on port ${port}`);
});
