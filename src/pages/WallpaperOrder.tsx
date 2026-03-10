import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon, AlertCircle, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface WallpaperOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  wall_size_length: number;
  wall_size_height: number;
  wall_unit: string;
  reference_images: string[];
  wallpaper_type: string;
  rate_per_sqft: number;
  total_area_sqft: number;
  total_amount: number;
  advance_amount: number;
  payment_screenshot_url: string | null;
  preview_image_url: string | null;
  status: string;
  order_date: string;
  confirmation_date: string | null;
  delivery_date: string | null;
  notes: string | null;
}

export default function WallpaperOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [orders, setOrders] = useState<WallpaperOrder[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    customer_city: 'Pune',
    customer_state: 'Maharashtra',
    customer_pincode: '',
    wall_size_length: '',
    wall_size_height: '',
    wall_unit: 'feet',
    reference_images: [''],
    wallpaper_type: 'normal',
    notes: ''
  });

  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [uploadingPayment, setUploadingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCustomerData();
      fetchOrders();
    }
  }, [user]);

  const fetchCustomerData = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone, address')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setCustomerId(data.id);
      setFormData(prev => ({
        ...prev,
        customer_name: data.name || '',
        customer_phone: data.phone || '',
        customer_address: data.address || ''
      }));
    }
  };

  const fetchOrders = async () => {
    if (!user) return;

    const { data: customerData } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!customerData) return;

    const { data, error } = await supabase
      .from('wallpaper_orders')
      .select('*')
      .eq('customer_id', customerData.id)
      .order('order_date', { ascending: false });

    if (data) {
      setOrders(data);
    }
  };

  const calculateTotal = () => {
    const length = parseFloat(formData.wall_size_length) || 0;
    const height = parseFloat(formData.wall_size_height) || 0;

    let areaSqFt = length * height;
    if (formData.wall_unit === 'inches') {
      areaSqFt = areaSqFt / 144;
    }

    const rate = formData.wallpaper_type === 'golden_foil' ? 200 : 150;
    const total = areaSqFt * rate;
    const advance = total * 0.5;

    return { areaSqFt, rate, total, advance };
  };

  const addReferenceImageField = () => {
    setFormData(prev => ({
      ...prev,
      reference_images: [...prev.reference_images, '']
    }));
  };

  const updateReferenceImage = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      reference_images: prev.reference_images.map((img, i) => i === index ? value : img)
    }));
  };

  const removeReferenceImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reference_images: prev.reference_images.filter((_, i) => i !== index)
    }));
  };

  const handlePaymentScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentScreenshot(e.target.files[0]);
    }
  };

  const uploadPaymentScreenshot = async () => {
    if (!paymentScreenshot || !user) return null;

    setUploadingPayment(true);
    try {
      const fileExt = paymentScreenshot.name.split('.').pop();
      const fileName = `payment_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('wallpaper-orders')
        .upload(filePath, paymentScreenshot);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('wallpaper-orders')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading payment screenshot:', error);
      alert('Failed to upload payment screenshot');
      return null;
    } finally {
      setUploadingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please login to place an order');
      return;
    }

    if (formData.customer_city.toLowerCase() !== 'pune') {
      alert('Service is currently available only in Pune, Maharashtra');
      return;
    }

    if (formData.customer_state.toLowerCase() !== 'maharashtra') {
      alert('Service is currently available only in Pune, Maharashtra');
      return;
    }

    if (!paymentScreenshot) {
      alert('Please upload payment screenshot');
      return;
    }

    const { areaSqFt, rate, total, advance } = calculateTotal();

    if (areaSqFt <= 0) {
      alert('Please enter valid wall dimensions');
      return;
    }

    setLoading(true);

    try {
      const paymentUrl = await uploadPaymentScreenshot();
      if (!paymentUrl) {
        setLoading(false);
        return;
      }

      const fullAddress = `${formData.customer_address}, ${formData.customer_city}, ${formData.customer_state} - ${formData.customer_pincode}, India`;

      let finalCustomerId = customerId;

      if (!customerId) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            name: formData.customer_name,
            phone: formData.customer_phone,
            address: fullAddress,
            email: user.email
          })
          .select()
          .single();

        if (customerError) throw customerError;
        finalCustomerId = newCustomer.id;
        setCustomerId(newCustomer.id);
      }

      const filteredImages = formData.reference_images.filter(img => img.trim() !== '');

      const { error } = await supabase
        .from('wallpaper_orders')
        .insert({
          customer_id: finalCustomerId,
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          customer_address: fullAddress,
          wall_size_length: parseFloat(formData.wall_size_length),
          wall_size_height: parseFloat(formData.wall_size_height),
          wall_unit: formData.wall_unit,
          reference_images: filteredImages,
          wallpaper_type: formData.wallpaper_type,
          rate_per_sqft: rate,
          total_area_sqft: areaSqFt,
          total_amount: total,
          advance_amount: advance,
          payment_screenshot_url: paymentUrl,
          notes: formData.notes || null
        });

      if (error) throw error;

      alert('Order placed successfully! We will send you a preview soon.');
      setShowForm(false);
      setFormData({
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        customer_city: 'Pune',
        customer_state: 'Maharashtra',
        customer_pincode: formData.customer_pincode,
        wall_size_length: '',
        wall_size_height: '',
        wall_unit: 'feet',
        reference_images: [''],
        wallpaper_type: 'normal',
        notes: ''
      });
      setPaymentScreenshot(null);
      fetchOrders();
    } catch (error: any) {
      console.error('Error placing order:', error);
      alert(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const { areaSqFt, rate, total, advance } = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">3D Wallpaper Orders</h1>
          <p className="text-gray-600 mb-6">Order custom 3D wallpapers for your space in Pune, Maharashtra</p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-orange-900 mb-2">Service Location</h3>
            <p className="text-sm text-orange-800">
              Currently available only in Pune, Maharashtra, India
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Pricing Information</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Normal 3D Wallpaper: ₹150 per sq ft</li>
              <li>• Golden Foil 3D Wallpaper: ₹200 per sq ft</li>
              <li>• 50% advance payment required</li>
              <li>• Preview will be provided before final confirmation</li>
              <li>• Delivery and execution at site after confirmation</li>
            </ul>
          </div>

          {!user ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-center">
                Please login to place a wallpaper order
              </p>
            </div>
          ) : !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Place New Order
            </button>
          ) : null}
        </div>

        {user && showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">New Order</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.customer_address}
                  onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                  placeholder="House/Flat No, Building Name, Street Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer_city}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Service available only in Pune</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer_state}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    value={formData.customer_pincode}
                    onChange={(e) => setFormData({ ...formData, customer_pincode: e.target.value })}
                    placeholder="411001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wall Length <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.wall_size_length}
                    onChange={(e) => setFormData({ ...formData, wall_size_length: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wall Height <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.wall_size_height}
                    onChange={(e) => setFormData({ ...formData, wall_size_height: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.wall_unit}
                    onChange={(e) => setFormData({ ...formData, wall_unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="feet">Feet</option>
                    <option value="inches">Inches</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wallpaper Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.wallpaper_type === 'normal' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                    <input
                      type="radio"
                      name="wallpaper_type"
                      value="normal"
                      checked={formData.wallpaper_type === 'normal'}
                      onChange={(e) => setFormData({ ...formData, wallpaper_type: e.target.value })}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">Normal 3D Wallpaper</div>
                      <div className="text-sm text-gray-600">₹150 per sq ft</div>
                    </div>
                  </label>

                  <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.wallpaper_type === 'golden_foil' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                    <input
                      type="radio"
                      name="wallpaper_type"
                      value="golden_foil"
                      checked={formData.wallpaper_type === 'golden_foil'}
                      onChange={(e) => setFormData({ ...formData, wallpaper_type: e.target.value })}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">Golden Foil 3D Wallpaper</div>
                      <div className="text-sm text-gray-600">₹200 per sq ft</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Images (Pinterest/Shutterstock URLs)
                </label>
                {formData.reference_images.map((img, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={img}
                      onChange={(e) => updateReferenceImage(index, e.target.value)}
                      placeholder="https://pinterest.com/... or https://shutterstock.com/..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formData.reference_images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeReferenceImage(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addReferenceImageField}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Another Reference Image
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Screenshot (50% Advance) <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePaymentScreenshotChange}
                    className="hidden"
                    id="payment-screenshot"
                    required
                  />
                  <label
                    htmlFor="payment-screenshot"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {paymentScreenshot ? paymentScreenshot.name : 'Click to upload payment screenshot'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special requirements or instructions..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {areaSqFt > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wall Area:</span>
                      <span className="font-medium">{areaSqFt.toFixed(2)} sq ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate per sq ft:</span>
                      <span className="font-medium">₹{rate}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold border-t pt-2">
                      <span>Total Amount:</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-blue-600 font-semibold">
                      <span>50% Advance Payment:</span>
                      <span>₹{advance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingPayment}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Placing Order...' : uploadingPayment ? 'Uploading...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        )}

        {user && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {order.wallpaper_type === 'golden_foil' ? 'Golden Foil' : 'Normal'} 3D Wallpaper
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'preview_sent' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'in_production' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Area:</span>
                      <span className="ml-2 font-medium">{order.total_area_sqft.toFixed(2)} sq ft</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <span className="ml-2 font-medium">₹{order.total_amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Advance Paid:</span>
                      <span className="ml-2 font-medium text-green-600">₹{order.advance_amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Balance:</span>
                      <span className="ml-2 font-medium text-orange-600">₹{(order.total_amount - order.advance_amount).toFixed(2)}</span>
                    </div>
                  </div>

                  {order.preview_image_url && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview Image:</p>
                      <img
                        src={order.preview_image_url}
                        alt="Preview"
                        className="w-full max-w-md h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {order.reference_images && order.reference_images.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Reference Images:</p>
                      <div className="space-y-1">
                        {order.reference_images.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 block truncate"
                          >
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <span className="font-medium">Notes:</span> {order.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
