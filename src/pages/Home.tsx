import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Award, Users, ArrowRight, Play, Palette, UserPlus, Percent, Clock, Gift, ExternalLink, IndianRupee as Rupee, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserRegistrationStatus } from '../hooks/useUserRegistrationStatus';
import { supabase } from '../lib/supabase';
import VideoModal from '../components/VideoModal';
import AuthModal from '../components/AuthModal';

interface Deal {
  id: string;
  designer_id: string;
  title: string;
  description: string;
  discount_percentage: number;
  original_price: number;
  deal_price: number;
  deal_type: string;
  services_included: string[];
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  is_featured: boolean;
  image_url: string;
  designers?: {
    name: string;
    specialization: string;
    location: string;
    profile_image: string;
    rating: number;
  };
}

const Home = () => {
  const { user } = useAuth();
  const { hasAnyRegistration, loading: registrationLoading } = useUserRegistrationStatus();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [pendingAction, setPendingAction] = useState<'designer' | 'customer' | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [currentDealIndex, setCurrentDealIndex] = useState(0);
  const [featuredDesigners, setFeaturedDesigners] = useState<any[]>([]);

  const designerAds = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID format - same as featured designer
      name: 'Priya Sharma',
      specialization: 'Modern & Contemporary',
      location: 'Mumbai',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
      portfolioImage: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
      offer: {
        title: 'New Year Special',
        discount: '25% OFF',
        description: 'Complete home makeover packages',
        validUntil: '2024-01-31',
        originalPrice: '₹2,00,000',
        discountedPrice: '₹1,50,000'
      },
      rating: 4.9,
      projects: 45,
      badge: 'Premium Designer'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004', // Valid UUID format
      name: 'Vikram Singh',
      specialization: 'Luxury & High-End',
      location: 'Gurgaon',
      image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
      portfolioImage: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800',
      offer: {
        title: 'Luxury Living Sale',
        discount: 'FREE',
        description: '3D visualization with any project above ₹5L',
        validUntil: '2024-02-15',
        originalPrice: '₹50,000',
        discountedPrice: 'FREE'
      },
      rating: 4.7,
      projects: 89,
      badge: 'Top Rated'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005', // Valid UUID format
      name: 'Meera Reddy',
      specialization: 'Eco-Friendly Design',
      location: 'Hyderabad',
      image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400',
      portfolioImage: 'https://images.pexels.com/photos/1571461/pexels-photo-1571461.jpeg?auto=compress&cs=tinysrgb&w=800',
      offer: {
        title: 'Green Home Initiative',
        discount: '30% OFF',
        description: 'Sustainable design consultation',
        validUntil: '2024-02-28',
        originalPrice: '₹75,000',
        discountedPrice: '₹52,500'
      },
      rating: 4.8,
      projects: 28,
      badge: 'Eco Expert'
    }
  ];

  const stats = [
    { icon: Users, label: 'Expert Designers', value: '500+' },
    { icon: Award, label: 'Projects Completed', value: '2,500+' },
    { icon: Star, label: 'Happy Clients', value: '10,000+' },
  ];

  useEffect(() => {
    fetchDeals();
    fetchFeaturedDesigners();
  }, []);

  useEffect(() => {
    if (deals.length > 0) {
      const interval = setInterval(() => {
        setCurrentDealIndex((prevIndex) => (prevIndex + 1) % deals.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [deals]);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('designer_deals')
        .select(`
          *,
          designers (
            name,
            specialization,
            location,
            profile_image,
            rating
          )
        `)
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .lte('valid_from', new Date().toISOString())
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const fetchFeaturedDesigners = async () => {
    try {
      const { data, error } = await supabase
        .from('designers')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .limit(3);

      if (error) throw error;
      setFeaturedDesigners(data || []);
    } catch (error) {
      console.error('Error fetching featured designers:', error);
      setFeaturedDesigners([]);
    }
  };

  const nextDeal = () => {
    setCurrentDealIndex((prevIndex) => (prevIndex + 1) % deals.length);
  };

  const prevDeal = () => {
    setCurrentDealIndex((prevIndex) => (prevIndex - 1 + deals.length) % deals.length);
  };

  const getDaysRemaining = (validUntil: string) => {
    const days = Math.ceil((new Date(validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleDesignerRegistration = () => {
    if (!user) {
      setPendingAction('designer');
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    // User is authenticated, proceed to registration
    window.location.href = '/register-designer';
  };

  const handleCustomerRegistration = () => {
    if (!user) {
      setPendingAction('customer');
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    // User is authenticated, proceed to registration
    window.location.href = '/register-customer';
  };

  const handleContactDesigner = (designerId: string) => {
    if (!user) {
      setPendingAction(null);
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    // User is authenticated, proceed to contact
    window.location.href = `/designers/${designerId}`;
  };

  const handleAuthSuccess = () => {
    // After successful authentication, redirect based on pending action
    if (pendingAction === 'designer') {
      window.location.href = '/register-designer';
    } else if (pendingAction === 'customer') {
      window.location.href = '/register-customer';
    }
    setPendingAction(null);
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    setPendingAction(null);
  };

  // Only show the "Join our community" section if user is not signed in
  // Remove it completely when user is signed in (regardless of registration status)
  const shouldShowJoinCommunity = !user;

  return (
    <div className="gradient-bg">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-secondary-800 mb-6 leading-tight">
                Transform Your
                <span className="block text-primary-500">Dream Home</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Connect with India's most talented interior designers. From traditional elegance to modern sophistication, create spaces that reflect your unique style.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link to="/designers" className="btn-primary text-center">
                  Find Designers
                  <ArrowRight className="inline-block ml-2 w-5 h-5" />
                </Link>
                <button 
                  onClick={() => setShowVideoModal(true)}
                  className="btn-secondary flex items-center justify-center"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Our Story
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Beautiful interior design"
                  className="w-full h-96 object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-secondary-800">4.9/5 Rating</p>
                    <p className="text-sm text-gray-600">From 10,000+ clients</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Options - Only show if user is not logged in */}
      {shouldShowJoinCommunity && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-secondary-800 mb-4">
                Join Our Community
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Whether you're a talented designer or looking to transform your space, we have the perfect platform for you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Designer Registration */}
              <div className="card p-8 text-center group hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Palette className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-secondary-800 mb-4">For Designers</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Showcase your portfolio, connect with clients, and grow your interior design business on India's premier platform.
                </p>
                <ul className="text-left text-gray-600 mb-8 space-y-2">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span>Create stunning portfolio</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span>Get matched with clients</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span>Manage projects efficiently</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span>Build your reputation</span>
                  </li>
                </ul>
                <button 
                  onClick={handleDesignerRegistration}
                  className="btn-primary w-full"
                >
                  Register as Designer
                </button>
              </div>

              {/* Customer Registration */}
              <div className="card p-8 text-center group hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-secondary-800 mb-4">For Homeowners</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Share your vision and get connected with the perfect interior designer to bring your dream home to life.
                </p>
                <ul className="text-left text-gray-600 mb-8 space-y-2">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                    <span>Share your project details</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                    <span>Get matched with designers</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                    <span>Compare proposals</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                    <span>Track project progress</span>
                  </li>
                </ul>
                <button 
                  onClick={handleCustomerRegistration}
                  className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl w-full"
                >
                  Register Your Project
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                    <IconComponent className="w-8 h-8 text-primary-600" />
                  </div>
                  <div className="text-3xl font-bold text-secondary-800 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Designers */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-secondary-800 mb-4">
              Featured Designers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Meet our top-rated interior designers who have transformed thousands of homes across India
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredDesigners.length > 0 ? (
              featuredDesigners.map((designer) => (
                <Link key={designer.id} to={`/designers/${designer.id}`} className="card p-6 group">
                  <div className="relative mb-4">
                    <img
                      src={designer.profile_image || 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={designer.name}
                      className="w-20 h-20 rounded-full object-cover mx-auto"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-primary-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Top Rated
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-secondary-800 mb-2">{designer.name}</h3>
                    <p className="text-primary-600 font-medium mb-2">{designer.specialization}</p>
                    <p className="text-gray-600 mb-3">{designer.experience} years • {designer.location}</p>

                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(Number(designer.rating))
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {Number(designer.rating).toFixed(1)} ({designer.total_reviews} reviews)
                      </span>
                    </div>

                    <div className="text-primary-600 font-medium group-hover:text-primary-700 transition-colors">
                      View Profile →
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">
                Loading featured designers...
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link to="/designers" className="btn-primary">
              View All Designers
            </Link>
          </div>
        </div>
      </section>

      {/* Exclusive Designer Deals Carousel */}
      {deals.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-gray-50 to-sky-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 bg-sky-100 text-sky-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Gift className="w-4 h-4" />
                <span>Limited Time Offers</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Exclusive Designer Deals
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Don't miss out on these amazing offers from our top designers. Transform your space with premium services at unbeatable prices.
              </p>
            </div>

            <div className="relative">
              {deals.length > 1 && (
                <>
                  <button
                    onClick={prevDeal}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
                    aria-label="Previous deal"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                  </button>
                  <button
                    onClick={nextDeal}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
                    aria-label="Next deal"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                  </button>
                </>
              )}

              <div className="overflow-hidden">
                <div
                  className="transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentDealIndex * 100}%)` }}
                >
                  <div className="flex">
                    {deals.map((deal) => {
                      const daysRemaining = getDaysRemaining(deal.valid_until);
                      return (
                        <div key={deal.id} className="w-full flex-shrink-0 px-2">
                          <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 max-w-4xl mx-auto">
                            <div className="grid md:grid-cols-2 gap-0">
                              <div className="relative h-64 md:h-auto">
                                {deal.image_url ? (
                                  <img
                                    src={deal.image_url}
                                    alt={deal.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center">
                                    <Gift className="w-24 h-24 text-sky-400" />
                                  </div>
                                )}
                                <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                                  {deal.discount_percentage}% OFF
                                </div>
                                {deal.is_featured && (
                                  <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-current" />
                                    Featured
                                  </div>
                                )}
                              </div>

                              <div className="p-8">
                                <div className="flex items-center gap-3 mb-4">
                                  {deal.designers && (
                                    <>
                                      <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center overflow-hidden">
                                        {deal.designers.profile_image ? (
                                          <img
                                            src={deal.designers.profile_image}
                                            alt={deal.designers.name}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-sky-700 font-semibold">
                                            {deal.designers.name.charAt(0)}
                                          </span>
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-gray-900">{deal.designers.name}</p>
                                        <p className="text-sm text-gray-600">{deal.designers.specialization}</p>
                                      </div>
                                    </>
                                  )}
                                </div>

                                <span className="inline-block bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-medium mb-3">
                                  {deal.deal_type}
                                </span>

                                <h3 className="text-2xl font-bold text-gray-900 mb-3">{deal.title}</h3>
                                <p className="text-gray-600 mb-6">{deal.description}</p>

                                <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg p-4 mb-6">
                                  <div className="flex items-end justify-between">
                                    <div>
                                      <p className="text-sm text-gray-500 mb-1">Deal Price</p>
                                      <p className="text-3xl font-bold text-sky-600">₹{deal.deal_price.toLocaleString()}</p>
                                      <p className="text-sm text-gray-500 line-through mt-1">₹{deal.original_price.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="flex items-center gap-1 text-orange-600 mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm font-medium">{daysRemaining} days left</span>
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        Until {new Date(deal.valid_until).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {deal.services_included && deal.services_included.length > 0 && (
                                  <div className="mb-6">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Includes:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {deal.services_included.slice(0, 3).map((service, idx) => (
                                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                          {service}
                                        </span>
                                      ))}
                                      {deal.services_included.length > 3 && (
                                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                          +{deal.services_included.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {deals.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {deals.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentDealIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentDealIndex
                          ? 'bg-sky-600 w-8'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to deal ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Video Modal */}
      <VideoModal 
        isOpen={showVideoModal} 
        onClose={() => setShowVideoModal(false)} 
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        mode={authMode}
        onModeChange={setAuthMode}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Home;