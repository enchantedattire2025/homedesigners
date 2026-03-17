import React, { useState, useEffect } from 'react';
import { Upload, X, Check, Image as ImageIcon, Trash2, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProjectImage {
  id: string;
  image_url: string;
  caption: string | null;
  is_primary: boolean;
  display_order: number;
}

interface ProjectImageUploaderProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onUploadComplete: () => void;
}

export default function ProjectImageUploader({
  projectId,
  projectName,
  onClose,
  onUploadComplete
}: ProjectImageUploaderProps) {
  const [existingImages, setExistingImages] = useState<ProjectImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);

  useEffect(() => {
    fetchExistingImages();
  }, [projectId]);

  const fetchExistingImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_images')
        .select('*')
        .eq('project_id', projectId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setExistingImages(data || []);
      const primary = data?.find(img => img.is_primary);
      if (primary) setPrimaryImageId(primary.id);
    } catch (error: any) {
      console.error('Error fetching images:', error);
      alert('Failed to load existing images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSelectedFiles(prev => [...prev, ...files]);
    setCaptions(prev => [...prev, ...new Array(files.length).fill('')]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePreview = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setCaptions(prev => prev.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    setCaptions(prev => {
      const newCaptions = [...prev];
      newCaptions[index] = caption;
      return newCaptions;
    });
  };

  const uploadImage = async (file: File, caption: string, displayOrder: number): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('project-gallery')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('project-gallery')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one image');
      return;
    }

    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const startOrder = existingImages.length;

      for (let i = 0; i < selectedFiles.length; i++) {
        const imageUrl = await uploadImage(selectedFiles[i], captions[i], startOrder + i);

        const { error: dbError } = await supabase
          .from('project_images')
          .insert({
            project_id: projectId,
            image_url: imageUrl,
            caption: captions[i] || null,
            is_primary: existingImages.length === 0 && i === 0,
            display_order: startOrder + i,
            uploaded_by: user.id
          });

        if (dbError) throw dbError;
      }

      alert('Images uploaded successfully!');
      onUploadComplete();
      onClose();
    } catch (error: any) {
      console.error('Error uploading images:', error);
      alert(`Failed to upload images: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteExistingImage = async (imageId: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const { error } = await supabase
        .from('project_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('project-gallery')
          .remove([`${projectId}/${fileName}`]);
      }

      fetchExistingImages();
      alert('Image deleted successfully');
    } catch (error: any) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const setPrimaryImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('project_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) throw error;

      setPrimaryImageId(imageId);
      fetchExistingImages();
      alert('Primary image updated');
    } catch (error: any) {
      console.error('Error setting primary image:', error);
      alert('Failed to set primary image');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upload Project Images</h2>
            <p className="text-gray-600 mt-1">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading images...</p>
            </div>
          ) : (
            <>
              {existingImages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.image_url}
                          alt={image.caption || 'Project image'}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        {image.is_primary && (
                          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>Primary</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                          {!image.is_primary && (
                            <button
                              onClick={() => setPrimaryImage(image.id)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition-colors"
                              title="Set as primary"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteExistingImage(image.id, image.image_url)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                            title="Delete image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {image.caption && (
                          <p className="mt-2 text-sm text-gray-600">{image.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Images</h3>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Click to upload images
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, WEBP up to 10MB each
                    </p>
                  </label>
                </div>

                {previews.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h4 className="font-medium text-gray-900">Selected Images ({previews.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {previews.map((preview, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removePreview(index)}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Add caption (optional)"
                            value={captions[index]}
                            onChange={(e) => updateCaption(index, e.target.value)}
                            className="w-full mt-3 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Upload Images</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
