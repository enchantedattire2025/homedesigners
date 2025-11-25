import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Search, Filter, AlertCircle, CheckCircle, Edit, Package, IndianRupee as Rupee } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDesignerProfile } from '../hooks/useDesignerProfile';
import { supabase } from '../lib/supabase';

interface MaterialPrice {
  id: string;
  designer_id: string;
  category: string;
  name: string;
  description: string;
  unit: string;
  base_price: number;
  discount_price: number | null;
  is_discounted: boolean;
  brand: string;
  quality_grade: 'Budget' | 'Standard' | 'Premium' | 'Luxury';
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

interface NewMaterialPrice {
  category: string;
  name: string;
  description: string;
  unit: string;
  base_price: number;
  discount_price: number | null;
  is_discounted: boolean;
  brand: string;
  quality_grade: 'Budget' | 'Standard' | 'Premium' | 'Luxury';
  is_available: boolean;
}

const DesignerMaterialPricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { designer, isDesigner, loading: designerLoading } = useDesignerProfile();
  
  const [materials, setMaterials] = useState<MaterialPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [formData, setFormData] = useState<NewMaterialPrice>({
    category: '',
    name: '',
    description: '',
    unit: 'sq.ft',
    base_price: '' as any,
    discount_price: null,
    is_discounted: false,
    brand: '',
    quality_grade: 'Standard',
    is_available: true
  });

  const categories = [
    'Plywood & Boards',
    'Hardware',
    'Channels & Profiles',
    'Laminates & Veneers',
    'Countertops',
    'Flooring',
    'Lighting',
    'Paints & Finishes',
    'Fabrics & Upholstery',
    'Accessories'
  ];

  const units = ['sq.ft', 'per piece', 'per meter', 'per kg', 'per liter', 'per roll'];
  const qualityGrades = ['Budget', 'Standard', 'Premium', 'Luxury'];

  useEffect(() => {
    if (!designerLoading && designer) {
      fetchMaterials();
    }
  }, [designer, designerLoading]);

