import { useEffect } from "react";
import HeroSection from "@/components/features/landing/HeroSection";
import FeaturesSection from "@/components/features/landing/FeaturesSection";
import MapPreview from "@/components/features/landing/MapPreview";

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
        
        {/* CTA Section - removed Supabase mention to reflect real backend */}
      </main>
    </>
  );
};

export default Index;