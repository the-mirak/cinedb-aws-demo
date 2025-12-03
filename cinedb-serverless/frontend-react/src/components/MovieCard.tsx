import { Star, Play } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MovieCardProps {
  title: string;
  year: string | number | null;
  rating: number | null;
  imageUrl?: string;
  poster?: string;
  genre?: string;
  synopsis?: string;
  onClick?: () => void;
}

export const MovieCard = ({ title, year, rating, imageUrl, poster, genre, synopsis, onClick }: MovieCardProps) => {
  // Use poster field from your backend, fallback to imageUrl
  const posterUrl = poster || imageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop';
  
  return (
    <Card onClick={onClick} className="group relative overflow-hidden border-border/50 hover-lift cursor-pointer">
      <div className="aspect-[2/3] relative overflow-hidden">
        <img 
          src={posterUrl} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/90 backdrop-blur-sm rounded-full p-4 transform scale-0 group-hover:scale-100 transition-transform duration-300">
              <Play className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
        </div>
        {rating && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
            <Star className="h-3 w-3 text-accent fill-accent" />
            <span className="text-xs font-semibold">{rating}</span>
          </div>
        )}
      </div>
      <div className="p-4 space-y-1">
        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
          {title}
        </h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{year || 'N/A'}</span>
          {genre && <span className="px-2 py-0.5 bg-secondary rounded-full">{genre}</span>}
        </div>
      </div>
    </Card>
  );
};
