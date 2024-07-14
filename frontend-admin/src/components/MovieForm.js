import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useHistory } from 'react-router-dom';

const MovieForm = () => {
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [rating, setRating] = useState('');
  const [poster, setPoster] = useState(null);
  const { id } = useParams();
  const history = useHistory();

  useEffect(() => {
    if (id) {
      const fetchMovie = async () => {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/admin-api/movies/${id}`);
        setTitle(res.data.title);
        setSynopsis(res.data.synopsis);
        setRating(res.data.rating);
      };
      fetchMovie();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('synopsis', synopsis);
    formData.append('rating', rating);
    if (poster) formData.append('poster', poster);

    try {
      if (id) {
        await axios.put(`${process.env.REACT_APP_API_URL}/admin-api/movies/${id}`, formData);
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/admin-api/movies`, formData);
      }
      history.push('/admin');
    } catch (err) {
      alert('Failed to save movie');
    }
  };

  return (
    <div className="container">
      <h1>{id ? 'Edit Movie' : 'Add New Movie'}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Synopsis:</label>
          <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} required />
        </div>
        <div>
          <label>Rating:</label>
          <input type="number" value={rating} onChange={(e) => setRating(e.target.value)} min="0" max="10" step="0.1" required />
        </div>
        <div>
          <label>Poster:</label>
          <input type="file" onChange={(e) => setPoster(e.target.files[0])} accept="image/*" />
        </div>
        <button type="submit">{id ? 'Update' : 'Add'} Movie</button>
      </form>
    </div>
  );
};

export default MovieForm;