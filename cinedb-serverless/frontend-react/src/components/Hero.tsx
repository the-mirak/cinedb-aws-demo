import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-cinema.jpg";

export const Hero = () => {
  return (
    <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl space-y-6 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            The Cinema
            <br />
            <span className="text-primary">Experience</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Discover millions of movies and TV shows. Watch trailers, read reviews, and find your next favorite film.
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="gap-2 hover-lift cinema-glow">
              <Play className="h-5 w-5" />
              Watch Trailer
            </Button>
            <Button size="lg" variant="secondary" className="gap-2 hover-lift">
              <Info className="h-5 w-5" />
              More Info
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
