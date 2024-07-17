import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MovieCard from './components/MovieCard';

const App = () => {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        console.log('Fetching movies...');
        
        const response = await fetch('/api/movies');
        const data = await response.json();
        
        if (response.ok) {
          setMovies(data);
        } else {
          throw new Error(data.error || 'Failed to fetch movies');
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

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
