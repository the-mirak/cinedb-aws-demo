const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

AWS.config.update({
  region: process.env.AWS_REGION
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.get('/admin-api/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Get all movies
app.get('/admin-api/movies', async (req, res) => {
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
app.get('/admin-api/movies/:id', async (req, res) => {
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

// Create a new movie
app.post('/admin-api/movies', upload.single('poster'), async (req, res) => {
  try {
    const { title, synopsis, rating } = req.body;
    const id = uuidv4();
    let imageUrl = '';

    if (req.file) {
      const params = {
        Bucket: BUCKET_NAME,
        Key: `posters/${id}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };
      const uploadResult = await s3.upload(params).promise();
      imageUrl = uploadResult.Location;
    }

    const params = {
      TableName: TABLE_NAME,
      Item: {
        id,
        title,
        synopsis,
        rating: parseFloat(rating),
        imageUrl,
        createdAt: new Date().toISOString()
      }
    };
    await dynamodb.put(params).promise();
    res.status(201).json(params.Item);
  } catch (error) {
    console.error('Error creating movie:', error);
    res.status(500).json({ error: 'Could not create movie' });
  }
});

// Update a movie
app.put('/admin-api/movies/:id', upload.single('poster'), async (req, res) => {
  try {
    const { title, synopsis, rating } = req.body;
    const { id } = req.params;
    let updateExpression = 'set title = :title, synopsis = :synopsis, rating = :rating, updatedAt = :updatedAt';
    let expressionAttributeValues = {
      ':title': title,
      ':synopsis': synopsis,
      ':rating': parseFloat(rating),
      ':updatedAt': new Date().toISOString()
    };

    if (req.file) {
      const params = {
        Bucket: BUCKET_NAME,
        Key: `posters/${id}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };
      const uploadResult = await s3.upload(params).promise();
      updateExpression += ', imageUrl = :imageUrl';
      expressionAttributeValues[':imageUrl'] = uploadResult.Location;
    }

    const params = {
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };
    const result = await dynamodb.update(params).promise();
    res.json(result.Attributes);
  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(500).json({ error: 'Could not update movie' });
  }
});

// Delete a movie
app.delete('/admin-api/movies/:id', async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: { id: req.params.id }
    };
    await dynamodb.delete(params).promise();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({ error: 'Could not delete movie' });
  }
});


app.listen(port, () => {
  console.log(`Admin API server running on port ${port}`);
});
