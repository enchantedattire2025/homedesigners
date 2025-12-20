import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Download,
  Upload,
  Eye,
  Clock,
  MapPin,
  IndianRupee as Rupee,
  User,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Home
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDesignerProfile } from '../hooks/useDesignerProfile';
import { supabase } from '../lib/supabase';

interface ProjectData {
  id: string;
  project_name: string;
  name: string;
  location: string;
  budget_range: string;
  property_type: string;
  project_area: string;
  requirements: string;
  room_types: string[];
  special_requirements: string;
}

interface DesignData {
  id: string;
  version: number;
  design_file_url: string | null;
  preview_image_url: string | null;
  notes: string;
  customer_feedback: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const Designer3DTool = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { designer, isDesigner } = useDesignerProfile();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [designs, setDesigns] = useState<DesignData[]>([]);
  const [currentDesign, setCurrentDesign] = useState<DesignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    if (!user || !isDesigner) {
      navigate('/');
      return;
    }

    if (projectId) {
      fetchProjectData();
      fetchDesigns();
    }
  }, [projectId, user, isDesigner]);

  const fetchProjectData = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesigns = async () => {
    if (!projectId || !designer) return;

    try {
      const { data, error } = await supabase
        .from('project_designs')
        .select('*')
        .eq('project_id', projectId)
        .eq('designer_id', designer.id)
        .order('version', { ascending: false });

      if (error) throw error;
      setDesigns(data || []);

      if (data && data.length > 0) {
        setCurrentDesign(data[0]);
        setNotes(data[0].notes || '');
      }
    } catch (err: any) {
      console.error('Error fetching designs:', err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId || !designer) return;

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${designer.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-designs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-designs')
        .getPublicUrl(fileName);

      if (currentDesign) {
        const { error: updateError } = await supabase
          .from('project_designs')
          .update({ design_file_url: publicUrl })
          .eq('id', currentDesign.id);

        if (updateError) throw updateError;
      } else {
        const { data: newDesign, error: insertError } = await supabase
          .from('project_designs')
          .insert({
            project_id: projectId,
            designer_id: designer.id,
            design_file_url: publicUrl,
            notes: notes
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setCurrentDesign(newDesign);
      }

      await fetchDesigns();
      alert('Design file uploaded successfully!');
    } catch (err: any) {
      console.error('Error uploading file:', err);
      alert('Failed to upload design file: ' + err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId || !designer) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${designer.id}/preview-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-designs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-designs')
        .getPublicUrl(fileName);

      if (currentDesign) {
        const { error: updateError } = await supabase
          .from('project_designs')
          .update({ preview_image_url: publicUrl })
          .eq('id', currentDesign.id);

        if (updateError) throw updateError;
      }

      await fetchDesigns();
      alert('Preview image uploaded successfully!');
    } catch (err: any) {
      console.error('Error uploading image:', err);
      alert('Failed to upload preview image: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!currentDesign || !projectId || !designer) {
      if (!currentDesign) {
        setSaving(true);
        try {
          const { data: newDesign, error } = await supabase
            .from('project_designs')
            .insert({
              project_id: projectId,
              designer_id: designer.id,
              notes: notes
            })
            .select()
            .single();

          if (error) throw error;
          setCurrentDesign(newDesign);
          await fetchDesigns();
          alert('Notes saved successfully!');
        } catch (err: any) {
          console.error('Error saving notes:', err);
          alert('Failed to save notes: ' + err.message);
        } finally {
          setSaving(false);
        }
      }
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('project_designs')
        .update({ notes: notes })
        .eq('id', currentDesign.id);

      if (error) throw error;
      await fetchDesigns();
      alert('Notes saved successfully!');
    } catch (err: any) {
      console.error('Error saving notes:', err);
      alert('Failed to save notes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitDesign = async () => {
    if (!currentDesign) {
      alert('Please create a design first by adding notes or uploading files.');
      return;
    }

    if (!currentDesign.design_file_url && !currentDesign.preview_image_url) {
      alert('Please upload at least a design file or preview image before submitting.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('project_designs')
        .update({ status: 'submitted' })
        .eq('id', currentDesign.id);

      if (error) throw error;
      await fetchDesigns();
      alert('Design submitted to customer for review!');
    } catch (err: any) {
      console.error('Error submitting design:', err);
      alert('Failed to submit design: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Project</h2>
          <p className="text-gray-600 mb-6">{error || 'Project not found'}</p>
          <button onClick={() => navigate('/designer-dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/customer-projects')}
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </button>
              <h1 className="text-2xl font-bold text-secondary-800">3D Design Tool</h1>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveNotes}
                disabled={saving}
                className="btn-secondary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
              <button
                onClick={handleSubmitDesign}
                disabled={!currentDesign || saving}
                className="btn-primary flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Design
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-white shadow-sm border-r overflow-y-auto">
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-secondary-800 mb-4">Project Details</h3>

              <div className="space-y-3">
                <div>
                  <div className="flex items-start space-x-2">
                    <Home className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Project Name</p>
                      <p className="text-sm text-gray-900">{project.project_name}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start space-x-2">
                    <User className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Customer</p>
                      <p className="text-sm text-gray-900">{project.name}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Location</p>
                      <p className="text-sm text-gray-900">{project.location}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start space-x-2">
                    <Rupee className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Budget</p>
                      <p className="text-sm text-gray-900">{project.budget_range}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Property Type</p>
                  <p className="text-sm text-gray-900">{project.property_type}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Area</p>
                  <p className="text-sm text-gray-900">{project.project_area}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Room Types</p>
                  <div className="flex flex-wrap gap-1">
                    {project.room_types?.map((room, index) => (
                      <span key={index} className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                        {room}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-secondary-800 mb-2">Requirements</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{project.requirements}</p>
            </div>

            {project.special_requirements && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-secondary-800 mb-2">Special Requirements</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{project.special_requirements}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-secondary-800 mb-3">Design Files</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Design File (.sh3d)
                  </label>
                  <label className="flex items-center justify-center w-full h-24 px-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-sm text-gray-600">
                        {uploadingFile ? 'Uploading...' : 'Click to upload'}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".sh3d"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                  </label>
                  {currentDesign?.design_file_url && (
                    <a
                      href={currentDesign.design_file_url}
                      download
                      className="mt-2 flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download current file
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Preview Image
                  </label>
                  <label className="flex items-center justify-center w-full h-24 px-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                    <div className="text-center">
                      <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-sm text-gray-600">
                        {uploadingImage ? 'Uploading...' : 'Click to upload'}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                  {currentDesign?.preview_image_url && (
                    <div className="mt-2">
                      <img
                        src={currentDesign.preview_image_url}
                        alt="Design preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-secondary-800 mb-2">Design Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about your design decisions, materials used, color schemes, etc."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            {designs.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-secondary-800 mb-3">Version History</h3>
                <div className="space-y-2">
                  {designs.map((design) => (
                    <div
                      key={design.id}
                      onClick={() => {
                        setCurrentDesign(design);
                        setNotes(design.notes);
                      }}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        currentDesign?.id === design.id
                          ? 'bg-primary-50 border-primary-300'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Version {design.version}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          design.status === 'approved' ? 'bg-green-100 text-green-800' :
                          design.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          design.status === 'revision_requested' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {design.status}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(design.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white">
          {showInstructions && (
            <div className="bg-blue-50 border-b border-blue-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">How to use Sweet Home 3D</h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Use the tool below to create your 3D floor plan and design</li>
                    <li>When finished, use File → Save to download the .sh3d file</li>
                    <li>Upload the .sh3d file using the upload button in the left panel</li>
                    <li>Take screenshots of your 3D views and upload as preview images</li>
                    <li>Add design notes explaining your choices</li>
                    <li>Click "Submit Design" to send to the customer for review</li>
                  </ol>
                </div>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-blue-600 hover:text-blue-800 ml-4"
                >
                  <FileText className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 relative">
            <iframe
              src="https://www.sweethome3d.com/SweetHome3DJSOnline.jsp"
              className="w-full h-full border-0"
              title="Sweet Home 3D Design Tool"
              allow="fullscreen"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Designer3DTool;
