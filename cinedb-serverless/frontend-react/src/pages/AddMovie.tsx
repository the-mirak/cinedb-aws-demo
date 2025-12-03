import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Film, Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { movieApi, ApiError } from '@/services/api.service';
import { toast } from 'sonner';
import { z } from 'zod';

const movieSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  year: z.string().regex(/^\d{4}$/, 'Must be a valid 4-digit year (e.g., 2024)'),
  duration: z.string().optional().refine((val) => !val || (/^\d+$/.test(val) && parseInt(val) > 0 && parseInt(val) <= 1000), {
    message: 'Duration must be between 1-1000 minutes'
  }),
  genre: z.array(z.string()).min(1, 'At least one genre is required'),
  director: z.string().trim().max(100, 'Director name must be less than 100 characters').optional().or(z.literal('')),
  cast: z.string().trim().max(500, 'Cast list must be less than 500 characters').optional().or(z.literal('')),
  rating: z.string().optional().refine((val) => !val || (/^([0-9]|10)(\.\d{1,2})?$/.test(val) && parseFloat(val) >= 0 && parseFloat(val) <= 10), {
    message: 'Rating must be between 0-10 with up to 2 decimal places'
  }),
  description: z.string().trim().max(2000, 'Description must be less than 2000 characters').optional().or(z.literal('')),
});

const AddMovie = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    year: new Date().getFullYear().toString(),
    duration: '',
    genre: [] as string[],
    director: '',
    cast: '',
    rating: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not logged in
  if (!user) {
    navigate('/auth');
    return null;
  }

  const genres = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Fantasy', 'Horror', 'Musical', 'Mystery',
    'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
  ];

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const toggleGenre = (genre: string) => {
    const currentGenres = formData.genre;
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];
    handleInputChange('genre', newGenres);
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
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Validate form
      const validated = movieSchema.parse(formData);

      // Prepare movie data
      const movieData: any = {
        title: validated.title,
        year: parseInt(validated.year),
        duration: validated.duration ? parseInt(validated.duration) : null,
        genre: validated.genre.join(', '),
        director: validated.director || null,
        cast: validated.cast ? validated.cast.split(',').map(c => c.trim()) : null,
        rating: validated.rating ? validated.rating : null,
        synopsis: validated.description || null,
      };

      // If poster exists, convert to base64 or send as FormData
      if (posterFile) {
        const formDataPayload = new FormData();
        formDataPayload.append('poster', posterFile);
        
        // Add all other fields to FormData
        Object.keys(movieData).forEach(key => {
          if (movieData[key] !== null) {
            formDataPayload.append(key, movieData[key].toString());
          }
        });

        // Send as multipart/form-data
        await movieApi.uploadMovie(formDataPayload);
      } else {
        // Send as JSON without poster
        await movieApi.createMovie(movieData);
      }

      toast.success('Movie added successfully!');
      navigate('/');
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
        console.error('Error adding movie:', error);
        toast.error('Unauthorized: Please sign in with a valid account to add movies');
      } else {
        console.error('Error adding movie:', error);
        toast.error(error instanceof ApiError ? error.message : 'Failed to add movie');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Movies
        </Button>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Film className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-3xl">Add New Movie</CardTitle>
                <CardDescription>Fill in the details to add a movie to the database</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter movie title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      type="text"
                      placeholder="2024"
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    {errors.year && <p className="text-sm text-destructive">{errors.year}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="text"
                      placeholder="120"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.duration && <p className="text-sm text-destructive">{errors.duration}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genre">Genres *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          disabled={isLoading}
                        >
                          {formData.genre.length > 0 
                            ? formData.genre.join(', ') 
                            : 'Select genres'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 pointer-events-auto z-50" align="start">
                        <div className="p-4 space-y-2 max-h-64 overflow-y-auto overscroll-contain">
                          {genres.map((genre) => (
                            <div key={genre} className="flex items-center space-x-2">
                              <Checkbox
                                id={`genre-${genre}`}
                                checked={formData.genre.includes(genre)}
                                onCheckedChange={() => toggleGenre(genre)}
                              />
                              <label
                                htmlFor={`genre-${genre}`}
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

                  <div className="space-y-2">
                    <Label htmlFor="director">Director</Label>
                    <Input
                      id="director"
                      placeholder="Director name"
                      value={formData.director}
                      onChange={(e) => handleInputChange('director', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.director && <p className="text-sm text-destructive">{errors.director}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cast">Cast</Label>
                    <Input
                      id="cast"
                      placeholder="Actor 1, Actor 2, Actor 3"
                      value={formData.cast}
                      onChange={(e) => handleInputChange('cast', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.cast && <p className="text-sm text-destructive">{errors.cast}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating (0-10)</Label>
                    <Input
                      id="rating"
                      type="text"
                      placeholder="8.5"
                      value={formData.rating}
                      onChange={(e) => handleInputChange('rating', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.rating && <p className="text-sm text-destructive">{errors.rating}</p>}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="poster">Movie Poster</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                      {posterPreview ? (
                        <div className="space-y-4">
                          <img 
                            src={posterPreview} 
                            alt="Poster preview" 
                            className="w-full max-w-xs mx-auto rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPosterFile(null);
                              setPosterPreview(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label htmlFor="poster" className="cursor-pointer block">
                          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG up to 5MB
                          </p>
                          <Input
                            id="poster"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePosterChange}
                            disabled={isLoading}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter movie description..."
                      rows={8}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      disabled={isLoading}
                      className="resize-none"
                    />
                    {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 cinema-glow"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding Movie...' : 'Add Movie'}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border/40 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 CineDB. Discover your next favorite show.</p>
        </div>
      </footer>
    </div>
  );
};

export default AddMovie;
