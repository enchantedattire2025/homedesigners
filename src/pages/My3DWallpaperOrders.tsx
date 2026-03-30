import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Calendar, MapPin, Image, CreditCard, CheckCircle, Clock, XCircle, Truck, Eye } from 'lucide-react';
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

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  preview_sent: { label: 'Preview Sent', icon: Eye, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  in_production: { label: 'In Production', icon: Truck, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-700 bg-green-100 border-green-300' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
};

export default function My3DWallpaperOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<WallpaperOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<WallpaperOrder | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!customerData) {
        setOrders([]);
        return;
      }

      const { data, error } = await supabase
        .from('wallpaper_orders')
        .select('*')
        .eq('customer_id', customerData.id)
        .order('order_date', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getWallpaperTypeLabel = (type: string) => {
    return type === 'golden_foil' ? 'Golden Foil 3D Wallpaper' : 'Normal 3D Wallpaper';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Please Log In</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your orders</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My 3D Wallpaper Orders</h1>
          <p className="text-gray-600">Track and manage your 3D wallpaper orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Orders Yet</h3>
            <p className="text-gray-500 mb-6">You haven't placed any 3D wallpaper orders yet.</p>
            <button
              onClick={() => navigate('/wallpaper-gallery')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse 3D Wallpapers
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => {
              const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock;
              const statusStyle = statusConfig[order.status as keyof typeof statusConfig]?.color || statusConfig.pending.color;
              const statusLabel = statusConfig[order.status as keyof typeof statusConfig]?.label || order.status;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-6 h-6 text-blue-600" />
                          <h3 className="text-xl font-bold text-gray-900">
                            Order #{order.id.substring(0, 8).toUpperCase()}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Ordered on {formatDate(order.order_date)}</span>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${statusStyle}`}>
                        <StatusIcon className="w-5 h-5" />
                        <span className="font-semibold">{statusLabel}</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Wallpaper Type</h4>
                        <p className="text-gray-900 font-medium">{getWallpaperTypeLabel(order.wallpaper_type)}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Wall Dimensions</h4>
                        <p className="text-gray-900 font-medium">
                          {order.wall_size_length} x {order.wall_size_height} {order.wall_unit}
                        </p>
                        <p className="text-sm text-gray-600">({order.total_area_sqft} sq ft)</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Total Amount</h4>
                        <p className="text-2xl font-bold text-green-600">₹{order.total_amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Advance: ₹{order.advance_amount.toLocaleString()}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Delivery Address
                        </h4>
                        <p className="text-gray-900 text-sm">{order.customer_address}</p>
                      </div>

                      {order.reference_images && order.reference_images.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            Reference Images
                          </h4>
                          <div className="flex gap-2 flex-wrap">
                            {order.reference_images.map((img, idx) => (
                              <a
                                key={idx}
                                href={img}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition"
                              >
                                <img src={img} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {order.preview_image_url && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Preview Design
                          </h4>
                          <a
                            href={order.preview_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <img
                              src={order.preview_image_url}
                              alt="Preview"
                              className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200 hover:border-blue-500 transition"
                            />
                          </a>
                        </div>
                      )}
                    </div>

                    {order.notes && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
                        <p className="text-gray-600 text-sm">{order.notes}</p>
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                      {order.payment_screenshot_url && (
                        <a
                          href={order.payment_screenshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition border border-green-200"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>View Payment</span>
                        </a>
                      )}

                      {order.status === 'preview_sent' && (
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Confirm Order</span>
                        </button>
                      )}
                    </div>

                    {order.confirmation_date && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          Confirmed on {formatDate(order.confirmation_date)}
                        </p>
                      </div>
                    )}

                    {order.delivery_date && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Delivered on {formatDate(order.delivery_date)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
