import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Header } from '@/components/Header';
import { MovieCarousel } from '@/components/MovieCarousel';
import { MovieSection } from '@/components/MovieSection';
import { Button } from '@/components/ui/button';
import { movieApi } from '@/services/api.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MovieDetailModal } from '@/components/MovieDetailModal';

const Movies = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovieId, setSelectedMovieId] = useState<string | number | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'year' | 'title'>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const data = await movieApi.getMovies();
      
      // Ensure movies is always an array
      const moviesList = Array.isArray(data?.movies) 
        ? data.movies 
        : Array.isArray(data) 
        ? data 
        : mockMovies;
        
      setMovies(moviesList);
    } catch (error: any) {
      console.error('Error loading movies:', error);
      toast.error('Failed to load movies');
      // Use fallback mock data if API fails
      setMovies(mockMovies);
    } finally {
      setLoading(false);
    }
  };

  // Mock data as fallback
  const mockMovies = [
    {
      id: 1,
      title: "Inception",
      year: "2010",
      rating: 8.8,
      imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
      genre: "Sci-Fi"
    },
    {
      id: 2,
      title: "The Dark Knight",
      year: "2008",
      rating: 9.0,
      imageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop",
      genre: "Action"
    },
    {
      id: 3,
      title: "Interstellar",
      year: "2014",
      rating: 8.6,
      imageUrl: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=600&fit=crop",
      genre: "Sci-Fi"
    },
    {
      id: 4,
      title: "Parasite",
      year: "2019",
      rating: 8.5,
      imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop",
      genre: "Thriller"
    },
    {
      id: 5,
      title: "Dune",
      year: "2021",
      rating: 8.0,
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
      genre: "Sci-Fi"
    },
    {
      id: 6,
      title: "Everything Everywhere",
      year: "2022",
      rating: 8.4,
      imageUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop",
      genre: "Drama"
    }
  ];

  const displayMovies = movies.length > 0 ? movies : mockMovies;

  // Get top 3 movies by rating for carousel
  const topMovies = [...displayMovies]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);

  // Sort movies
  const sortedMovies = [...displayMovies].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'rating':
        comparison = (a.rating || 0) - (b.rating || 0);
        break;
      case 'year':
        const yearA = typeof a.year === 'string' ? parseInt(a.year) : a.year || 0;
        const yearB = typeof b.year === 'string' ? parseInt(b.year) : b.year || 0;
        comparison = yearA - yearB;
        break;
      case 'title':
        comparison = (a.title || '').localeCompare(b.title || '');
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSortChange = (newSortBy: 'rating' | 'year' | 'title') => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {!loading && <MovieCarousel movies={topMovies} onMovieClick={(movieId) => setSelectedMovieId(movieId)} />}
        
        {user && (
          <div className="container mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-4">
            <Button 
              onClick={() => navigate('/add-movie')}
              className="gap-2 cinema-glow"
            >
              <Plus className="h-4 w-4" />
              Add Movie
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
              <Button
                variant={sortBy === 'rating' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('rating')}
                className="gap-2"
              >
                Rating
                {sortBy === 'rating' && (
                  sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant={sortBy === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('year')}
                className="gap-2"
              >
                Year
                {sortBy === 'year' && (
                  sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant={sortBy === 'title' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('title')}
                className="gap-2"
              >
                Name
                {sortBy === 'title' && (
                  sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )}

        {!user && displayMovies.length > 0 && (
          <div className="container mx-auto px-4 pt-6 pb-2">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
              <Button
                variant={sortBy === 'rating' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('rating')}
                className="gap-2"
              >
                Rating
                {sortBy === 'rating' && (
                  sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant={sortBy === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('year')}
                className="gap-2"
              >
                Year
                {sortBy === 'year' && (
                  sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant={sortBy === 'title' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('title')}
                className="gap-2"
              >
                Name
                {sortBy === 'title' && (
                  sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-secondary/50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <MovieSection 
            title="All Movies" 
            movies={sortedMovies}
            onMovieClick={(movieId) => setSelectedMovieId(movieId)}
          />
        )}
      </main>
      
      {selectedMovieId && (
        <MovieDetailModal
          movieId={selectedMovieId}
          isOpen={!!selectedMovieId}
          onClose={() => setSelectedMovieId(null)}
          onUpdate={loadMovies}
        />
      )}
      
      <footer className="border-t border-border/40 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 CineDB. Discover your next favorite show.</p>
        </div>
      </footer>
    </div>
  );
};

export default Movies;
