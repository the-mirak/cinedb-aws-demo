import React from 'react';
import { Star } from 'lucide-react';

const MovieCard = ({ movie }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center justify-center h-48 bg-gray-200 text-gray-400">
          {movie.poster ? (
            <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl">Movie Poster</span>
          )}
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">{movie.title}</h3>
        {/* <p className="mt-1 text-sm text-gray-500">{movie.genre}</p> */}
        <div className="mt-2 flex items-center">
          <Star className="h-5 w-5 text-yellow-400 fill-current" />
          <span className="ml-1 text-lg font-semibold text-gray-900">{movie.rating.toFixed(1)}</span>
        </div>
        <p className="mt-2 text-sm text-gray-600 line-clamp-3">{movie.synopsis}</p>
        <button className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          Read More
        </button>
      </div>
    </div>
  );
};

export default MovieCard;