import React, { useState, useEffect } from 'react';
import { Download, Eye, Clock, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  designer: {
    name: string;
    profile_image: string | null;
  };
}

interface DesignPreviewProps {
  projectId: string;
  isCustomer?: boolean;
}

const DesignPreview: React.FC<DesignPreviewProps> = ({ projectId, isCustomer = false }) => {
  const [designs, setDesigns] = useState<DesignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState<DesignData | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchDesigns();
  }, [projectId]);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_designs')
        .select(`
          *,
          designer:designers(name, profile_image)
        `)
        .eq('project_id', projectId)
        .neq('status', 'draft')
        .order('version', { ascending: false });

      if (error) throw error;
      setDesigns(data || []);

      if (data && data.length > 0 && !selectedDesign) {
        setSelectedDesign(data[0]);
        setFeedback(data[0].customer_feedback || '');
      }
    } catch (err: any) {
      console.error('Error fetching designs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFeedback = async () => {
    if (!selectedDesign) return;

    setSubmittingFeedback(true);
    try {
      const { error } = await supabase
        .from('project_designs')
        .update({ customer_feedback: feedback })
        .eq('id', selectedDesign.id);

      if (error) throw error;
      await fetchDesigns();
      alert('Feedback saved successfully!');
    } catch (err: any) {
      console.error('Error saving feedback:', err);
      alert('Failed to save feedback: ' + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleApproveDesign = async () => {
    if (!selectedDesign) return;

    setSubmittingFeedback(true);
    try {
      const { error } = await supabase
        .from('project_designs')
        .update({ status: 'approved', customer_feedback: feedback })
        .eq('id', selectedDesign.id);

      if (error) throw error;
      await fetchDesigns();
      alert('Design approved successfully!');
    } catch (err: any) {
      console.error('Error approving design:', err);
      alert('Failed to approve design: ' + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!selectedDesign) return;

    if (!feedback.trim()) {
      alert('Please provide feedback about what changes you would like.');
      return;
    }

    setSubmittingFeedback(true);
    try {
      const { error } = await supabase
        .from('project_designs')
        .update({ status: 'revision_requested', customer_feedback: feedback })
        .eq('id', selectedDesign.id);

      if (error) throw error;
      await fetchDesigns();
      alert('Revision request sent to designer!');
    } catch (err: any) {
      console.error('Error requesting revision:', err);
      alert('Failed to request revision: ' + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'revision_requested':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'submitted':
        return <AlertCircle className="w-4 h-4" />;
      case 'revision_requested':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading designs...</p>
        </div>
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Designs Yet</h3>
          <p className="text-gray-600">
            {isCustomer
              ? 'Your designer has not submitted any designs yet. They will appear here once available.'
              : 'No designs have been submitted for this project.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-800 mb-2">3D Design Submissions</h2>
        <p className="text-gray-600">
          {isCustomer
            ? 'Review the designs submitted by your designer and provide feedback.'
            : 'View all design submissions for this project.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-secondary-800 mb-3">Design Versions</h3>
          <div className="space-y-2">
            {designs.map((design) => (
              <button
                key={design.id}
                onClick={() => {
                  setSelectedDesign(design);
                  setFeedback(design.customer_feedback || '');
                }}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedDesign?.id === design.id
                    ? 'bg-primary-50 border-primary-300'
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-secondary-800">Version {design.version}</span>
                  <span className={`text-xs px-2 py-1 rounded flex items-center space-x-1 ${getStatusColor(design.status)}`}>
                    {getStatusIcon(design.status)}
                    <span>{design.status.replace('_', ' ')}</span>
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(design.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedDesign && (
            <div className="space-y-6">
              {selectedDesign.preview_image_url && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-3">Design Preview</h3>
                  <img
                    src={selectedDesign.preview_image_url}
                    alt={`Design Version ${selectedDesign.version}`}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
              )}

              {selectedDesign.design_file_url && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-3">Design File</h3>
                  <a
                    href={selectedDesign.design_file_url}
                    download
                    className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download 3D Design File</span>
                  </a>
                  <p className="text-sm text-gray-500 mt-2">
                    Download the design file to view and interact with the 3D design.
                  </p>
                </div>
              )}

              {selectedDesign.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-3">Designer Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">{selectedDesign.notes}</p>
                  </div>
                </div>
              )}

              {isCustomer && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-3">Your Feedback</h3>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share your thoughts about this design. What do you like? What would you like to change?"
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />

                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                      onClick={handleApproveDesign}
                      disabled={submittingFeedback || selectedDesign.status === 'approved'}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Approve Design</span>
                    </button>

                    <button
                      onClick={handleRequestRevision}
                      disabled={submittingFeedback || selectedDesign.status === 'approved'}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>Request Changes</span>
                    </button>

                    <button
                      onClick={handleSaveFeedback}
                      disabled={submittingFeedback}
                      className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingFeedback ? 'Saving...' : 'Save Feedback'}
                    </button>
                  </div>
                </div>
              )}

              {selectedDesign.customer_feedback && !isCustomer && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-3">Customer Feedback</h3>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-gray-700 leading-relaxed">{selectedDesign.customer_feedback}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignPreview;
