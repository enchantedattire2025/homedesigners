import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/AuthModal';

interface Wallpaper {
  id: number;
  title: string;
  imageUrl: string;
  category: string;
}

const SAMPLE_WALLPAPERS: Wallpaper[] = [
  { id: 1, title: "3D Geometric Cube Pattern", imageUrl: "https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Geometric" },
  { id: 2, title: "Luxury Gold 3D Panels", imageUrl: "https://images.pexels.com/photos/3683056/pexels-photo-3683056.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Luxury" },
  { id: 3, title: "3D White Wave Texture", imageUrl: "https://images.pexels.com/photos/1909791/pexels-photo-1909791.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Modern" },
  { id: 4, title: "Natural Stone 3D Wall", imageUrl: "https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Texture" },
  { id: 5, title: "Wooden Panel 3D Design", imageUrl: "https://images.pexels.com/photos/172276/pexels-photo-172276.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Wood" },
  { id: 6, title: "Brick Wall 3D Effect", imageUrl: "https://images.pexels.com/photos/1092364/pexels-photo-1092364.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Industrial" },
  { id: 7, title: "Floral Relief 3D Art", imageUrl: "https://images.pexels.com/photos/1906658/pexels-photo-1906658.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Floral" },
  { id: 8, title: "Mountain Landscape Mural", imageUrl: "https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 9, title: "Abstract 3D Spheres", imageUrl: "https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Abstract" },
  { id: 10, title: "Sunset Beach Panorama", imageUrl: "https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 11, title: "3D Hexagon Pattern", imageUrl: "https://images.pexels.com/photos/1769732/pexels-photo-1769732.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Geometric" },
  { id: 12, title: "Tropical Leaves 3D", imageUrl: "https://images.pexels.com/photos/1448561/pexels-photo-1448561.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 13, title: "Galaxy Space Theme", imageUrl: "https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Space" },
  { id: 14, title: "Marble Texture 3D", imageUrl: "https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Luxury" },
  { id: 15, title: "Rose Gold Wave Design", imageUrl: "https://images.pexels.com/photos/3310691/pexels-photo-3310691.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Luxury" },
  { id: 16, title: "Ocean Wave 3D Art", imageUrl: "https://images.pexels.com/photos/1295138/pexels-photo-1295138.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 17, title: "Cherry Blossom Mural", imageUrl: "https://images.pexels.com/photos/2480072/pexels-photo-2480072.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Floral" },
  { id: 18, title: "Desert Dunes Landscape", imageUrl: "https://images.pexels.com/photos/1433052/pexels-photo-1433052.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 19, title: "Bamboo Forest 3D", imageUrl: "https://images.pexels.com/photos/1179225/pexels-photo-1179225.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 20, title: "Aurora Borealis Mural", imageUrl: "https://images.pexels.com/photos/1933316/pexels-photo-1933316.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 21, title: "Waterfall Paradise 3D", imageUrl: "https://images.pexels.com/photos/1647962/pexels-photo-1647962.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 22, title: "Lavender Field Mural", imageUrl: "https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 23, title: "Starry Night 3D Sky", imageUrl: "https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Space" },
  { id: 24, title: "Abstract Color Splash", imageUrl: "https://images.pexels.com/photos/1187317/pexels-photo-1187317.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Abstract" },
  { id: 25, title: "Winter Forest Panorama", imageUrl: "https://images.pexels.com/photos/235621/pexels-photo-235621.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 26, title: "Peacock Feather 3D Art", imageUrl: "https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Luxury" },
  { id: 27, title: "Autumn Forest Mural", imageUrl: "https://images.pexels.com/photos/1557183/pexels-photo-1557183.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 28, title: "Exposed Brick 3D Wall", imageUrl: "https://images.pexels.com/photos/1092364/pexels-photo-1092364.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Industrial" },
  { id: 29, title: "Underwater Coral Reef", imageUrl: "https://images.pexels.com/photos/920161/pexels-photo-920161.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 30, title: "Abstract Geometric Shapes", imageUrl: "https://images.pexels.com/photos/1010973/pexels-photo-1010973.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Geometric" },
  { id: 31, title: "Minimalist Wave Pattern", imageUrl: "https://images.pexels.com/photos/1631665/pexels-photo-1631665.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Modern" },
  { id: 32, title: "Palm Beach Sunset", imageUrl: "https://images.pexels.com/photos/358482/pexels-photo-358482.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 33, title: "Urban Skyline Night", imageUrl: "https://images.pexels.com/photos/936722/pexels-photo-936722.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Urban" },
  { id: 34, title: "Neon Abstract 3D", imageUrl: "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Modern" },
  { id: 35, title: "Misty Mountain Valley", imageUrl: "https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 36, title: "Zen Stone Garden", imageUrl: "https://images.pexels.com/photos/129731/pexels-photo-129731.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Zen" },
  { id: 37, title: "Lightning Storm Drama", imageUrl: "https://images.pexels.com/photos/1446076/pexels-photo-1446076.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 38, title: "Sunflower Field 3D", imageUrl: "https://images.pexels.com/photos/207518/pexels-photo-207518.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Floral" },
  { id: 39, title: "Crystal Geode Wall Art", imageUrl: "https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Luxury" },
  { id: 40, title: "Foggy Forest Path", imageUrl: "https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 41, title: "Ice Crystal 3D Effect", imageUrl: "https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Abstract" },
  { id: 42, title: "Sand Ripple Texture", imageUrl: "https://images.pexels.com/photos/1619461/pexels-photo-1619461.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Texture" },
  { id: 43, title: "Rose Bloom 3D Relief", imageUrl: "https://images.pexels.com/photos/39517/rose-flower-blossom-bloom-39517.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Floral" },
  { id: 44, title: "Volcanic Rock Texture", imageUrl: "https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Texture" },
  { id: 45, title: "Silk Wave Luxury", imageUrl: "https://images.pexels.com/photos/3310691/pexels-photo-3310691.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Luxury" },
  { id: 46, title: "Jellyfish Ocean Mural", imageUrl: "https://images.pexels.com/photos/2156311/pexels-photo-2156311.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 47, title: "Canyon Red Rock Wall", imageUrl: "https://images.pexels.com/photos/814499/pexels-photo-814499.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 48, title: "Stained Glass 3D Art", imageUrl: "https://images.pexels.com/photos/256381/pexels-photo-256381.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Abstract" },
  { id: 49, title: "Emerald Forest Path", imageUrl: "https://images.pexels.com/photos/1912458/pexels-photo-1912458.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" },
  { id: 50, title: "Golden Cloud Sunset", imageUrl: "https://images.pexels.com/photos/1434580/pexels-photo-1434580.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Nature" }
];

const CATEGORIES = ["All", "Geometric", "Nature", "Luxury", "Modern", "Floral", "Industrial", "Texture", "Abstract", "Wood", "Zen", "Space", "Urban"];

export default function WallpaperGallery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [pendingWallpaper, setPendingWallpaper] = useState<Wallpaper | null>(null);

  const filteredWallpapers = SAMPLE_WALLPAPERS.filter(wallpaper => {
    const matchesSearch = wallpaper.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || wallpaper.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOrderClick = (wallpaper: Wallpaper) => {
    if (!user) {
      setPendingWallpaper(wallpaper);
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    navigate('/wallpaper-order', {
      state: {
        selectedWallpaper: wallpaper
      }
    });
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);

    if (pendingWallpaper) {
      navigate('/wallpaper-order', {
        state: {
          selectedWallpaper: pendingWallpaper
        }
      });
      setPendingWallpaper(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            3D Wallpaper Collection
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your space with our premium 3D wallpapers. Browse our curated collection and order your favorite designs.
          </p>
        </div>

        <div className="mb-8 space-y-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search wallpapers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2.5 rounded-full font-medium transition-all transform hover:scale-105 ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 text-center">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredWallpapers.length}</span> wallpapers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWallpapers.map((wallpaper) => (
            <div
              key={wallpaper.id}
              className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={wallpaper.imageUrl}
                  alt={wallpaper.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute top-3 right-3">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-800 rounded-full">
                    {wallpaper.category}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg line-clamp-2">
                  {wallpaper.title}
                </h3>

                <button
                  onClick={() => handleOrderClick(wallpaper)}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 ${
                    user
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg'
                      : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {user ? (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Order Now
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Please Login
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredWallpapers.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No wallpapers found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingWallpaper(null);
        }}
        mode={authMode}
        onModeChange={setAuthMode}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
