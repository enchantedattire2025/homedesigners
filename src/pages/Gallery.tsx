import React, { useState, useEffect } from 'react';
import { Search, MapPin, ExternalLink } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface DesignerCard {
  id: string;
  name: string;
  location: string;
  profile_image: string | null;
  instagram_url: string;
  rating: number | null;
  specialization: string | null;
}

const Gallery = () => {
  const [designers, setDesigners] = useState<DesignerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDesigners();
  }, []);

  const fetchDesigners = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('designers')
        .select('id, name, location, profile_image, instagram_url, rating, specialization')
        .not('instagram_url', 'is', null)
        .neq('instagram_url', '')
        .eq('verification_status', 'verified')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setDesigners(data || []);
    } catch (err: any) {
      console.error('Error fetching designers:', err);
      setError(err.message || 'Failed to load designers');
    } finally {
      setLoading(false);
    }
  };

  const filtered = designers.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.location && d.location.toLowerCase().includes(q)) ||
      (d.specialization && d.specialization.toLowerCase().includes(q))
    );
  });

  const getInitials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const gradients = [
    'from-rose-400 to-orange-400',
    'from-pink-500 to-rose-400',
    'from-amber-400 to-orange-500',
    'from-teal-400 to-cyan-500',
    'from-blue-400 to-indigo-500',
    'from-violet-400 to-purple-500',
    'from-emerald-400 to-teal-500',
    'from-orange-400 to-pink-500',
  ];

  const pickGradient = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading Social Wall...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={fetchDesigners} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <span
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 text-white shadow"
                >
                  <FaInstagram style={{ width: '22px', height: '22px' }} />
                </span>
                Social Wall
              </h1>
              <p className="text-gray-500 text-base">
                Follow our designers on Instagram for daily inspiration.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 mb-4">
              <FaInstagram className="text-pink-400" style={{ width: '28px', height: '28px' }} />
            </div>
            <p className="text-gray-500 text-lg">
              {searchQuery ? 'No designers match your search.' : 'No designers have linked their Instagram yet.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-6">{filtered.length} designer{filtered.length !== 1 ? 's' : ''} on Instagram</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((designer) => (
                <a
                  key={designer.id}
                  href={designer.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-gray-100 hover:border-pink-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  {/* Square thumbnail */}
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                    {designer.profile_image ? (
                      <img
                        src={designer.profile_image}
                        alt={designer.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${pickGradient(designer.name)} flex items-center justify-center`}
                      >
                        <span className="text-white text-2xl font-bold select-none">
                          {getInitials(designer.name)}
                        </span>
                      </div>
                    )}
                    {/* Instagram overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="flex items-center gap-1.5 bg-white/90 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow">
                        <ExternalLink className="w-3 h-3" />
                        <span>Open</span>
                      </div>
                    </div>
                    {/* Instagram badge */}
                    <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center shadow-md">
                      <FaInstagram className="text-white" style={{ width: '14px', height: '14px' }} />
                    </div>
                  </div>

                  {/* Designer name */}
                  <div className="w-full text-center">
                    <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                      {designer.name}
                    </p>
                    {designer.location && (
                      <p className="text-xs text-gray-400 truncate flex items-center justify-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        <span>{designer.location}</span>
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-gray-400 mt-10">
              Click any tile to visit the designer's Instagram profile directly.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Gallery;
