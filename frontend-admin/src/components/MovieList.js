import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/admin-api/movies`);
        setMovies(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch movies');
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const deleteMovie = async (id) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/admin-api/movies/${id}`);
        setMovies(movies.filter(movie => movie.id !== id));
      } catch (err) {
        alert('Failed to delete movie');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container">
      <h1>CineDB Admin</h1>
      <Link to="/admin/add" className="add-button">Add New Movie</Link>
      <table className="movie-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Rating</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {movies.map(movie => (
            <tr key={movie.id}>
              <td>{movie.title}</td>
              <td>{movie.rating}</td>
              <td>
                <Link to={`/admin/edit/${movie.id}`} className="edit-button">Edit</Link>
                <button onClick={() => deleteMovie(movie.id)} className="delete-button">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MovieList;