import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Edit, Plus } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MovieDetailModal } from '@/components/MovieDetailModal';
import { useAuth } from '@/contexts/AuthContext';
import { movieApi, ApiError } from '@/services/api.service';
import { toast } from 'sonner';

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteMovieId, setDeleteMovieId] = useState<string | null>(null);
  const [editMovieId, setEditMovieId] = useState<string | number | null>(null);

  // Redirect if not logged in
  if (!user) {
    navigate('/auth');
    return null;
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const moviesData = await movieApi.getMovies().catch(() => ({ movies: [] }));

      // Ensure movies is always an array
      const moviesList = Array.isArray(moviesData?.movies) 
        ? moviesData.movies 
        : Array.isArray(moviesData) 
        ? moviesData 
        : mockMovies;

      setMovies(moviesList);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load data');
      setMovies(mockMovies);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteMovieId) return;

    try {
      await movieApi.deleteMovie(deleteMovieId);
      toast.success('Movie deleted successfully');
      setMovies(movies.filter((m) => m.id !== deleteMovieId));
      setDeleteMovieId(null);
    } catch (error: any) {
      console.error('Error deleting movie:', error);
      if (error instanceof ApiError && error.statusCode === 401) {
        toast.error('Unauthorized: Please sign in with a valid account to delete movies');
      } else {
        toast.error(error instanceof ApiError ? error.message : 'Failed to delete movie');
      }
    }
  };

  // Mock data
  const mockMovies = [
    { id: '1', title: 'Inception', year: '2010', genre: 'Sci-Fi', rating: 8.8, createdAt: '2024-01-15' },
    { id: '2', title: 'The Dark Knight', year: '2008', genre: 'Action', rating: 9.0, createdAt: '2024-01-14' },
    { id: '3', title: 'Interstellar', year: '2014', genre: 'Sci-Fi', rating: 8.6, createdAt: '2024-01-13' },
  ];

  

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Movies
          </Button>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Admin Dashboard
          </h1>
        </div>

        {/* Movies Table */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Movie Management</CardTitle>
                <CardDescription>Manage all movies in the database</CardDescription>
              </div>
              <Button onClick={() => navigate('/add-movie')} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Movie
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-secondary/50 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!Array.isArray(movies) || movies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No movies found
                        </TableCell>
                      </TableRow>
                    ) : (
                      movies.map((movie) => (
                        <TableRow key={movie.id}>
                          <TableCell className="font-medium">{movie.title}</TableCell>
                          <TableCell>{movie.year || 'N/A'}</TableCell>
                          <TableCell>
                            {movie.genre ? (
                              <span className="px-2 py-1 bg-secondary rounded-full text-xs">
                                {movie.genre}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">No genre</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="text-accent">★</span>
                              {movie.rating || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {movie.duration ? `${movie.duration} min` : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditMovieId(movie.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteMovieId(movie.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMovieId} onOpenChange={() => setDeleteMovieId(null)}>
        <AlertDialogContent className="bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the movie from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Movie Edit Modal */}
      {editMovieId && (
        <MovieDetailModal
          movieId={editMovieId}
          isOpen={!!editMovieId}
          onClose={() => setEditMovieId(null)}
          onUpdate={loadData}
          startInEditMode={true}
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

export default Admin;
