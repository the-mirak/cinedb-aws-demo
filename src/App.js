import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MovieCard from './components/MovieCard';
import AWS from 'aws-sdk';

console.log('Initializing AWS configuration...');
AWS.config.update({ region: 'us-west-2' }); // Replace with your actual region if different
console.log('AWS SDK Version:', AWS.VERSION);
console.log('AWS Config:', JSON.stringify(AWS.config, null, 2));

const dynamodb = new AWS.DynamoDB.DocumentClient();

const App = () => {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        console.log('Fetching movies...');
        console.log('DynamoDB client:', dynamodb);
        
        const params = {
          TableName: 'cinedb',
        };
        console.log('Scan params:', JSON.stringify(params, null, 2));
        
        const result = await dynamodb.scan(params).promise();
        console.log('Scan result:', JSON.stringify(result, null, 2));
        
        if (result.Items) {
          console.log('Fetched movies:', result.Items);
          setMovies(result.Items);
        } else {
          console.log('No items returned from scan');
          setMovies([]);
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        setError(error.message);
      }
    };

    fetchMovies();
  }, []);

  if (error) {
    return <div className="text-red-500 text-center mt-10">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Top Rated Movies</h1>
          {movies.length === 0 ? (
            <p className="text-center text-gray-500">No movies found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie.title} movie={movie} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;