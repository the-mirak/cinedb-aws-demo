import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MovieCard from './components/MovieCard';
import AWS from 'aws-sdk';

AWS.config.update({
  region: process.env.REACT_APP_AWS_REGION,
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const App = () => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const params = {
          TableName: 'cinedb',
        };
        const result = await dynamodb.scan(params).promise();
        console.log('Fetched movies:', result.Items);
        setMovies(result.Items);
      } catch (error) {
        console.error('Error fetching movies:', error);
      }
    };

    fetchMovies();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Top Rated Movies</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.title} movie={movie} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;