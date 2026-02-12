import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Briefcase, Globe, IndianRupee, FileText, Award, Plus, X, Upload, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDesignerProfile } from '../hooks/useDesignerProfile';
import { supabase } from '../lib/supabase';
import WelcomeModal from '../components/WelcomeModal';

const DesignerRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { designer, loading: designerLoading, updateDesignerProfile, createDesignerProfile } = useDesignerProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formInitialized, setFormInitialized] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Check if we're in edit mode based on URL
  const isEditMode = location.pathname === '/edit-designer-profile';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    experience: '',
    location: '',
    bio: '',
    website: '',
    starting_price: '',
    profile_image: '',
    services: [''],
    materials_expertise: [''],
    awards: ['']
  });

  const specializations = [
    'Modern & Contemporary',
    'Traditional Indian',
    'Minimalist Design',
    'Luxury & High-End',
    'Eco-Friendly Design',
    'Industrial & Loft',
    'Scandinavian',
    'Mediterranean',
    'Art Deco',
    'Bohemian'
  ];

  const locations = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik'
  ];

  useEffect(() => {
    console.log('DesignerRegistration useEffect triggered', {
      authLoading,
      user: user?.email,
      isEditMode,
      designerLoading,
      designer: designer?.name,
      formInitialized
    });

    // Wait for auth to load
    if (authLoading) {
      console.log('Auth still loading...');
      return;
    }

    // If no user is authenticated, redirect to home
    if (!user) {
      console.log('No user found, redirecting to home');
      navigate('/');
      return;
    }

    console.log('User found:', user.email);

    // Check if user already has a customer profile (conflict)
    const checkForCustomerProfile = async () => {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (customerData) {
        setError('You are already registered as a customer. A user cannot be both a customer and a designer. Please use a different account to register as a designer.');
        return true;
      }
      return false;
    };

    // Only check for conflicts in create mode (not edit mode)
    if (!isEditMode) {
      checkForCustomerProfile().then(hasConflict => {
        if (hasConflict) {
          // User has a customer profile, prevent registration
          console.log('User has customer profile, blocking designer registration');
        }
      });
    }
    
    // Handle edit mode
    if (isEditMode) {
      console.log('Edit mode detected, designer loading:', designerLoading);
      
      // Keep waiting if designer data is still loading
      if (designerLoading) {
        console.log('Designer data still loading...');
        return;
      }
      
      // If designer loading is complete and no designer found, show error
      if (!designerLoading && !designer) {
        console.log('No designer profile found after loading complete');
        setError('No designer profile found. Please register as a designer first.');
        return;
      }
      
      // If we have designer data and form is not initialized, populate the form
      if (designer && !formInitialized) {
        console.log('Populating form with designer data:', designer);
        
        // Clear any existing errors since we found the designer
        setError(null);
        
        setFormData({
          name: designer.name || '',
          email: designer.email || '',
          phone: designer.phone || '',
          specialization: designer.specialization || '',
          experience: designer.experience?.toString() || '',
          location: designer.location || '',
          bio: designer.bio || '',
          website: designer.website || '',
          starting_price: designer.starting_price || '',
          profile_image: designer.profile_image || '',
          services: designer.services && designer.services.length > 0 ? designer.services : [''],
          materials_expertise: designer.materials_expertise && designer.materials_expertise.length > 0 ? designer.materials_expertise : [''],
          awards: designer.awards && designer.awards.length > 0 ? designer.awards : ['']
        });
        setFormInitialized(true);
        console.log('Form initialized with designer data');
      }
    } else {
      // Registration mode - set user data in form only if not initialized
      if (!formInitialized) {
        console.log('Registration mode - setting user data');
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          name: user.user_metadata?.name || ''
        }));
        setFormInitialized(true);
        console.log('Form initialized with user data');
      }
    }
  }, [user, designer, authLoading, designerLoading, navigate, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleArrayChange = (field: 'services' | 'materials_expertise' | 'awards', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field: 'services' | 'materials_expertise' | 'awards') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field: 'services' | 'materials_expertise' | 'awards', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.specialization) {
      setError('Specialization is required');
      return false;
    }
    if (!formData.experience || parseInt(formData.experience) < 0) {
      setError('Valid experience is required');
      return false;
    }
    if (!formData.location) {
      setError('Location is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Filter out empty strings from arrays
      const cleanedData = {
        ...formData,
        experience: parseInt(formData.experience),
        services: formData.services.filter(s => s.trim() !== ''),
        materials_expertise: formData.materials_expertise.filter(m => m.trim() !== ''),
        awards: formData.awards.filter(a => a.trim() !== '')
      };

      console.log('Submitting form data:', cleanedData);

      if (isEditMode && designer) {
        // Update existing designer profile
        console.log('Updating existing designer profile...');
        const result = await updateDesignerProfile(cleanedData);
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        setSuccess('Profile updated successfully!');
        
        // Navigate to profile after a short delay
        setTimeout(() => {
          navigate(`/designers/${designer.id}`);
        }, 1500);
      } else {
        // Create new designer profile
        console.log('Creating new designer profile...');
        const result = await createDesignerProfile(cleanedData);

        if (result.error) {
          throw new Error(result.error);
        }

        setSuccess('Registration submitted successfully! Your profile is pending admin approval. You will be able to login once the admin verifies your profile.');

        // Show welcome modal for new registrations
        setShowWelcomeModal(true);
        
        // Navigate to designers page after welcome modal is closed
        setTimeout(() => {
          if (!showWelcomeModal) {
            navigate('/designers');
          }
        }, 3000);
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeModalClose = () => {
    setShowWelcomeModal(false);
    navigate('/designers');
  };

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  // Show loading while designer data is being loaded in edit mode
  if (isEditMode && designerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-secondary-800 mb-4">Loading Designer Profile</h2>
          <p className="text-gray-600 mb-4">
            Please wait while we fetch your designer profile information.
          </p>
          <div className="bg-gray-100 rounded-full h-3 mb-4">
            <div className="bg-primary-500 h-3 rounded-full animate-pulse w-3/4"></div>
          </div>
          <p className="text-sm text-gray-500 mb-2">
            Retrieving your profile details...
          </p>
          <p className="text-xs text-gray-400">
            We're connecting to our database to load your information
          </p>
        </div>
      </div>
    );
  }

  // Show loading while form is being initialized
  if (!formInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing form...</p>
        </div>
      </div>
    );
  }

  // If no user after auth loading is complete, show sign-in message
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-800 mb-4">
            Please sign in to {isEditMode ? 'edit your profile' : 'register as a designer'}
          </h2>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // If in edit mode but no designer found (and not loading), show error
  if (isEditMode && !designerLoading && !designer && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-secondary-800 mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
            <button
              onClick={() => navigate('/register-designer')}
              className="flex-1 btn-primary"
            >
              Register Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              {isEditMode && designer && (
                <button
                  onClick={() => navigate(`/designers/${designer.id}`)}
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Profile
                </button>
              )}
              <h1 className="text-3xl font-bold text-secondary-800 mb-4">
                {isEditMode ? 'Edit Designer Profile' : 'Register as Interior Designer'}
              </h1>
              <p className="text-lg text-gray-600">
                {isEditMode 
                  ? 'Update your professional information and portfolio details'
                  : 'Join our platform and showcase your interior design expertise to thousands of potential clients'
                }
              </p>
            </div>

            {/* Error/Success Messages - Only show if not in successful edit mode */}
            {error && !(isEditMode && designer && formInitialized) && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-secondary-800 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-100"
                        placeholder="Enter your email"
                        required
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select your city</option>
                        {locations.map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-secondary-800 mb-4">Professional Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization *
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select your specialization</option>
                        {specializations.map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., 5"
                      min="0"
                      max="50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Starting Price
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="starting_price"
                        value={formData.starting_price}
                        onChange={handleInputChange}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="₹50,000"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Image URL
                    </label>
                    <div className="relative">
                      <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        name="profile_image"
                        value={formData.profile_image}
                        onChange={handleInputChange}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://example.com/your-photo.jpg"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Upload your professional photo to a cloud service and paste the URL here.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio / About Yourself
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Tell potential clients about your design philosophy, experience, and what makes you unique..."
                    />
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-secondary-800 mb-4">Services Offered</h2>
                {formData.services.map((service, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-3">
                    <input
                      type="text"
                      value={service}
                      onChange={(e) => handleArrayChange('services', index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., 3D Visualization, Space Planning"
                    />
                    {formData.services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField('services', index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('services')}
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Service</span>
                </button>
              </div>

              {/* Materials Expertise */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-secondary-800 mb-4">Materials Expertise</h2>
                {formData.materials_expertise.map((material, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-3">
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => handleArrayChange('materials_expertise', index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Italian Marble, Teak Wood, Quartz"
                    />
                    {formData.materials_expertise.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField('materials_expertise', index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('materials_expertise')}
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Material</span>
                </button>
              </div>

              {/* Awards */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-secondary-800 mb-4">Awards & Recognition</h2>
                {formData.awards.map((award, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-3">
                    <Award className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={award}
                      onChange={(e) => handleArrayChange('awards', index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Best Residential Design 2023 - Mumbai Design Awards"
                    />
                    {formData.awards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField('awards', index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('awards')}
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Award</span>
                </button>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center space-x-4">
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => navigate(`/designers/${designer?.id}`)}
                    className="px-8 py-3 text-lg border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || !!error}
                  className="btn-primary px-12 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isEditMode ? <Save className="w-5 h-5" /> : null}
                  <span>
                    {loading 
                      ? (isEditMode ? 'Updating Profile...' : 'Registering...') 
                      : (isEditMode ? 'Update Profile' : 'Register as Designer')
                    }
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleWelcomeModalClose}
        userType="designer"
      />
    </>
  );
};

export default DesignerRegistration;