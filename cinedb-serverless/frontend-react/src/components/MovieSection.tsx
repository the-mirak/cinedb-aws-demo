import { ChevronRight } from "lucide-react";
import { MovieCard } from "./MovieCard";
import { Button } from "@/components/ui/button";

interface Movie {
  id: number;
  title: string;
  year: string;
  rating: number;
  imageUrl: string;
  genre: string;
}

interface MovieSectionProps {
  title: string;
  movies: Movie[];
  onMovieClick?: (movieId: number) => void;
}

export const MovieSection = ({ title, movies, onMovieClick }: MovieSectionProps) => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {title}
          </h2>
          <Button variant="ghost" className="gap-1 group">
            View All
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {movies.map((movie) => (
            <MovieCard 
              key={movie.id} 
              {...movie} 
              onClick={() => onMovieClick?.(movie.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
