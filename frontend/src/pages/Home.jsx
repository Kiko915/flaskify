import { useAuth } from '@/utils/AuthContext';
import HeroSection from '@/components/home/HeroSection';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import DailyFinds from '@/components/home/DailyFinds';
import DailyFindsLoginPrompt from '@/components/home/DailyFindsLoginPrompt';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Banner Carousel */}
      <HeroSection />

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8">
        {/* Categories Grid */}
        <CategoryGrid />

        {/* Featured Products */}
        <FeaturedProducts />

        {/* Daily Finds - Only show if user is logged in */}
        {user ? <DailyFinds /> : <DailyFindsLoginPrompt />}
      </div>
    </div>
  );
}