import React, { useState, useEffect } from 'react';
import { X, ZoomIn, Heart, Share2, Calendar, MapPin, User, Plus, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useDesignerProfile } from '../hooks/useDesignerProfile';

interface GalleryItem {
  id: string;
  title: string;
  designer: string;
  designerId: string;
  location: string;
  category: string;
  date: string;
  image: string;
  description: string;
  materials?: string[];
  projectId?: string;
  is_approved?: boolean;
}

const Gallery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDesigner, loading: designerLoading } = useDesignerProfile();
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [allGalleryItems, setAllGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const categories = [
    'All', 'Living Room', 'Kitchen', 'Bedroom', 'Dining Room', 'Bathroom',
    'Office', 'Entryway', 'Pooja Room', 'Kids Room', 'Other'
  ];

  useEffect(() => {
    fetchGalleryItems(); // [cite: 14]
  }, []);

  const fetchGalleryItems = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch completed projects with their images and designer info
      const { data: projects, error: projectsError } = await supabase
        .from('customers')
        .select(`
          id,
          project_name,
          location,
          property_type,
          requirements,
          room_types,
          work_end_date,
          designers!customers_assigned_designer_id_fkey(
            id,
            name
          ),
          project_images(
            id,
            image_url,
            caption,
            is_primary,
            display_order
          )
        `)
        .eq('assignment_status', 'completed')
        .order('work_end_date', { ascending: false });

      if (projectsError) throw projectsError;

      // Transform completed projects into gallery items
      const completedProjectItems: GalleryItem[] = (projects || [])
        .filter(project => project.project_images && project.project_images.length > 0)
        .map(project => {
          // Get primary image or first image
          const primaryImage = project.project_images.find((img: any) => img.is_primary) || project.project_images[0];

          // Determine category from room_types or property_type
          let category = 'Other';
          if (project.room_types && project.room_types.length > 0) {
            const roomType = project.room_types[0];
            if (roomType.includes('Living')) category = 'Living Room';
            else if (roomType.includes('Kitchen')) category = 'Kitchen';
            else if (roomType.includes('Bedroom')) category = 'Bedroom';
            else if (roomType.includes('Dining')) category = 'Dining Room';
            else if (roomType.includes('Bathroom')) category = 'Bathroom';
            else if (roomType.includes('Office')) category = 'Office';
            else if (roomType.includes('Pooja')) category = 'Pooja Room';
            else if (roomType.includes('Kids')) category = 'Kids Room';
            else category = roomType;
          }

          return {
            id: project.id,
            title: project.project_name,
            designer: project.designers?.name || 'Unknown Designer',
            designerId: project.designers?.id || '',
            location: project.location,
            category: category,
            date: project.work_end_date
              ? new Date(project.work_end_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : 'Recently',
            image: primaryImage.image_url,
            description: project.requirements || 'Beautifully designed space',
            projectId: project.id,
            is_approved: true
          };
        });

      setAllGalleryItems(completedProjectItems);
    } catch (error: any) {
      console.error('Error fetching gallery items:', error);
      setError(error.message || 'Failed to load gallery items');
      setAllGalleryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = allGalleryItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = !searchQuery || (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.designer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.materials && item.materials.some(material => material.toLowerCase().includes(searchQuery.toLowerCase())))
    );
    return matchesCategory && matchesSearch;
  }); // [cite: 24, 25]

  const shareDesigner = async (item: GalleryItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${item.title} by ${item.designer}`,
          text: `Check out this amazing design project: "${item.title}" by ${item.designer} on TheHomeDesigners!`,
          url: `${window.location.origin}/gallery`
        });
      } catch (error) {
        console.log('Error sharing:', error); // [cite: 27]
      }
    } else {
      // Fallback to copying to clipboard [cite: 28]
      navigator.clipboard.writeText(`${window.location.origin}/gallery`);
      alert('Link copied to clipboard!'); // [cite: 29]
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg mb-4">
            <p className="font-medium">Error loading gallery</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={fetchGalleryItems} // [cite: 31]
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-secondary-800 mb-4">
                Design Gallery
              </h1>
              <p className="text-lg text-gray-600">
                Explore our collection of stunning interior designs. Get inspired by detailed work from across India.
              </p>
            </div>
            {user && isDesigner && ( // [cite: 34]
              <button
                onClick={() => navigate('/share-photo')}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Share Your Photo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Category Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search gallery..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer" // [cite: 40]
              onClick={() => setSelectedImage(item)}
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" // [cite: 41]
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-3 right-3">
                  <span className="bg-primary-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                    {item.category}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-secondary-800 mb-2 group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h3>
                
                <div className="flex items-center space-x-2 mb-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <Link to={`/designers/${item.designerId}`} className="hover:text-primary-600">
                    <span>{item.designer}</span>
                  </Link>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{item.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        
        {filteredItems.length === 0 && ( // [cite: 48]
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No images found in this category.
            </p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-xl overflow-hidden">
            <button
              onClick={() => setSelectedImage(null)} // [cite: 50]
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
              <div className="lg:col-span-2 relative">
                <img
                  src={selectedImage.image}
                  alt={selectedImage.title}
                  className="w-full h-64 lg:h-full object-cover" // [cite: 51]
                />
              </div>

              <div className="p-6 overflow-y-auto">
                <h2 className="text-2xl font-bold text-secondary-800 mb-4">
                  {selectedImage.title}
                </h2>

                <p className="text-gray-600 mb-6">
                  {selectedImage.description}
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-secondary-800">{selectedImage.designer}</p>
                      <p className="text-sm text-gray-600">Interior Designer</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    <span className="text-gray-700">{selectedImage.location}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-primary-600" />
                    <span className="text-gray-700">{selectedImage.date}</span>
                  </div>
                </div>

                {selectedImage.materials && selectedImage.materials.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-secondary-800 mb-3">Materials Used</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedImage.materials.map((material: string, index: number) => (
                        <span key={index} className="bg-accent-100 text-accent-800 px-3 py-1 rounded-full text-sm">
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                    <Heart className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button 
                    onClick={() => shareDesigner(selectedImage)} // [cite: 61]
                    className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;