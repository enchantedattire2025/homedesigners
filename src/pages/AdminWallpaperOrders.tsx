import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Check, Image as ImageIcon, ExternalLink, Phone, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface WallpaperOrder {
  id: string;
  customer_id: string;
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
  created_at: string;
  updated_at: string;
}

export default function AdminWallpaperOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<WallpaperOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<WallpaperOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    checkAdminAndFetchOrders();
  }, [user, navigate]);

  const checkAdminAndFetchOrders = async () => {
    if (!user) {
      navigate('/admin-login');
      return;
    }

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminData) {
      alert('Access denied. Admin only.');
      navigate('/');
      return;
    }

    fetchOrders();
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('wallpaper_orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      alert('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [filterStatus]);

  const handlePreviewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPreviewFile(e.target.files[0]);
    }
  };

  const uploadPreviewImage = async (orderId: string) => {
    if (!previewFile || !user) return;

    setUploading(true);
    try {
      const fileExt = previewFile.name.split('.').pop();
      const fileName = `preview_${orderId}_${Date.now()}.${fileExt}`;
      const filePath = `previews/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('wallpaper-orders')
        .upload(filePath, previewFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('wallpaper-orders')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('wallpaper_orders')
        .update({
          preview_image_url: publicUrl,
          status: 'preview_sent'
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      alert('Preview image uploaded and order status updated!');
      setPreviewFile(null);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error: any) {
      console.error('Error uploading preview:', error);
      alert('Failed to upload preview image');
    } finally {
      setUploading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === 'confirmed' && !selectedOrder?.confirmation_date) {
        updateData.confirmation_date = new Date().toISOString();
      }

      if (newStatus === 'completed' && !selectedOrder?.delivery_date) {
        updateData.delivery_date = new Date().toISOString();
      }

      if (adminNotes.trim()) {
        updateData.notes = adminNotes;
      }

      const { error } = await supabase
        .from('wallpaper_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      alert(`Order status updated to ${newStatus}`);
      setStatusUpdate('');
      setAdminNotes('');
      setSelectedOrder(null);
      fetchOrders();
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'preview_sent': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'in_production': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wallpaper Orders Management</h1>
              <p className="text-gray-600 mt-1">Manage 3D wallpaper orders</p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Admin
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders ({orders.length})
            </button>
            {['pending', 'preview_sent', 'confirmed', 'in_production', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {order.wallpaper_type === 'golden_foil' ? 'Golden Foil' : 'Normal'} 3D Wallpaper
                    </h3>
                    <p className="text-sm text-gray-500">
                      Order ID: {order.id.substring(0, 8)}... | {new Date(order.order_date).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Customer Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 w-24">Name:</span>
                        <span className="text-gray-900">{order.customer_name}</span>
                      </div>
                      <div className="flex items-start">
                        <Phone className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                        <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:text-blue-700">
                          {order.customer_phone}
                        </a>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                        <span className="text-gray-900">{order.customer_address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Order Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dimensions:</span>
                        <span className="font-medium">
                          {order.wall_size_length} x {order.wall_size_height} {order.wall_unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Area:</span>
                        <span className="font-medium">{order.total_area_sqft.toFixed(2)} sq ft</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rate:</span>
                        <span className="font-medium">₹{order.rate_per_sqft}/sq ft</span>
                      </div>
                      <div className="flex justify-between text-base font-semibold border-t pt-2">
                        <span>Total Amount:</span>
                        <span>₹{order.total_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-600 font-semibold">
                        <span>Advance Paid:</span>
                        <span>₹{order.advance_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-orange-600 font-semibold">
                        <span>Balance:</span>
                        <span>₹{(order.total_amount - order.advance_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {order.reference_images && order.reference_images.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Reference Images:</h4>
                    <div className="space-y-1">
                      {order.reference_images.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Reference {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {order.payment_screenshot_url && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Payment Screenshot:</h4>
                      <img
                        src={order.payment_screenshot_url}
                        alt="Payment"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    </div>
                  )}

                  {order.preview_image_url && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Preview Image:</h4>
                      <img
                        src={order.preview_image_url}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                {order.notes && (
                  <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-1">Notes:</h4>
                    <p className="text-sm text-gray-700">{order.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap border-t pt-4">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setAdminNotes(order.notes || '');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Manage Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Manage Order</h2>
                  <button
                    onClick={() => {
                      setSelectedOrder(null);
                      setPreviewFile(null);
                      setStatusUpdate('');
                      setAdminNotes('');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Preview Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePreviewFileChange}
                        className="hidden"
                        id="preview-upload"
                      />
                      <label htmlFor="preview-upload" className="flex flex-col items-center cursor-pointer">
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          {previewFile ? previewFile.name : 'Click to upload preview image'}
                        </span>
                      </label>
                    </div>
                    {previewFile && (
                      <button
                        onClick={() => uploadPreviewImage(selectedOrder.id)}
                        disabled={uploading}
                        className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {uploading ? 'Uploading...' : 'Upload Preview & Update Status'}
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Order Status
                    </label>
                    <select
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select new status...</option>
                      <option value="preview_sent">Preview Sent</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_production">In Production</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes
                    </label>
                    <textarea
                      rows={4}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this order..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {statusUpdate && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, statusUpdate)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Update Status to {statusUpdate.replace('_', ' ').toUpperCase()}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
