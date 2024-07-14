import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const MovieDetails = () => {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/movies/${id}`);
        setMovie(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch movie details');
        setLoading(false);
      }
    };
    fetchMovie();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!movie) return <div>Movie not found</div>;

  return (
    <div className="container">
      <h1>{movie.title}</h1>
      <div className="movie-details">
        <img src={movie.imageUrl} alt={movie.title} />
        <div>
          <p>{movie.synopsis}</p>
          <p>Rating: {movie.rating}/10</p>
        </div>
      </div>
      <Link to="/" className="back-button">Back to Movies</Link>
    </div>
  );
};

export default MovieDetails;