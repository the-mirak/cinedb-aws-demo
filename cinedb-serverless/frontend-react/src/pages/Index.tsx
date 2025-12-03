import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MovieSection } from "@/components/MovieSection";

const trendingMovies = [
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

const popularMovies = [
  {
    id: 7,
    title: "Oppenheimer",
    year: "2023",
    rating: 8.6,
    imageUrl: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop",
    genre: "Biography"
  },
  {
    id: 8,
    title: "The Shawshank Redemption",
    year: "1994",
    rating: 9.3,
    imageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop",
    genre: "Drama"
  },
  {
    id: 9,
    title: "Pulp Fiction",
    year: "1994",
    rating: 8.9,
    imageUrl: "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&h=600&fit=crop",
    genre: "Crime"
  },
  {
    id: 10,
    title: "Fight Club",
    year: "1999",
    rating: 8.8,
    imageUrl: "https://images.unsplash.com/photo-1574267432644-f65e9ce5a8f5?w=400&h=600&fit=crop",
    genre: "Drama"
  },
  {
    id: 11,
    title: "The Matrix",
    year: "1999",
    rating: 8.7,
    imageUrl: "https://images.unsplash.com/photo-1549068106-b024baf5062d?w=400&h=600&fit=crop",
    genre: "Sci-Fi"
  },
  {
    id: 12,
    title: "Goodfellas",
    year: "1990",
    rating: 8.7,
    imageUrl: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop",
    genre: "Crime"
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <MovieSection title="Trending Now" movies={trendingMovies} />
        <MovieSection title="Popular Movies" movies={popularMovies} />
      </main>
      <footer className="border-t border-border/40 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 CineDB. Discover your next favorite movie.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
