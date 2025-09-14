import { useEffect } from "react";
import HeroSection from "@/components/hero-section";
import FeaturesSection from "@/components/features-section";
import MapPreview from "@/components/map-preview";

const Index = () => {
  useEffect(() => {
    // Set page title and meta description for SEO
    document.title = "Route Wars - GPS Territory Conquest Game";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Complete GPS routes to claim territory in the ultimate fitness strategy game. Conquer zones, defend your domain, and dominate the map in Route Wars.');
    }
  }, []);

  return (
    <>
      <header>
        <h1 className="sr-only">Route Wars - GPS Territory Conquest Game</h1>
      </header>
      
      <main>
        <HeroSection />
        <FeaturesSection />
        <MapPreview />
        
        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-background/90" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Ready to Claim Your Territory?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Route Wars combines fitness tracking with strategic gameplay. Every step counts in building your empire.
            </p>
            <div className="bg-card/20 backdrop-blur border border-border/30 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-4">Backend Features Require Supabase</h3>
              <p className="text-sm text-muted-foreground mb-4">
                GPS tracking, user accounts, territory storage, and real-time updates need a backend database.
              </p>
              <p className="text-sm font-medium text-primary">
                Connect to Supabase to unlock the full Route Wars experience!
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Index;