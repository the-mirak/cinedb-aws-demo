import { useEffect, useState } from 'react';
import { X, Star, Calendar, Clock, Edit, Trash2, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
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
import { movieApi, ApiError } from '@/services/api.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';

interface MovieDetailModalProps {
  movieId: string | number;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  startInEditMode?: boolean;
}

interface MovieDetails {
  id: string | number;
  title: string;
  year: number | null;
  duration: number | null;
  synopsis: string;
  rating: number | null;
  poster: string;
  genre?: string;
  director?: string;
  cast?: string[] | string;
}

const editMovieSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  year: z.string().optional().refine((val) => !val || (/^\d{4}$/.test(val) && parseInt(val) >= 1800 && parseInt(val) <= 2100), {
    message: 'Must be a valid year between 1800-2100'
  }),
  duration: z.string().optional().refine((val) => !val || (/^\d+$/.test(val) && parseInt(val) > 0 && parseInt(val) <= 1000), {
    message: 'Duration must be between 1-1000 minutes'
  }),
  rating: z.string().optional().refine((val) => !val || (/^([0-9]|10)(\.\d{1,2})?$/.test(val) && parseFloat(val) >= 0 && parseFloat(val) <= 10), {
    message: 'Rating must be between 0-10'
  }),
  genre: z.array(z.string()).optional(),
  director: z.string().trim().max(100, 'Director name must be less than 100 characters').optional().or(z.literal('')),
  cast: z.string().trim().max(500, 'Cast list must be less than 500 characters').optional().or(z.literal('')),
  synopsis: z.string().trim().max(2000, 'Synopsis must be less than 2000 characters').optional().or(z.literal('')),
});

const genres = [
  'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Fantasy', 'Horror', 'Musical', 'Mystery',
  'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
];

