import React from 'react';

const MovieCard = ({ title, rating, synopsis, posterUrl }) => {
    return (
        <div className="movie-card">
            <img src={posterUrl} alt={`${title} poster`} />
            <h2>{title}</h2>
            <p><strong>Rating:</strong> {rating}</p>
            <p>{synopsis}</p>
        </div>
    );
};

export default MovieCard;
