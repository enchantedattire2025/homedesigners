import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, Tag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface Designer {
  id: string;
  name: string;
  email: string;
}

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
  terms_conditions: string;
  valid_from: string;
  valid_until: string;
  max_redemptions: number | null;
  current_redemptions: number;
  is_active: boolean;
  is_featured: boolean;
  image_url: string;
  designers?: { name: string };
}

interface DealFormData {
  designer_id: string;
  title: string;
  description: string;
  discount_percentage: number;
  original_price: number;
  deal_price: number;
  deal_type: string;
  services_included: string;
  terms_conditions: string;
  valid_from: string;
  valid_until: string;
  max_redemptions: string;
  is_active: boolean;
  is_featured: boolean;
  image_url: string;
}

export default function AdminDealsManagement() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [formData, setFormData] = useState<DealFormData>({
    designer_id: '',
    title: '',
    description: '',
    discount_percentage: 0,
    original_price: '' as any,
    deal_price: '' as any,
    deal_type: 'package',
    services_included: '',
    terms_conditions: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    max_redemptions: '',
    is_active: true,
    is_featured: false,
    image_url: '',
  });

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else if (user === null) {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchDeals();
      fetchDesigners();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('designer_deals')
        .select(`
          *,
          designers (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const fetchDesigners = async () => {
    try {
      const { data, error } = await supabase
        .from('designers')
        .select('id, name, email')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDesigners(data || []);
    } catch (error) {
      console.error('Error fetching designers:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'discount_percentage' || name === 'original_price') {
      const numValue = parseFloat(value) || 0;
      const updates: Partial<DealFormData> = { [name]: numValue };

      if (name === 'discount_percentage' && formData.original_price > 0) {
        updates.deal_price = formData.original_price * (1 - numValue / 100);
      } else if (name === 'original_price' && formData.discount_percentage > 0) {
        updates.deal_price = numValue * (1 - formData.discount_percentage / 100);
      }

      setFormData(prev => ({ ...prev, ...updates }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dealData = {
        designer_id: formData.designer_id,
        title: formData.title,
        description: formData.description,
        discount_percentage: formData.discount_percentage,
        original_price: formData.original_price,
        deal_price: formData.deal_price,
        deal_type: formData.deal_type,
        services_included: formData.services_included.split(',').map(s => s.trim()).filter(s => s),
        terms_conditions: formData.terms_conditions,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        max_redemptions: formData.max_redemptions ? parseInt(formData.max_redemptions) : null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        image_url: formData.image_url,
      };

      if (editingDeal) {
        const { error } = await supabase
          .from('designer_deals')
          .update(dealData)
          .eq('id', editingDeal.id);

        if (error) throw error;
        alert('Deal updated successfully!');
      } else {
        const { error } = await supabase
          .from('designer_deals')
          .insert([dealData]);

        if (error) throw error;
        alert('Deal created successfully!');
      }

      setShowForm(false);
      setEditingDeal(null);
      resetForm();
      fetchDeals();
    } catch (error) {
      console.error('Error saving deal:', error);
      alert('Error saving deal. Please try again.');
    }
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      designer_id: deal.designer_id,
      title: deal.title,
      description: deal.description,
      discount_percentage: deal.discount_percentage,
      original_price: deal.original_price,
      deal_price: deal.deal_price,
      deal_type: deal.deal_type,
      services_included: deal.services_included.join(', '),
      terms_conditions: deal.terms_conditions,
      valid_from: deal.valid_from.split('T')[0],
      valid_until: deal.valid_until.split('T')[0],
      max_redemptions: deal.max_redemptions?.toString() || '',
      is_active: deal.is_active,
      is_featured: deal.is_featured,
      image_url: deal.image_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const { error } = await supabase
        .from('designer_deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Deal deleted successfully!');
      fetchDeals();
    } catch (error) {
      console.error('Error deleting deal:', error);
      alert('Error deleting deal. Please try again.');
    }
  };

  const toggleActive = async (deal: Deal) => {
    try {
      const { error } = await supabase
        .from('designer_deals')
        .update({ is_active: !deal.is_active })
        .eq('id', deal.id);

      if (error) throw error;
      fetchDeals();
    } catch (error) {
      console.error('Error toggling deal status:', error);
    }
  };

  const toggleFeatured = async (deal: Deal) => {
    try {
      const { error } = await supabase
        .from('designer_deals')
        .update({ is_featured: !deal.is_featured })
        .eq('id', deal.id);

      if (error) throw error;
      fetchDeals();
    } catch (error) {
      console.error('Error toggling featured status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      designer_id: '',
      title: '',
      description: '',
      discount_percentage: 0,
      original_price: 0,
      deal_price: 0,
      deal_type: 'package',
      services_included: '',
      terms_conditions: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      max_redemptions: '',
      is_active: true,
      is_featured: false,
      image_url: '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the admin panel.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-2">You do not have permission to access this page.</p>
          <p className="text-sm text-gray-500 mb-6">This area is restricted to administrators only.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Designer Deals</h1>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingDeal(null);
              resetForm();
            }}
            className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Create New Deal
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingDeal ? 'Edit Deal' : 'Create New Deal'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designer *
                  </label>
                  <select
                    name="designer_id"
                    value={formData.designer_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Select Designer</option>
                    {designers.map(designer => (
                      <option key={designer.id} value={designer.id}>
                        {designer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Type *
                  </label>
                  <select
                    name="deal_type"
                    value={formData.deal_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="package">Package</option>
                    <option value="service">Service</option>
                    <option value="consultation">Consultation</option>
                    <option value="material">Material</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="original_price"
                    value={formData.original_price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (%) *
                  </label>
                  <input
                    type="number"
                    name="discount_percentage"
                    value={formData.discount_percentage}
                    onChange={handleInputChange}
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="deal_price"
                    value={formData.deal_price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    name="max_redemptions"
                    value={formData.max_redemptions}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    name="valid_from"
                    value={formData.valid_from}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    name="valid_until"
                    value={formData.valid_until}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Services Included (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="services_included"
                    value={formData.services_included}
                    onChange={handleInputChange}
                    placeholder="e.g., Consultation, 3D Design, Material Selection"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    name="terms_conditions"
                    value={formData.terms_conditions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors"
                >
                  {editingDeal ? 'Update Deal' : 'Create Deal'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingDeal(null);
                    resetForm();
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {deals.length === 0 && !showForm ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Deals Yet</h3>
            <p className="text-gray-600 mb-6">Create your first deal to start offering special promotions to customers.</p>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingDeal(null);
                resetForm();
              }}
              className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 inline-flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Create Your First Deal
            </button>
          </div>
        ) : deals.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Redemptions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valid Until
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deals.map(deal => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {deal.is_featured && (
                          <Star size={16} className="text-yellow-500 fill-current" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{deal.title}</div>
                          <div className="text-sm text-gray-500">{deal.deal_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {deal.designers?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900 font-medium">₹{deal.deal_price.toLocaleString()}</div>
                        <div className="text-gray-500 line-through">₹{deal.original_price.toLocaleString()}</div>
                        <div className="text-green-600 text-xs">{deal.discount_percentage}% OFF</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {deal.current_redemptions} / {deal.max_redemptions || '∞'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(deal.valid_until).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        deal.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {deal.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(deal)}
                          className="text-sky-600 hover:text-sky-800"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => toggleActive(deal)}
                          className="text-gray-600 hover:text-gray-800"
                          title={deal.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {deal.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <button
                          onClick={() => toggleFeatured(deal)}
                          className={`${deal.is_featured ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600`}
                          title={deal.is_featured ? 'Unfeature' : 'Feature'}
                        >
                          <Star size={18} className={deal.is_featured ? 'fill-current' : ''} />
                        </button>
                        <button
                          onClick={() => handleDelete(deal.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
