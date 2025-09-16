import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Trophy, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroMapImage from "@/assets/hero-map.jpg";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/40 to-accent/20" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255,165,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,165,0,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }}
      />
      
      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-primary/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto text-center animate-fade-in">
        <Badge variant="secondary" className="mb-4 sm:mb-6 bg-primary/20 text-primary border-primary/30">
          <Zap className="w-4 h-4 mr-2" />
          GPS Territory Wars
        </Badge>
        
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 text-foreground leading-tight">
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
            Route Wars
          </span>
        </h1>
        
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed px-4">
          Turn your world into a battlefield. Complete GPS routes to claim territory, 
          defend your zones, and dominate the map in the ultimate fitness strategy game.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 px-4">
          <Button size="lg" className="bg-gradient-hero hover:shadow-glow text-lg px-6 sm:px-8 py-4 w-full sm:w-auto" asChild>
            <Link to="/territory">
              <MapPin className="w-5 h-5 mr-2" />
              View Territory Map
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10 text-lg px-6 sm:px-8 py-4 w-full sm:w-auto" asChild>
            <Link to="/leaderboard">
              <Trophy className="w-5 h-5 mr-2" />
              View Leaderboard
            </Link>
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto px-4">
          <div className="bg-card/20 backdrop-blur border border-border/30 rounded-lg p-4 sm:p-6 hover:shadow-glow transition-all duration-300 hover-scale">
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">50,000+</div>
            <div className="text-sm sm:text-base text-muted-foreground">Territories Claimed</div>
          </div>
          <div className="bg-card/20 backdrop-blur border border-border/30 rounded-lg p-4 sm:p-6 hover:shadow-glow transition-all duration-300 hover-scale">
            <div className="text-2xl sm:text-3xl font-bold text-accent mb-2">25,000+</div>
            <div className="text-sm sm:text-base text-muted-foreground">Active Warriors</div>
          </div>
          <div className="bg-card/20 backdrop-blur border border-border/30 rounded-lg p-4 sm:p-6 hover:shadow-glow transition-all duration-300 hover-scale">
            <div className="text-2xl sm:text-3xl font-bold text-secondary mb-2">1M+</div>
            <div className="text-sm sm:text-base text-muted-foreground">Routes Completed</div>
          </div>
        </div>
      </div>
    </section>
  );
}