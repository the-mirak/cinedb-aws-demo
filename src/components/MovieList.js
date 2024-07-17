import React, { useEffect, useState } from 'react';
import { dynamoDb, s3 } from '../awsConfig';
import MovieCard from './MovieCard';

const MovieList = () => {
    const [movies, setMovies] = useState([]);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const params = {
                    TableName: 'cinedb'
                };
                const data = await dynamoDb.scan(params).promise();
                const movieData = await Promise.all(data.Items.map(async (movie) => {
                    const posterUrl = await s3.getSignedUrlPromise('getObject', {
                        Bucket: 'your-s3-bucket-name', // Update to your S3 bucket name
                        Key: movie.poster
                    });
                    return { ...movie, posterUrl };
                }));
                setMovies(movieData);
            } catch (error) {
                console.error("Error fetching movies: ", error);
            }
        };

        fetchMovies();
    }, []);

    return (
        <div className="movie-list">
            {movies.map((movie) => (
                <MovieCard key={movie.title} {...movie} />
            ))}
        </div>
    );
};

export default MovieList;
