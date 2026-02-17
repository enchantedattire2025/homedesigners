import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Filter, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Designer } from '../lib/supabase';

const Designers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Gurgaon', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur'];
  const specializations = ['Modern & Contemporary', 'Traditional Indian', 'Minimalist Design', 'Luxury & High-End', 'Eco-Friendly Design', 'Industrial & Loft', 'Scandinavian'];
  const experienceRanges = ['0-5 years', '5-10 years', '10+ years'];

  useEffect(() => {
    fetchDesigners();
  }, []);

  const fetchDesigners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('designers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched designers:', data);
      setDesigners(data || []);
    } catch (error: any) {
      console.error('Error fetching designers:', error);
      setError(error.message || 'Failed to load designers');
    } finally {
      setLoading(false);
    }
  };

  const filteredDesigners = designers.filter(designer => {
    // Search filter
    const matchesSearch = !searchTerm || 
      designer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      designer.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      designer.location.toLowerCase().includes(searchTerm.toLowerCase());

    // City filter
    const matchesCity = !selectedCity || designer.location === selectedCity;

    // Specialization filter
    const matchesSpecialization = !selectedSpecialization || designer.specialization === selectedSpecialization;

    // Experience filter - fixed logic
    const matchesExperience = !selectedExperience || (() => {
      const experience = designer.experience;
      switch (selectedExperience) {
        case '0-5 years':
          return experience >= 0 && experience <= 5;
        case '5-10 years':
          return experience > 5 && experience <= 10;
        case '10+ years':
          return experience > 10;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesCity && matchesSpecialization && matchesExperience;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading designers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg mb-4">
            <p className="font-medium">Error loading designers</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={fetchDesigners}
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
          <h1 className="text-3xl lg:text-4xl font-bold text-secondary-800 mb-4">
            Interior Designers
          </h1>
          <p className="text-lg text-gray-600">
            Discover talented interior designers across India. Find the perfect match for your project.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <div className="flex items-center space-x-2 mb-6">
                <Filter className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-secondary-800">Filters</h2>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Designer name or style..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* City Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Specialization Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* Experience Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                <select
                  value={selectedExperience}
                  onChange={(e) => setSelectedExperience(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Experience Levels</option>
                  {experienceRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCity('');
                  setSelectedSpecialization('');
                  setSelectedExperience('');
                }}
                className="w-full text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Designers Grid */}
          <div className="lg:w-3/4">
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                Showing {filteredDesigners.length} of {designers.length} designers
              </p>
            </div>

            {designers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">
                  No designers found in the database.
                </p>
                <p className="text-gray-400 text-sm">
                  Please check back later or contact support.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDesigners.map((designer) => (
                  <div key={designer.id} className="card overflow-hidden">
                    <div className="flex">
                      <div className="w-1/3">
                        <img
                          src={designer.profile_image || 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400'}
                          alt={`${designer.name}'s profile`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="w-2/3 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {designer.profile_image ? (
                              <img
                                src={designer.profile_image}
                                alt={designer.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {designer.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div>
                              <h3 className="text-lg font-semibold text-secondary-800">
                                {designer.name}
                              </h3>
                              <p className="text-primary-600 font-medium text-sm">
                                {designer.specialization}
                              </p>
                            </div>
                          </div>
                          {designer.is_verified && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              Verified
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {designer.bio || 'Professional interior designer with expertise in creating beautiful spaces.'}
                        </p>

                        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{designer.location}</span>
                          </div>
                          <span>•</span>
                          <span>{designer.experience} years exp</span>
                          <span>•</span>
                          <span>{designer.total_projects} projects</span>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(designer.rating)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">
                              {designer.rating.toFixed(1)} ({designer.total_reviews})
                            </span>
                          </div>
                          {designer.starting_price && (
                            <div className="text-lg font-semibold text-secondary-800">
                              {designer.starting_price}
                            </div>
                          )}
                        </div>

                        <Link
                          to={`/designers/${designer.id}`}
                          className="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center py-2 rounded-lg font-medium transition-colors"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredDesigners.length === 0 && designers.length > 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No designers found matching your criteria. Try adjusting your filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Designers;