// index.js
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

const movies = [
  {
    title: "Shadow of the Deep",
    synopsis: "In a futuristic society, a scientist discovers a way to manipulate memories, leading to unexpected consequences and a race against time to undo the damage.",
    rating: 7.8,
    poster: "https://cinedb-bucket-2024.s3.us-west-2.amazonaws.com/ShadowOfTheDeep.png"
  },
  {
    title: "Celestial Nomads",
    synopsis: "In a distant galaxy, a group of interstellar travelers embarks on a journey to find a new home, facing unknown dangers and forging new alliances along the way.",
    rating: 9.3,
    poster: "https://cinedb-bucket-2024.s3.us-west-2.amazonaws.com/CelestialNomads.png"
  },
  {
    title: "Quantum Echo",
    synopsis: "In a world where time travel is possible, a detective must solve a series of crimes that echo through different timelines, all while confronting his own past.",
    rating: 8.0,
    poster: "https://cinedb-bucket-2024.s3.us-west-2.amazonaws.com/QuantumEcho.png"
  }
];

async function addMovie(movie) {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      id: uuidv4(),
      title: movie.title,
      synopsis: movie.synopsis,
      rating: movie.rating,
      poster: movie.poster,
      createdAt: new Date().toISOString()
    }
  };

  try {
    await dynamodb.put(params).promise();
    console.log(`Added movie: ${movie.title}`);
    return true;
  } catch (error) {
    console.error(`Unable to add movie ${movie.title}. Error: ${error.message}`);
    return false;
  }
}

exports.handler = async (event, context) => {
  console.log('Starting to add dummy movies...');
  
  const results = await Promise.all(movies.map(addMovie));
  const successCount = results.filter(Boolean).length;
  
  console.log(`Added ${successCount} out of ${movies.length} movies.`);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Successfully added ${successCount} movies to CineDB.` }),
  };
};