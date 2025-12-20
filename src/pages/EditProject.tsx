import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, UserPlus, Clock, MapPin, IndianRupee as Rupee, User, Phone, Mail, AlertCircle, Save, Plus, X, ExternalLink, Compass, Home, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useDesignerProfile } from '../hooks/useDesignerProfile';
import type { Customer } from '../lib/supabase';
import VastuAnalysisModal from '../components/VastuAnalysisModal';
import ImageUploader from '../components/ImageUploader';

const EditProject = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { designer, isDesigner, loading: designerLoading } = useDesignerProfile();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [project, setProject] = useState<Customer | null>(null);
  const [showVastuModal, setShowVastuModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    project_name: '',
    property_type: '',
    project_area: '',
    budget_range: '',
    timeline: '',
    requirements: '',
    preferred_designer: '',
    layout_image_url: '',
    inspiration_links: [''],
    room_types: [''],
    special_requirements: ''
  });

  const propertyTypes = [
    '1 BHK Apartment',
    '2 BHK Apartment', 
    '3 BHK Apartment',
    '4+ BHK Apartment',
    'Villa/Independent House',
    'Duplex',
    'Penthouse',
    'Studio Apartment',
    'Commercial Space',
    'Office'
  ];

  const budgetRanges = [
    'Under ₹2 Lakhs',
    '₹2-5 Lakhs',
    '₹5-10 Lakhs',
    '₹10-20 Lakhs',
    '₹20-50 Lakhs',
    'Above ₹50 Lakhs'
  ];

  const timelines = [
    '1-2 months',
    '2-3 months',
    '3-6 months',
    '6-12 months',
    'More than 1 year',
    'Flexible'
  ];

  const roomTypes = [
    'Living Room',
    'Bedroom',
    'Kitchen',
    'Dining Room',
    'Bathroom',
    'Study Room',
    'Balcony',
    'Pooja Room',
    'Guest Room',
    'Kids Room'
  ];

  const locations = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik'
  ];

  useEffect(() => {
    // Wait for both auth and designer loading to complete
    if (authLoading || designerLoading) return;
    
    if (!user) {
      navigate('/');
      return;
    }
    
    if (!id) {
      navigate(isDesigner ? '/customer-projects' : '/my-projects');
      return;
    }
    
    fetchProject();
  }, [user, authLoading, designerLoading, id, navigate, isDesigner]);

  const fetchProject = async () => {
    if (!user || !id) return;

    try {
      setFetchLoading(true);
      setError(null);

      console.log('Fetching project with ID:', id);
      console.log('User info:', { userId: user.id, isDesigner, designerId: designer?.id });

      // Build the query - RLS policies will handle access control
      const query = supabase
        .from('customers')
        .select('*')
        .eq('id', id);

      // The RLS policies will automatically filter based on:
      // 1. user_id = uid() for customers
      // 2. assigned_designer_id matching the designer's ID for designers
      // So we don't need to add additional filters here

      const { data, error } = await query.maybeSingle();

      console.log('Query result:', { data, error });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Project not found or you do not have access to this project');
      }

      // Check if customer is trying to edit a project with an accepted quote
      if (!isDesigner && data.user_id === user.id) {
        const { data: acceptedQuote, error: quoteError } = await supabase
          .from('designer_quotes')
          .select('id, quote_number, customer_accepted')
          .eq('project_id', id)
          .eq('customer_accepted', true)
          .eq('status', 'accepted')
          .maybeSingle();

        if (quoteError) {
          console.error('Error checking quote:', quoteError);
        }

        if (acceptedQuote) {
          throw new Error('This project cannot be edited because a quote has been accepted. Please contact your assigned designer for any changes.');
        }
      }

      setProject(data);
      
      // Populate form with project data
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        project_name: data.project_name || '',
        property_type: data.property_type || '',
        project_area: data.project_area || '',
        budget_range: data.budget_range || '',
        timeline: data.timeline || '',
        requirements: data.requirements || '',
        preferred_designer: data.preferred_designer || '',
        layout_image_url: data.layout_image_url || '',
        inspiration_links: data.inspiration_links && data.inspiration_links.length > 0 ? data.inspiration_links : [''],
        room_types: data.room_types && data.room_types.length > 0 ? data.room_types : [''],
        special_requirements: data.special_requirements || ''
      });
    } catch (error: any) {
      console.error('Error fetching project:', error);
      setError(error.message || 'Failed to load project');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleArrayChange = (field: 'inspiration_links' | 'room_types', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field: 'inspiration_links' | 'room_types') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field: 'inspiration_links' | 'room_types', index: number) => {
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
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.location) {
      setError('Location is required');
      return false;
    }
    if (!formData.project_name.trim()) {
      setError('Project name is required');
      return false;
    }
    if (!formData.property_type) {
      setError('Property type is required');
      return false;
    }
    if (!formData.budget_range) {
      setError('Budget range is required');
      return false;
    }
    if (!formData.timeline) {
      setError('Timeline is required');
      return false;
    }
    if (!formData.requirements.trim()) {
      setError('Project requirements are required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project) return;

    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Double-check quote acceptance status before saving (for customers)
    if (!isDesigner && project.user_id === user.id) {
      const { data: acceptedQuote } = await supabase
        .from('designer_quotes')
        .select('id')
        .eq('project_id', project.id)
        .eq('customer_accepted', true)
        .eq('status', 'accepted')
        .maybeSingle();

      if (acceptedQuote) {
        setError('This project cannot be edited because a quote has been accepted. Please contact your assigned designer for any changes.');
        return;
      }
    }

    setLoading(true);

    try {
      // Filter out empty strings from arrays
      const cleanedData = {
        ...formData,
        inspiration_links: formData.inspiration_links.filter(link => link.trim() !== ''),
        room_types: formData.room_types.filter(room => room.trim() !== ''),
        last_modified_by: user.id,
        version: (project.version || 1) + 1
      };

      console.log('Updating project with data:', cleanedData);

      // Build the update query - RLS policies will handle access control
      const query = supabase
        .from('customers')
        .update(cleanedData)
        .eq('id', project.id);

      // The RLS policies will automatically ensure only authorized users can update
      // No need for additional filters here

      const { error } = await query;

      if (error) throw error;

      setSuccess('Project updated successfully!');
      
      // Navigate back to appropriate page after a short delay
      setTimeout(() => {
        if (isDesigner) {
          navigate('/customer-projects');
        } else {
          navigate('/my-projects');
        }
      }, 1500);
    } catch (error: any) {
      console.error('Error updating project:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auth or designer data is being determined
  if (authLoading || designerLoading || fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Loading user information...' : 
             designerLoading ? 'Loading designer profile...' :
             'Loading project details...'}
          </p>
        </div>
      </div>
    );
  }

  // If no user after auth loading is complete, show sign-in message
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-800 mb-4">Please sign in to edit your project</h2>
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

  // If error loading project
  if (error && !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-secondary-800 mb-4">Project Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate(isDesigner ? '/customer-projects' : '/my-projects')}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Back to Projects
            </button>
            <button
              onClick={fetchProject}
              className="flex-1 btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const backUrl = isDesigner ? '/customer-projects' : '/my-projects';
  const pageTitle = isDesigner ? 'Edit Customer Project' : 'Edit Project Details';
  const pageDescription = isDesigner ? 
    'Update project information and collaborate with the customer' :
    'Update your project information and requirements';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <button
              onClick={() => navigate(backUrl)}
              className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </button>
            <h1 className="text-3xl font-bold text-secondary-800 mb-4">
              {pageTitle}
            </h1>
            <p className="text-lg text-gray-600">
              {pageDescription}
            </p>
            {isDesigner && (
              <div className="mt-2 text-sm text-blue-600 bg-blue-50 rounded-lg p-3">
                You are editing this project as the assigned designer. Changes will be tracked in the project activity log.
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
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
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-secondary-800 mb-4">Personal Information</h2>
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
                      disabled={isDesigner} // Designers can't edit customer personal info
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
                      className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                      disabled={isDesigner} // Designers can't edit customer personal info
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
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
                      required
                      disabled={isDesigner} // Designers can't edit customer personal info
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

            {/* Project Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-secondary-800 mb-4">Project Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="project_name"
                      value={formData.project_name}
                      onChange={handleInputChange}
                      className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., My Dream Home, Office Renovation"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type *
                  </label>
                  <select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select property type</option>
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Area (sq ft)
                  </label>
                  <input
                    type="text"
                    name="project_area"
                    value={formData.project_area}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., 1200 sq ft"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range *
                  </label>
                  <select
                    name="budget_range"
                    value={formData.budget_range}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select budget range</option>
                    {budgetRanges.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeline *
                  </label>
                  <select
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select timeline</option>
                    {timelines.map(timeline => (
                      <option key={timeline} value={timeline}>{timeline}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Designer
                  </label>
                  <input
                    type="text"
                    name="preferred_designer"
                    value={formData.preferred_designer}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Designer name from our platform (optional)"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Requirements *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleInputChange}
                    rows={4}
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Describe your vision, style preferences, specific needs, and any other requirements..."
                    required
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requirements
                </label>
                <textarea
                  name="special_requirements"
                  value={formData.special_requirements}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Any accessibility needs, pet considerations, storage requirements, etc."
                />
              </div>
            </div>

            {/* Home Layout Image */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-secondary-800 mb-4">Home Layout</h2>
              <div>
                <ImageUploader
                  onImageUploaded={(url) => setFormData(prev => ({ ...prev, layout_image_url: url }))}
                  existingImageUrl={formData.layout_image_url}
                  label="2D Home Layout Image"
                  helpText="Upload your floor plan to help designers understand your space better. You can also run a Vastu analysis on your layout."
                />
                
                {formData.layout_image_url && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowVastuModal(true)}
                      className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <Compass className="w-4 h-4" />
                     <span>Run Vastu Analysis on Layout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Rooms to Design */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-secondary-800 mb-4">Rooms to Design</h2>
              {formData.room_types.map((room, index) => (
                <div key={index} className="flex items-center space-x-2 mb-3">
                  <select
                    value={room}
                    onChange={(e) => handleArrayChange('room_types', index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select room type</option>
                    {roomTypes.map(roomType => (
                      <option key={roomType} value={roomType}>{roomType}</option>
                    ))}
                  </select>
                  {formData.room_types.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayField('room_types', index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField('room_types')}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Room</span>
              </button>
            </div>

            {/* Inspiration Links */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-secondary-800 mb-4">Design Inspiration</h2>
              <p className="text-gray-600 mb-4">
                Share links to designs you love from Instagram, Pinterest, or other platforms
              </p>
              {formData.inspiration_links.map((link, index) => (
                <div key={index} className="flex items-center space-x-2 mb-3">
                  <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => handleArrayChange('inspiration_links', index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://instagram.com/p/example or https://pinterest.com/pin/example"
                  />
                  {formData.inspiration_links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayField('inspiration_links', index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField('inspiration_links')}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Inspiration Link</span>
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => navigate(backUrl)}
                className="px-8 py-3 text-lg border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-12 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>
                  {loading ? 'Updating Project...' : 'Update Project'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Vastu Analysis Modal */}
      <VastuAnalysisModal
        isOpen={showVastuModal}
        onClose={() => setShowVastuModal(false)}
        projectId={project?.id}
        existingLayoutUrl={formData.layout_image_url || undefined}
      />
    </div>
  );
};

export default EditProject;