  const fetchMaterials = async () => {
    if (!designer) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('designer_material_prices')
        .select('*')
        .eq('designer_id', designer.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      
      setMaterials(data || []);
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      setError(error.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'base_price' || name === 'discount_price') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? (name === 'discount_price' ? null : 0) : parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      name: '',
      description: '',
      unit: 'sq.ft',
      base_price: 0,
      discount_price: null,
      is_discounted: false,
      brand: '',
      quality_grade: 'Standard',
      is_available: true
    });
    setEditingId(null);
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designer) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Material name is required');
      }
      if (!formData.category) {
        throw new Error('Category is required');
      }
      if (formData.base_price <= 0) {
        throw new Error('Base price must be greater than zero');
      }
      if (formData.is_discounted && (!formData.discount_price || formData.discount_price <= 0)) {
        throw new Error('Discount price must be greater than zero when discount is enabled');
      }
      if (formData.is_discounted && formData.discount_price && formData.discount_price >= formData.base_price) {
        throw new Error('Discount price must be less than base price');
      }

      const materialData = {
        ...formData,
        designer_id: designer.id,
        discount_price: formData.is_discounted ? formData.discount_price : null
      };

      let result;
      
      if (editingId) {
        // Update existing material
        result = await supabase
          .from('designer_material_prices')
          .update(materialData)
          .eq('id', editingId)
          .eq('designer_id', designer.id);
      } else {
        // Add new material
        result = await supabase
          .from('designer_material_prices')
          .insert([materialData]);
      }

      if (result.error) throw result.error;

      setSuccess(editingId ? 'Material updated successfully!' : 'Material added successfully!');
      resetForm();
      setShowAddForm(false);
      fetchMaterials();
    } catch (error: any) {
      console.error('Error saving material:', error);
      setError(error.message || 'Failed to save material');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMaterial = (material: MaterialPrice) => {
    setFormData({
      category: material.category,
      name: material.name,
      description: material.description || '',
      unit: material.unit,
      base_price: material.base_price,
      discount_price: material.discount_price,
      is_discounted: material.is_discounted,
      brand: material.brand || '',
      quality_grade: material.quality_grade,
      is_available: material.is_available
    });
    setEditingId(material.id);
    setShowAddForm(true);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('designer_material_prices')
        .delete()
        .eq('id', id)
        .eq('designer_id', designer?.id);

      if (error) throw error;

      setSuccess('Material deleted successfully!');
      fetchMaterials();
    } catch (error: any) {
      console.error('Error deleting material:', error);
      setError(error.message || 'Failed to delete material');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('designer_material_prices')
        .update({ is_available: !currentStatus })
        .eq('id', id)
        .eq('designer_id', designer?.id);

      if (error) throw error;

      setSuccess('Material availability updated!');
      fetchMaterials();
    } catch (error: any) {
      console.error('Error updating availability:', error);
      setError(error.message || 'Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || material.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getQualityBadgeColor = (grade: string) => {
    switch (grade) {
      case 'Budget': return 'bg-green-100 text-green-800';
      case 'Standard': return 'bg-blue-100 text-blue-800';
      case 'Premium': return 'bg-purple-100 text-purple-800';
      case 'Luxury': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (designerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isDesigner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need to be a registered designer to access this page.</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/designer-dashboard')}
                className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-secondary-800 mb-2">
                Material Pricing
              </h1>
              <p className="text-gray-600">
                Manage your material pricing catalog for customer quotes and projects
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="btn-primary flex items-center space-x-2"
              disabled={showAddForm}
            >
              <Plus className="w-5 h-5" />
              <span>Add Material</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-secondary-800">
                {editingId ? 'Edit Material' : 'Add New Material'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Italian Marble, Teak Wood"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Describe the material, its features, and applications"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Century Ply, Greenply"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Grade
                  </label>
                  <select
                    name="quality_grade"
                    value={formData.quality_grade}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {qualityGrades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit *
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price (₹) *
                  </label>
                  <div className="relative">
                    <Rupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="base_price"
                      value={formData.base_price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_discounted"
                    name="is_discounted"
                    checked={formData.is_discounted}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      is_discounted: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="is_discounted" className="text-sm font-medium text-gray-700">
                    Offer Discount
                  </label>
                </div>

                {formData.is_discounted && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Price (₹) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        name="discount_price"
                        value={formData.discount_price || ''}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required={formData.is_discounted}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_available"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      is_available: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="is_available" className="text-sm font-medium text-gray-700">
                    Available for Projects
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? 'Update Material' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-secondary-800">Filter Materials</h2>
            </div>
            
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full md:w-64 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full md:w-48 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Materials List */}
        {loading && materials.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading materials...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-secondary-800 mb-4">No Materials Found</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {materials.length === 0 
                ? "You haven't added any materials to your pricing catalog yet."
                : "No materials match your current search filters."}
            </p>
            {materials.length === 0 && (
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(true);
                }}
                className="btn-primary"
              >
                Add Your First Material
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-secondary-800">Material</th>
                    <th className="text-left py-3 px-6 font-semibold text-secondary-800">Category</th>
                    <th className="text-left py-3 px-6 font-semibold text-secondary-800">Brand</th>
                    <th className="text-left py-3 px-6 font-semibold text-secondary-800">Quality</th>
                    <th className="text-right py-3 px-6 font-semibold text-secondary-800">Price (₹)</th>
                    <th className="text-center py-3 px-6 font-semibold text-secondary-800">Status</th>
                    <th className="text-center py-3 px-6 font-semibold text-secondary-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.map((material) => (
                    <tr key={material.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-secondary-800">{material.name}</p>
                          <p className="text-sm text-gray-600 line-clamp-1">{material.description}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{material.category}</td>
                      <td className="py-4 px-6 text-gray-600">{material.brand || '-'}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityBadgeColor(material.quality_grade)}`}>
                          {material.quality_grade}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div>
                          <p className="font-medium text-secondary-800">
                            {material.is_discounted && material.discount_price 
                              ? `₹${material.discount_price.toLocaleString()}`
                              : `₹${material.base_price.toLocaleString()}`
                            }
                            <span className="text-xs text-gray-500 ml-1">/{material.unit}</span>
                          </p>
                          {material.is_discounted && material.discount_price && (
                            <p className="text-sm text-gray-500 line-through">
                              ₹{material.base_price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          material.is_available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {material.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEditMaterial(material)}
                            className="p-2 bg-primary-100 text-primary-600 hover:bg-primary-200 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleAvailability(material.id, material.is_available)}
                            className={`p-2 rounded-lg transition-colors ${
                              material.is_available
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                            title={material.is_available ? 'Mark as Unavailable' : 'Mark as Available'}
                          >
                            {material.is_available ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(material.id)}
                            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerMaterialPricing;