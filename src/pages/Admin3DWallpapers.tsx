import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, CreditCard as Edit2, Eye, EyeOff, Plus, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Wallpaper {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  "Geometric",
  "Nature",
  "Luxury",
  "Modern",
  "Floral",
  "Industrial",
  "Texture",
  "Abstract",
  "Wood",
  "Zen",
  "Space",
  "Urban"
];

export default function Admin3DWallpapers() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWallpaper, setEditingWallpaper] = useState<Wallpaper | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Geometric',
    is_active: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/admin-login');
      return;
    }

    fetchWallpapers();
  }, [user, isAdmin, navigate]);

  const fetchWallpapers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallpapers_3d')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWallpapers(data || []);
    } catch (error) {
      console.error('Error fetching wallpapers:', error);
      alert('Failed to load wallpapers');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('wallpaper-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('wallpaper-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile && !editingWallpaper) {
      alert('Please select an image');
      return;
    }

    try {
      setUploading(true);

      let imageUrl = editingWallpaper?.image_url || '';

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const wallpaperData = {
        title: formData.title,
        description: formData.description || null,
        image_url: imageUrl,
        category: formData.category,
        is_active: formData.is_active,
        created_by: user?.id
      };

      if (editingWallpaper) {
        const { error } = await supabase
          .from('wallpapers_3d')
          .update(wallpaperData)
          .eq('id', editingWallpaper.id);

        if (error) throw error;
        alert('Wallpaper updated successfully!');
      } else {
        const { error } = await supabase
          .from('wallpapers_3d')
          .insert([wallpaperData]);

        if (error) throw error;
        alert('Wallpaper added successfully!');
      }

      closeModal();
      fetchWallpapers();
    } catch (error) {
      console.error('Error saving wallpaper:', error);
      alert('Failed to save wallpaper');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (wallpaper: Wallpaper) => {
    setEditingWallpaper(wallpaper);
    setFormData({
      title: wallpaper.title,
      description: wallpaper.description || '',
      category: wallpaper.category,
      is_active: wallpaper.is_active
    });
    setImagePreview(wallpaper.image_url);
    setShowModal(true);
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this wallpaper?')) return;

    try {
      const { error } = await supabase
        .from('wallpapers_3d')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const imagePath = imageUrl.split('/').pop();
      if (imagePath) {
        await supabase.storage
          .from('wallpaper-images')
          .remove([imagePath]);
      }

      alert('Wallpaper deleted successfully!');
      fetchWallpapers();
    } catch (error) {
      console.error('Error deleting wallpaper:', error);
      alert('Failed to delete wallpaper');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('wallpapers_3d')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchWallpapers();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWallpaper(null);
    setFormData({
      title: '',
      description: '',
      category: 'Geometric',
      is_active: true
    });
    setImageFile(null);
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">3D Wallpaper Management</h1>
            <p className="text-gray-600 mt-2">Upload and manage 3D wallpapers for the gallery</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Wallpaper
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
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
                {wallpapers.map((wallpaper) => (
                  <tr key={wallpaper.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={wallpaper.image_url}
                        alt={wallpaper.title}
                        className="h-16 w-24 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{wallpaper.title}</div>
                      {wallpaper.description && (
                        <div className="text-sm text-gray-500">{wallpaper.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {wallpaper.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(wallpaper.id, wallpaper.is_active)}
                        className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full ${
                          wallpaper.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {wallpaper.is_active ? (
                          <>
                            <Eye className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(wallpaper)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(wallpaper.id, wallpaper.image_url)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {wallpapers.length === 0 && (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No wallpapers yet</h3>
                <p className="text-gray-600">Get started by adding your first 3D wallpaper</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingWallpaper ? 'Edit Wallpaper' : 'Add New Wallpaper'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wallpaper Image *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(editingWallpaper?.image_url || null);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Change Image
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <label className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-800 font-medium">
                            Upload an image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 3D Geometric Cube Pattern"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Brief description of the wallpaper design"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active (visible in gallery)
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      editingWallpaper ? 'Update Wallpaper' : 'Add Wallpaper'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
