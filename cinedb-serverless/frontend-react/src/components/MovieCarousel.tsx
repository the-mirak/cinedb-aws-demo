import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Movie {
  id: number | string;
  title: string;
  year: string | number;
  rating: number;
  poster?: string;
  imageUrl?: string;
  genre?: string;
  director?: string;
}

interface MovieCarouselProps {
  movies: Movie[];
  onMovieClick?: (movieId: number | string) => void;
}

export const MovieCarousel = ({ movies, onMovieClick }: MovieCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || movies.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, movies.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
    setIsAutoPlaying(false);
  };

  if (movies.length === 0) return null;

  const currentMovie = movies[currentIndex];
  const imageUrl = currentMovie.poster || currentMovie.imageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&h=600&fit=crop';

  return (
    <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden bg-background">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover transition-all duration-700 ease-in-out"
          style={{ 
            backgroundImage: `url(${imageUrl})`,
            backgroundPosition: '60% top',
            transform: `scale(${currentIndex === movies.findIndex(m => m.id === currentMovie.id) ? 1.05 : 1})`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-2xl animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/20 backdrop-blur-sm rounded-full text-sm font-semibold text-primary border border-primary/30">
              #{currentIndex + 1} Top Rated
            </span>
            {currentMovie.genre && (
              <span className="px-3 py-1 bg-secondary/80 backdrop-blur-sm rounded-full text-sm">
                {currentMovie.genre}
              </span>
            )}
          </div>

          <h1 
            className="text-5xl md:text-7xl font-bold mb-4 text-foreground drop-shadow-lg animate-scale-in"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {currentMovie.title}
          </h1>

          <div className="flex flex-col gap-3 mb-6 animate-fade-in">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 text-accent fill-accent" />
              <span className="text-2xl font-bold text-accent">{currentMovie.rating}</span>
            </div>
            <div className="flex items-center gap-3 text-lg text-muted-foreground">
              <span>{currentMovie.year}</span>
              {currentMovie.director && (
                <>
                  <span>•</span>
                  <span>Directed by {currentMovie.director}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <Button 
              size="lg" 
              className="gap-2 cinema-glow text-lg px-8"
              onClick={() => onMovieClick?.(currentMovie.id)}
            >
              <Play className="h-5 w-5" />
              View Details
            </Button>
          </div>
        </div>
      </div>

      {/* Dots Navigation */}
      {movies.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {movies.map((movie, index) => (
            <button
              key={movie.id}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "w-12 bg-primary" 
                  : "w-2 bg-muted-foreground/50 hover:bg-muted-foreground"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};