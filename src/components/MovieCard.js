import React from 'react';
import { Star } from 'lucide-react';

const MovieCard = ({ movie }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900">{movie.title || 'No Title'}</h3>
      <p className="mt-1 text-sm text-gray-500">{movie.synopsis || 'No synopsis available'}</p>
      <div className="mt-2 flex items-center">
        <Star className="h-5 w-5 text-yellow-400 fill-current" />
        <span className="ml-1 text-lg font-semibold text-gray-900">
          {movie.rating ? movie.rating.toFixed(1) : 'N/A'}
        </span>
      </div>
      {movie.poster && (
        <img src={movie.poster} alt={movie.title} className="mt-4 w-full h-48 object-cover" />
      )}
    </div>
  );
};

export default MovieCard;