export const MovieDetailModal = ({ movieId, isOpen, onClose, onUpdate, startInEditMode = false }: MovieDetailModalProps) => {
  const { user } = useAuth();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    year: '',
    duration: '',
    synopsis: '',
    rating: '',
    genre: [] as string[],
    director: '',
    cast: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && movieId) {
      loadMovieDetails();
      setIsEditing(startInEditMode);
    }
  }, [isOpen, movieId, startInEditMode]);

  const loadMovieDetails = async () => {
    try {
      setLoading(true);
      const data = await movieApi.getMovie(String(movieId));
      setMovie(data);
      
      // Parse genres from comma-separated string to array
      const genreArray = data.genre ? data.genre.split(',').map((g: string) => g.trim()) : [];
      
      setEditForm({
        title: data.title || '',
        year: data.year?.toString() || '',
        duration: data.duration?.toString() || '',
        synopsis: data.synopsis || '',
        rating: data.rating?.toString() || '',
        genre: genreArray,
        director: data.director || '',
        cast: Array.isArray(data.cast) ? data.cast.join(', ') : (data.cast || ''),
      });
    } catch (error) {
      console.error('Error loading movie details:', error);
      toast.error('Failed to load movie details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setPosterFile(null);
    setPosterPreview(null);
    if (movie) {
      const genreArray = movie.genre ? movie.genre.split(',').map((g: string) => g.trim()) : [];
      setEditForm({
        title: movie.title || '',
        year: movie.year?.toString() || '',
        duration: movie.duration?.toString() || '',
        synopsis: movie.synopsis || '',
        rating: movie.rating?.toString() || '',
        genre: genreArray,
        director: movie.director || '',
        cast: Array.isArray(movie.cast) ? movie.cast.join(', ') : (movie.cast || ''),
      });
    }
  };

  const toggleGenre = (genre: string) => {
    const currentGenres = editForm.genre;
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];
    setEditForm({ ...editForm, genre: newGenres });
    if (errors.genre) setErrors({ ...errors, genre: '' });
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image');
        return;
      }

      setPosterFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      setErrors({});

      // Validate form data
      const validated = editMovieSchema.parse(editForm);

      // If poster file exists, use FormData
      if (posterFile) {
        const formData = new FormData();
        formData.append('poster', posterFile);
        formData.append('title', validated.title);
        if (validated.year) formData.append('year', validated.year);
        if (validated.duration) formData.append('duration', validated.duration);
        if (validated.synopsis) formData.append('synopsis', validated.synopsis);
        if (validated.rating) formData.append('rating', validated.rating);
        if (validated.genre && validated.genre.length > 0) formData.append('genre', validated.genre.join(', '));
        if (validated.director) formData.append('director', validated.director);
        if (validated.cast) {
          const castArray = validated.cast.split(',').map(c => c.trim());
          castArray.forEach(actor => formData.append('cast', actor));
        }

        await movieApi.updateMovieWithPoster(String(movieId), formData);
      } else {
        // Standard JSON update
        const updateData = {
          title: validated.title,
          year: validated.year ? parseInt(validated.year) : null,
          duration: validated.duration ? parseInt(validated.duration) : null,
          synopsis: validated.synopsis || null,
          rating: validated.rating ? validated.rating : null,
          genre: validated.genre && validated.genre.length > 0 ? validated.genre.join(', ') : null,
          director: validated.director || null,
          cast: validated.cast ? validated.cast.split(',').map(c => c.trim()) : null,
        };
        
        await movieApi.updateMovie(String(movieId), updateData);
      }
      
      toast.success('Movie updated successfully');
      setIsEditing(false);
      setPosterFile(null);
      setPosterPreview(null);
      await loadMovieDetails();
      onUpdate?.();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error('Please fix the form errors');
      } else if (error instanceof ApiError && error.statusCode === 401) {
        console.error('Error updating movie:', error);
        toast.error('Unauthorized: Please sign in with a valid account to update movies');
      } else {
        console.error('Error updating movie:', error);
        toast.error(error instanceof ApiError ? error.message : 'Failed to update movie');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await movieApi.deleteMovie(String(movieId));
      toast.success('Movie deleted successfully');
      setShowDeleteDialog(false);
      onClose();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error deleting movie:', error);
      if (error instanceof ApiError && error.statusCode === 401) {
        toast.error('Unauthorized: Please sign in with a valid account to delete movies');
      } else {
        toast.error(error instanceof ApiError ? error.message : 'Failed to delete movie');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : movie ? (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="sr-only">
                {isEditing ? 'Edit Movie' : movie?.title || 'Movie Details'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {isEditing ? 'Edit movie information' : 'View detailed information about this movie'}
              </DialogDescription>
              {user && !isEditing && (
                <div className="flex gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </DialogHeader>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-poster">Movie Poster</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                    {posterPreview || movie?.poster ? (
                      <div className="space-y-3">
                        <img 
                          src={posterPreview || movie?.poster || ''} 
                          alt="Poster preview" 
                          className="w-full max-w-[200px] mx-auto rounded-lg"
                        />
                        <div className="flex gap-2 justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('edit-poster')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {posterPreview ? 'Change Poster' : 'Upload New Poster'}
                          </Button>
                          {posterPreview && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPosterFile(null);
                                setPosterPreview(null);
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="edit-poster" className="cursor-pointer block">
                        <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-1">
                          Click to upload new poster
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 5MB
                        </p>
                      </label>
                    )}
                    <Input
                      id="edit-poster"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePosterChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={editForm.title}
                    onChange={(e) => {
                      setEditForm({ ...editForm, title: e.target.value });
                      if (errors.title) setErrors({ ...errors, title: '' });
                    }}
                    required
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="text"
                      value={editForm.year}
                      onChange={(e) => {
                        setEditForm({ ...editForm, year: e.target.value });
                        if (errors.year) setErrors({ ...errors, year: '' });
                      }}
                    />
                    {errors.year && <p className="text-sm text-destructive">{errors.year}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Input
                      id="duration"
                      type="text"
                      value={editForm.duration}
                      onChange={(e) => {
                        setEditForm({ ...editForm, duration: e.target.value });
                        if (errors.duration) setErrors({ ...errors, duration: '' });
                      }}
                    />
                    {errors.duration && <p className="text-sm text-destructive">{errors.duration}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating (0-10)</Label>
                    <Input
                      id="rating"
                      type="text"
                      value={editForm.rating}
                      onChange={(e) => {
                        setEditForm({ ...editForm, rating: e.target.value });
                        if (errors.rating) setErrors({ ...errors, rating: '' });
                      }}
                    />
                    {errors.rating && <p className="text-sm text-destructive">{errors.rating}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genre">Genres</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          disabled={loading}
                        >
                          {editForm.genre.length > 0 
                            ? editForm.genre.join(', ') 
                            : 'Select genres'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-full p-0 pointer-events-auto z-[100]" 
                        align="start"
                        onWheel={(e) => e.stopPropagation()}
                      >
                        <div 
                          className="p-4 space-y-2 max-h-64 overflow-y-auto overscroll-contain"
                          style={{ pointerEvents: 'auto' }}
                        >
                          {genres.map((genre) => (
                            <div key={genre} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-genre-${genre}`}
                                checked={editForm.genre.includes(genre)}
                                onCheckedChange={() => toggleGenre(genre)}
                              />
                              <label
                                htmlFor={`edit-genre-${genre}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {genre}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {errors.genre && <p className="text-sm text-destructive">{errors.genre}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="director">Director</Label>
                  <Input
                    id="director"
                    value={editForm.director}
                    onChange={(e) => {
                      setEditForm({ ...editForm, director: e.target.value });
                      if (errors.director) setErrors({ ...errors, director: '' });
                    }}
                  />
                  {errors.director && <p className="text-sm text-destructive">{errors.director}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cast">Cast (comma-separated)</Label>
                  <Input
                    id="cast"
                    value={editForm.cast}
                    onChange={(e) => {
                      setEditForm({ ...editForm, cast: e.target.value });
                      if (errors.cast) setErrors({ ...errors, cast: '' });
                    }}
                    placeholder="Actor 1, Actor 2, Actor 3"
                  />
                  {errors.cast && <p className="text-sm text-destructive">{errors.cast}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="synopsis">Synopsis</Label>
                  <Textarea
                    id="synopsis"
                    value={editForm.synopsis}
                    onChange={(e) => {
                      setEditForm({ ...editForm, synopsis: e.target.value });
                      if (errors.synopsis) setErrors({ ...errors, synopsis: '' });
                    }}
                    rows={4}
                  />
                  {errors.synopsis && <p className="text-sm text-destructive">{errors.synopsis}</p>}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="default" onClick={handleSaveEdit} disabled={loading}>
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-[300px_1fr] gap-6">
              <div className="aspect-[2/3] relative overflow-hidden rounded-lg">
                <img
                  src={movie.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop'}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{movie.title}</h2>
                  {movie.genre && (
                    <span className="inline-block px-3 py-1 bg-secondary rounded-full text-sm">
                      {movie.genre}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {movie.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-accent fill-accent" />
                      <span className="font-semibold">{movie.rating}</span>
                    </div>
                  )}
                  {movie.year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{movie.year}</span>
                    </div>
                  )}
                  {movie.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{movie.duration} min</span>
                    </div>
                  )}
                </div>

                {movie.director && (
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-muted-foreground">Director</h3>
                    <p className="text-foreground">{movie.director}</p>
                  </div>
                )}

                {movie.cast && (Array.isArray(movie.cast) ? movie.cast.length > 0 : movie.cast) && (
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-muted-foreground">Cast</h3>
                    <p className="text-foreground">
                      {Array.isArray(movie.cast) ? movie.cast.join(', ') : movie.cast}
                    </p>
                  </div>
                )}

                {movie.synopsis && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Synopsis</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {movie.synopsis}
                    </p>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        ) : null}
      </DialogContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the movie
              "{movie?.title}" from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
