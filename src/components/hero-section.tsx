import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Trophy, Users, Zap } from "lucide-react";
import heroMapImage from "@/assets/hero-map.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-map">
        <img 
          src={heroMapImage} 
          alt="Route Wars tactical map interface" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background/90" />
      </div>
      
      {/* Animated grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.1)_1px,transparent_1px)] bg-[length:50px_50px] animate-pulse" />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <Badge variant="secondary" className="mb-6 bg-primary/20 text-primary border-primary/30">
          <Zap className="w-4 h-4 mr-2" />
          GPS Territory Wars
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
          Route Wars
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Complete GPS routes to claim territory. Conquer zones, defend your domain, and dominate the map in the ultimate fitness strategy game.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" className="bg-gradient-hero hover:shadow-glow transition-all duration-300">
            <MapPin className="w-5 h-5 mr-2" />
            Start Claiming Territory
          </Button>
          <Button variant="outline" size="lg" className="border-primary/30 hover:bg-primary/10">
            View Leaderboard
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-lg mx-auto mb-3">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-primary">10,847</h3>
            <p className="text-muted-foreground">Territories Claimed</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-territory-contested/20 rounded-lg mx-auto mb-3">
              <Trophy className="w-6 h-6 text-territory-contested" />
            </div>
            <h3 className="text-2xl font-bold text-territory-contested">2,943</h3>
            <p className="text-muted-foreground">Routes Completed</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-territory-neutral/20 rounded-lg mx-auto mb-3">
              <Users className="w-6 h-6 text-territory-neutral" />
            </div>
            <h3 className="text-2xl font-bold text-territory-neutral">15,672</h3>
            <p className="text-muted-foreground">Active Warriors</p>
          </div>
        </div>
      </div>
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-territory-neutral/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    </section>
  );
};

export default HeroSection;