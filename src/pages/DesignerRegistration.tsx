import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Briefcase, Globe, IndianRupee, FileText, Award, Plus, X, Upload, ArrowLeft, Save, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDesignerProfile } from '../hooks/useDesignerProfile';
import { supabase } from '../lib/supabase';
import WelcomeModal from '../components/WelcomeModal';

const DesignerRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { designer, loading: designerLoading, updateDesignerProfile } = useDesignerProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formInitialized, setFormInitialized] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isEditMode = location.pathname === '/edit-designer-profile';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
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
    if (authLoading) return;

    if (isEditMode) {
      if (!user) {
        navigate('/');
        return;
      }

      if (designerLoading) return;

      if (!designerLoading && !designer) {
        setError('No designer profile found. Please register as a designer first.');
        return;
      }

      if (designer && !formInitialized) {
        setError(null);

        setFormData({
          name: designer.name || '',
          email: designer.email || '',
          password: '',
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
      }
    } else {
      if (!formInitialized) {
        setFormInitialized(true);
      }
    }
  }, [user, designer, authLoading, designerLoading, navigate, isEditMode, formInitialized]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

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

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email address is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return undefined;
  };

  const checkEmailExists = async (email: string) => {
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingCustomer) {
      return { exists: true, type: 'customer' as const };
    }

    const { data: existingDesigner } = await supabase
      .from('designers')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingDesigner) {
      return { exists: true, type: 'designer' as const };
    }

    return { exists: false, type: null };
  };

  const validateForm = async () => {
    if (!formData.name.trim()) {
      setError('Full name is required');
      return false;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setError(emailError);
      return false;
    }

    if (!isEditMode) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        setError(passwordError);
        return false;
      }

      const emailCheck = await checkEmailExists(formData.email);
      if (emailCheck.exists) {
        if (emailCheck.type === 'customer') {
          setError('This email is already registered as a customer. A user cannot be both a customer and a designer. Please use a different email address.');
        } else {
          setError('This email is already registered as a designer. Please use the login option to access your account.');
        }
        return false;
      }
    }

    if (!formData.specialization) {
      setError('Specialization is required');
      return false;
    }
    if (!formData.experience || parseInt(formData.experience) < 0) {
      setError('Valid years of experience is required');
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

    setError(null);
    setSuccess(null);

    if (!(await validateForm())) {
      return;
    }

    setLoading(true);

    try {
      const cleanedData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        specialization: formData.specialization,
        experience: parseInt(formData.experience),
        location: formData.location,
        bio: formData.bio.trim(),
        website: formData.website.trim(),
        starting_price: formData.starting_price.trim(),
        profile_image: formData.profile_image.trim(),
        services: formData.services.filter(s => s.trim() !== ''),
        materials_expertise: formData.materials_expertise.filter(m => m.trim() !== ''),
        awards: formData.awards.filter(a => a.trim() !== '')
      };

      if (isEditMode && designer) {
        const result = await updateDesignerProfile(cleanedData);

        if (result.error) {
          throw new Error(result.error);
        }

        setSuccess('Profile updated successfully!');

        setTimeout(() => {
          navigate(`/designers/${designer.id}`);
        }, 1500);
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanedData.email,
          password: formData.password,
          options: {
            data: {
              name: cleanedData.name,
              registration_type: 'designer',
            }
          }
        });

        if (authError) {
          if (authError.message.includes('User already registered')) {
            throw new Error('An account with this email already exists. Please use the login option.');
          }
          throw new Error(authError.message);
        }

        if (!authData.user) {
          throw new Error('Failed to create user account. Please try again.');
        }

        const { error: designerError } = await supabase
          .from('designers')
          .insert([{
            user_id: authData.user.id,
            name: cleanedData.name,
            email: cleanedData.email,
            phone: cleanedData.phone,
            specialization: cleanedData.specialization,
            experience: cleanedData.experience,
            location: cleanedData.location,
            bio: cleanedData.bio,
            website: cleanedData.website,
            starting_price: cleanedData.starting_price,
            profile_image: cleanedData.profile_image,
            services: cleanedData.services,
            materials_expertise: cleanedData.materials_expertise,
            awards: cleanedData.awards,
            verification_status: 'pending',
            is_verified: false
          }]);

        if (designerError) {
          await supabase.auth.signOut();
          throw new Error(`Failed to create designer profile: ${designerError.message}`);
        }

        setSuccess('Registration submitted successfully! Your profile is pending admin approval. You will be able to login once the admin verifies your profile.');
        setShowWelcomeModal(true);

        await supabase.auth.signOut();

        setTimeout(() => {
          if (!showWelcomeModal) {
            navigate('/');
          }
        }, 5000);
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
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isEditMode && designerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-secondary-800 mb-4">Loading Designer Profile</h2>
          <p className="text-gray-600">Please wait while we fetch your designer profile information.</p>
        </div>
      </div>
    );
  }

  if (!formInitialized && !isEditMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing form...</p>
        </div>
      </div>
    );
  }

  if (isEditMode && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-800 mb-4">
            Please sign in to edit your profile
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

            {error && (
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
                        className={`pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isEditMode ? 'bg-gray-100' : ''}`}
                        placeholder="Enter your email"
                        required
                        disabled={isEditMode}
                      />
                    </div>
                  </div>

                  {!isEditMode && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pl-10 pr-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Enter your password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Password must contain at least 6 characters with uppercase, lowercase, and numbers
                      </p>
                    </div>
                  )}

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

      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleWelcomeModalClose}
        userType="designer"
      />
    </>
  );
};

export default DesignerRegistration;
