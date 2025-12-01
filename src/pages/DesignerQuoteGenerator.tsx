import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Save, 
  Send, 
  Download, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  Package, 
  DollarSign, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Home
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDesignerProfile } from '../hooks/useDesignerProfile';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  project_name: string;
  property_type: string;
  project_area: string | null;
  budget_range: string;
  timeline: string;
  requirements: string;
}

interface Material {
  id: string;
  category: string;
  name: string;
  description: string | null;
  unit: string;
  base_price: number;
  discount_price: number | null;
  is_discounted: boolean;
  brand: string | null;
  quality_grade: string;
}

interface QuoteItem {
  id?: string;
  material_id?: string;
  item_type: 'material' | 'labor' | 'service' | 'other' | 'component';
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  amount: number;
}

interface QuoteData {
  title: string;
  description: string;
  quote_number: string;
  valid_until: string;
  terms_and_conditions: string;
  notes: string;
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  items: QuoteItem[];
}

interface ComponentType {
  id: string;
  name: string;
  description: string;
  defaultUnit: string;
  defaultPrice: number;
}

const DesignerQuoteGenerator = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const { designer, isDesigner, loading: designerLoading } = useDesignerProfile();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [componentTypes, setComponentTypes] = useState<ComponentType[]>([
    {
      id: 'l-shaped-kitchen',
      name: 'L-Shaped Kitchen',
      description: 'Complete L-shaped kitchen with cabinets, countertops, and hardware',
      defaultUnit: 'sq.ft',
      defaultPrice: 1200
    },
    {
      id: 'tv-unit',
      name: 'TV Unit',
      description: 'Custom TV unit with storage and display shelves',
      defaultUnit: 'running ft',
      defaultPrice: 1500
    },
    {
      id: 'wardrobe',
      name: 'Wardrobe',
      description: 'Custom wardrobe with shelves, hanging space, and drawers',
      defaultUnit: 'sq.ft',
      defaultPrice: 950
    },
    {
      id: 'bed',
      name: 'Bed with Storage',
      description: 'Custom bed with under-bed storage',
      defaultUnit: 'unit',
      defaultPrice: 25000
    },
    {
      id: 'study-table',
      name: 'Study Table',
      description: 'Custom study table with storage',
      defaultUnit: 'unit',
      defaultPrice: 15000
    },
    {
      id: 'bathroom-vanity',
      name: 'Bathroom Vanity',
      description: 'Custom bathroom vanity with sink and storage',
      defaultUnit: 'unit',
      defaultPrice: 18000
    },
    {
      id: 'dining-table',
      name: 'Dining Table',
      description: 'Custom dining table with chairs',
      defaultUnit: 'unit',
      defaultPrice: 35000
    },
    {
      id: 'false-ceiling',
      name: 'False Ceiling',
      description: 'Custom false ceiling with LED lighting',
      defaultUnit: 'sq.ft',
      defaultPrice: 150
    }
  ]);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteData, setQuoteData] = useState<QuoteData>({
    title: '',
    description: '',
    quote_number: `QT-${Date.now().toString().slice(-6)}`,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    terms_and_conditions: 'This quote is valid for 30 days from the date of issue. A 50% advance payment is required to begin work. The remaining balance is due upon completion. Any changes to the scope of work may result in additional charges.',
    notes: '',
    subtotal: 0,
    discount_amount: 0,
    tax_rate: 18,
    tax_amount: 0,
    total_amount: 0,
    items: []
  });

  useEffect(() => {
    if (!designerLoading && designer && projectId) {
      fetchProjectDetails();
      fetchMaterials();
    }
  }, [designer, designerLoading, projectId]);

  useEffect(() => {
    // Recalculate totals whenever items change
    calculateTotals();
  }, [quoteData.items, quoteData.tax_rate, quoteData.discount_amount]);

  const fetchProjectDetails = async () => {
    if (!projectId || !designer) return;

    try {
      setLoading(true);
      setError(null);

      // First, check if this designer has access to this project
      // Either through project_shares or assigned_designer_id
      const { data: shareCheck } = await supabase
        .from('project_shares')
        .select('*')
        .eq('project_id', projectId)
        .ilike('designer_email', designer.email)
        .maybeSingle();

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Project not found');
      }

      // Check if designer has access via assignment or share
      const hasAccess = data.assigned_designer_id === designer.id || shareCheck !== null;

      if (!hasAccess) {
        throw new Error('You do not have access to this project');
      }
      
      setCustomer(data);
      
      // Set quote title based on project name
      setQuoteData(prev => ({
        ...prev,
        title: `Quote for ${data.project_name}`,
        description: `Interior design services for ${data.property_type} in ${data.location}`
      }));
    } catch (error: any) {
      console.error('Error fetching project details:', error);
      setError(error.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    if (!designer) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('designer_material_prices')
        .select('*')
        .eq('designer_id', designer.id)
        .eq('is_available', true)
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

  const calculateTotals = () => {
    const subtotal = quoteData.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal - quoteData.discount_amount) * (quoteData.tax_rate / 100);
    const total = subtotal - quoteData.discount_amount + taxAmount;
    
    setQuoteData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'tax_rate' || name === 'discount_amount') {
      setQuoteData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setQuoteData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const addItem = () => {
    const newItem: QuoteItem = {
      item_type: 'material',
      name: '',
      description: '',
      quantity: 1,
      unit: 'sq.ft',
      unit_price: '' as any,
      discount_percent: 0,
      amount: 0
    };
    
    setQuoteData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (index: number) => {
    setQuoteData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    setQuoteData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
      
      // Recalculate amount if quantity, unit_price, or discount_percent changes
      if (field === 'quantity' || field === 'unit_price' || field === 'discount_percent') {
        const item = updatedItems[index];
        const discountMultiplier = 1 - (item.discount_percent / 100);
        item.amount = item.quantity * item.unit_price * discountMultiplier;
      }
      
      // If material_id changes, update other fields from the selected material
      if (field === 'material_id' && value) {
        const material = materials.find(m => m.id === value);
        if (material) {
          updatedItems[index] = {
            ...updatedItems[index],
            material_id: material.id,
            name: material.name,
            description: material.description || '',
            unit: material.unit,
            unit_price: material.is_discounted && material.discount_price !== null 
              ? material.discount_price 
              : material.base_price,
            amount: updatedItems[index].quantity * (
              material.is_discounted && material.discount_price !== null 
                ? material.discount_price 
                : material.base_price
            ) * (1 - (updatedItems[index].discount_percent / 100))
          };
        }
      }
      
      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  const handleSaveQuote = async (status: 'draft' | 'sent' = 'draft') => {
    if (!designer || !customer) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Validate form
      if (!quoteData.title.trim()) {
        throw new Error('Quote title is required');
      }
      if (quoteData.items.length === 0) {
        throw new Error('At least one item is required');
      }
      if (!quoteData.valid_until) {
        throw new Error('Valid until date is required');
      }
      
      // Check if all items have names and prices
      const invalidItems = quoteData.items.filter(item => !item.name.trim() || item.unit_price <= 0);
      if (invalidItems.length > 0) {
        throw new Error('All items must have a name and price greater than zero');
      }
      
      // Create quote
      const { data: quote, error: quoteError } = await supabase
        .from('designer_quotes')
        .insert([{
          designer_id: designer.id,
          project_id: customer.id,
          quote_number: quoteData.quote_number,
          title: quoteData.title,
          description: quoteData.description,
          subtotal: quoteData.subtotal,
          discount_amount: quoteData.discount_amount,
          tax_rate: quoteData.tax_rate,
          tax_amount: quoteData.tax_amount,
          total_amount: quoteData.total_amount,
          status: status,
          valid_until: quoteData.valid_until,
          terms_and_conditions: quoteData.terms_and_conditions,
          notes: quoteData.notes
        }])
        .select()
        .single();
      
      if (quoteError) throw quoteError;
      
      // Create quote items
      const quoteItems = quoteData.items.map(item => ({
        quote_id: quote.id,
        material_id: item.material_id,
        item_type: item.item_type,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        amount: item.amount
      }));
      
      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);
      
      if (itemsError) throw itemsError;
      
      setSuccess(`Quote ${status === 'sent' ? 'sent' : 'saved'} successfully!`);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/designer-quotes');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving quote:', error);
      setError(error.message || 'Failed to save quote');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  if (designerLoading || loading) {
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

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-800 mb-4">Project Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error || "The project you're looking for doesn't exist or you don't have access to it."}
          </p>
          <button
            onClick={() => navigate('/customer-projects')}
            className="btn-primary"
          >
            Back to Projects
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
                onClick={() => navigate('/designer-quotes')}
                className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Quotes
              </button>
              <h1 className="text-3xl font-bold text-secondary-800 mb-2">
                Create Quote
              </h1>
              <p className="text-gray-600">
                Generate a professional quote for {customer.project_name}
              </p>
            </div>
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

        {/* Steps Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <span>1</span>
              </div>
              <span className={`font-medium ${
                currentStep === 1 ? 'text-primary-600' : 'text-gray-500'
              }`}>Quote Details</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${
              currentStep >= 2 ? 'bg-primary-500' : 'bg-gray-200'
            }`}></div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <span>2</span>
              </div>
              <span className={`font-medium ${
                currentStep === 2 ? 'text-primary-600' : 'text-gray-500'
              }`}>Add Items</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${
              currentStep >= 3 ? 'bg-primary-500' : 'bg-gray-200'
            }`}></div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <span>3</span>
              </div>
              <span className={`font-medium ${
                currentStep === 3 ? 'text-primary-600' : 'text-gray-500'
              }`}>Preview & Send</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Quote Details */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl shadow-lg p-6 animate-fadeIn">
                <h2 className="text-xl font-semibold text-secondary-800 mb-6">Quote Details</h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quote Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={quoteData.title}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., Interior Design Services for 3BHK Apartment"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quote Number
                      </label>
                      <input
                        type="text"
                        name="quote_number"
                        value={quoteData.quote_number}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valid Until *
                      </label>
                      <input
                        type="date"
                        name="valid_until"
                        value={quoteData.valid_until}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        name="tax_rate"
                        value={quoteData.tax_rate}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={quoteData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Describe the scope of work covered by this quote"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terms and Conditions
                    </label>
                    <textarea
                      name="terms_and_conditions"
                      value={quoteData.terms_and_conditions}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={quoteData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Any additional notes or special instructions"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Add Items */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl shadow-lg p-6 animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-secondary-800">Quote Items</h2>
                  <button
                    onClick={addItem}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>
                
                {quoteData.items.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No items added yet</p>
                    <button
                      onClick={addItem}
                      className="btn-primary"
                    >
                      Add Your First Item
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {quoteData.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium text-secondary-800">Item #{index + 1}</h3>
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Item Type
                            </label>
                            <select
                              value={item.item_type}
                              onChange={(e) => handleItemChange(index, 'item_type', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="material">Material</option>
                              <option value="labor">Labor</option>
                              <option value="service">Service</option>
                              <option value="component">Component</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          
                          {item.item_type === 'material' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Material
                              </label>
                              <select
                                value={item.material_id || ''}
                                onChange={(e) => handleItemChange(index, 'material_id', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              >
                                <option value="">Select a material</option>
                                {materials.map(material => (
                                  <option key={material.id} value={material.id}>
                                    {material.name} ({material.category}) - {formatCurrency(material.is_discounted && material.discount_price !== null ? material.discount_price : material.base_price)}/{material.unit}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {item.item_type === 'component' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Component Type
                              </label>
                              <select
                                value={item.name || ''}
                                onChange={(e) => {
                                  const selectedComponent = componentTypes.find(c => c.name === e.target.value);
                                  if (selectedComponent) {
                                    handleItemChange(index, 'name', selectedComponent.name);
                                    handleItemChange(index, 'description', selectedComponent.description);
                                    handleItemChange(index, 'unit', selectedComponent.defaultUnit);
                                    handleItemChange(index, 'unit_price', selectedComponent.defaultPrice);
                                    // Recalculate amount
                                    const amount = item.quantity * selectedComponent.defaultPrice * (1 - (item.discount_percent / 100));
                                    handleItemChange(index, 'amount', amount);
                                  }
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              >
                                <option value="">Select a component</option>
                                {componentTypes.map(component => (
                                  <option key={component.id} value={component.name}>
                                    {component.name} - {formatCurrency(component.defaultPrice)}/{component.defaultUnit}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          <div className={item.item_type === 'material' ? 'md:col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Item Name *
                            </label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="e.g., Italian Marble, Design Consultation"
                              required
                            />
                            {item.item_type === 'component' && (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Width (ft)
                                  </label>
                                  <input
                                    type="number"
                                    value={item.description.includes('Width:') ? 
                                      parseFloat(item.description.match(/Width: (\d+(\.\d+)?)ft/)?.[1] || '0') : 
                                      ''}
                                    onChange={(e) => {
                                      const width = parseFloat(e.target.value) || 0;
                                      const heightMatch = item.description.match(/Height: (\d+(\.\d+)?)ft/);
                                      const height = heightMatch ? parseFloat(heightMatch[1]) : 0;
                                      const depthMatch = item.description.match(/Depth: (\d+(\.\d+)?)ft/);
                                      const depth = depthMatch ? parseFloat(depthMatch[1]) : 0;
                                      
                                      const newDescription = `Width: ${width}ft, Height: ${height}ft, Depth: ${depth}ft`;
                                      handleItemChange(index, 'description', newDescription);
                                      
                                      // If this is a square footage based component, update quantity
                                      if (item.unit === 'sq.ft') {
                                        const newQuantity = width * height;
                                        handleItemChange(index, 'quantity', newQuantity);
                                        // Update amount
                                        const amount = newQuantity * item.unit_price * (1 - (item.discount_percent / 100));
                                        handleItemChange(index, 'amount', amount);
                                      }
                                    }}
                                    min="0"
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Height (ft)
                                  </label>
                                  <input
                                    type="number"
                                    value={item.description.includes('Height:') ? 
                                      parseFloat(item.description.match(/Height: (\d+(\.\d+)?)ft/)?.[1] || '0') : 
                                      ''}
                                    onChange={(e) => {
                                      const height = parseFloat(e.target.value) || 0;
                                      const widthMatch = item.description.match(/Width: (\d+(\.\d+)?)ft/);
                                      const width = widthMatch ? parseFloat(widthMatch[1]) : 0;
                                      const depthMatch = item.description.match(/Depth: (\d+(\.\d+)?)ft/);
                                      const depth = depthMatch ? parseFloat(depthMatch[1]) : 0;
                                      
                                      const newDescription = `Width: ${width}ft, Height: ${height}ft, Depth: ${depth}ft`;
                                      handleItemChange(index, 'description', newDescription);
                                      
                                      // If this is a square footage based component, update quantity
                                      if (item.unit === 'sq.ft') {
                                        const newQuantity = width * height;
                                        handleItemChange(index, 'quantity', newQuantity);
                                        // Update amount
                                        const amount = newQuantity * item.unit_price * (1 - (item.discount_percent / 100));
                                        handleItemChange(index, 'amount', amount);
                                      }
                                    }}
                                    min="0"
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Depth (ft)
                                  </label>
                                  <input
                                    type="number"
                                    value={item.description.includes('Depth:') ? 
                                      parseFloat(item.description.match(/Depth: (\d+(\.\d+)?)ft/)?.[1] || '0') : 
                                      ''}
                                    onChange={(e) => {
                                      const depth = parseFloat(e.target.value) || 0;
                                      const widthMatch = item.description.match(/Width: (\d+(\.\d+)?)ft/);
                                      const width = widthMatch ? parseFloat(widthMatch[1]) : 0;
                                      const heightMatch = item.description.match(/Height: (\d+(\.\d+)?)ft/);
                                      const height = heightMatch ? parseFloat(heightMatch[1]) : 0;
                                      
                                      const newDescription = `Width: ${width}ft, Height: ${height}ft, Depth: ${depth}ft`;
                                      handleItemChange(index, 'description', newDescription);
                                    }}
                                    min="0"
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Calculated Area
                                  </label>
                                  <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-gray-700">
                                    {item.quantity.toFixed(2)} {item.unit}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className={`md:col-span-2 ${item.item_type === 'component' ? 'hidden' : ''}`}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              rows={2}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Describe the item, specifications, or scope of work"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              min="0.01"
                              step="0.01"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Unit
                            </label>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="e.g., sq.ft, hours, piece"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Unit Price (₹) *
                            </label>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Discount (%)
                            </label>
                            <input
                              type="number"
                              value={item.discount_percent === 0 ? '' : item.discount_percent}
                              onChange={(e) => handleItemChange(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="0"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Amount:</span>
                            <span className="font-semibold text-secondary-800">{formatCurrency(item.amount)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={addItem}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:text-primary-600 hover:border-primary-500 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add Another Item</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Preview & Send */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl shadow-lg p-6 animate-fadeIn">
                <h2 className="text-xl font-semibold text-secondary-800 mb-6">Quote Preview</h2>
                
                <div className="border border-gray-200 rounded-lg p-8 mb-6">
                  {/* Quote Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                          <Home className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-secondary-800">{designer?.name}</h3>
                          <p className="text-gray-600">{designer?.specialization}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{designer?.email}</p>
                        <p>{designer?.phone}</p>
                        <p>{designer?.location}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 md:mt-0 text-right">
                      <h3 className="text-2xl font-bold text-primary-600 mb-2">QUOTATION</h3>
                      <p className="text-gray-600 mb-1"><span className="font-medium">Quote #:</span> {quoteData.quote_number}</p>
                      <p className="text-gray-600 mb-1"><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
                      <p className="text-gray-600"><span className="font-medium">Valid Until:</span> {new Date(quoteData.valid_until).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* Client Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-8">
                    <h4 className="font-semibold text-secondary-800 mb-3">Client Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Client Name</p>
                        <p className="font-medium">{customer.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Project</p>
                        <p className="font-medium">{customer.project_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{customer.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{customer.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{customer.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Property Type</p>
                        <p className="font-medium">{customer.property_type}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quote Description */}
                  <div className="mb-8">
                    <h4 className="font-semibold text-secondary-800 mb-3">Quote Description</h4>
                    <p className="text-gray-600">{quoteData.description || 'No description provided.'}</p>
                  </div>
                  
                  {/* Items Table */}
                  <div className="mb-8">
                    <h4 className="font-semibold text-secondary-800 mb-3">Quote Items</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-secondary-800">Item</th>
                            <th className="text-left py-3 px-4 font-semibold text-secondary-800">Description</th>
                            <th className="text-right py-3 px-4 font-semibold text-secondary-800">Qty</th>
                            <th className="text-right py-3 px-4 font-semibold text-secondary-800">Unit</th>
                            <th className="text-right py-3 px-4 font-semibold text-secondary-800">Unit Price</th>
                            <th className="text-right py-3 px-4 font-semibold text-secondary-800">Discount</th>
                            <th className="text-right py-3 px-4 font-semibold text-secondary-800">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quoteData.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-3 px-4 font-medium text-secondary-800">{item.name}</td>
                              <td className="py-3 px-4 text-gray-600">{item.description || '-'}</td>
                              <td className="py-3 px-4 text-right">{item.quantity}</td>
                              <td className="py-3 px-4 text-right">{item.unit}</td>
                              <td className="py-3 px-4 text-right">{formatCurrency(item.unit_price)}</td>
                              <td className="py-3 px-4 text-right">{item.discount_percent}%</td>
                              <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Totals */}
                  <div className="flex justify-end mb-8">
                    <div className="w-full md:w-64">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">{formatCurrency(quoteData.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount:</span>
                          <span className="font-medium">- {formatCurrency(quoteData.discount_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax ({quoteData.tax_rate}%):</span>
                          <span className="font-medium">{formatCurrency(quoteData.tax_amount)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex justify-between font-bold text-lg">
                            <span className="text-secondary-800">Total:</span>
                            <span className="text-primary-600">{formatCurrency(quoteData.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Terms and Notes */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-secondary-800 mb-3">Terms and Conditions</h4>
                      <p className="text-gray-600 text-sm whitespace-pre-line">{quoteData.terms_and_conditions || 'No terms and conditions specified.'}</p>
                    </div>
                    
                    {quoteData.notes && (
                      <div>
                        <h4 className="font-semibold text-secondary-800 mb-3">Notes</h4>
                        <p className="text-gray-600 text-sm">{quoteData.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4">Quote Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(quoteData.subtotal)}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Amount
                  </label>
                  <div className="relative">
                    
                    <input
                      type="number"
                      name="discount_amount"
                      value={quoteData.discount_amount === 0 ? '' : quoteData.discount_amount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="0"
                      className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({quoteData.tax_rate}%):</span>
                  <span className="font-medium">{formatCurrency(quoteData.tax_amount)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between font-bold">
                    <span className="text-secondary-800">Total:</span>
                    <span className="text-primary-600">{formatCurrency(quoteData.total_amount)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Step</span>
                  </button>
                )}
                
                {currentStep < 3 && (
                  <button
                    onClick={nextStep}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <span>Next Step</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                
                {currentStep === 3 && (
                  <>
                    <button
                      onClick={() => handleSaveQuote('draft')}
                      disabled={saving}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save as Draft'}</span>
                    </button>
                    
                    <button
                      onClick={() => handleSaveQuote('sent')}
                      disabled={saving}
                      className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{saving ? 'Sending...' : 'Send to Customer'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerQuoteGenerator;