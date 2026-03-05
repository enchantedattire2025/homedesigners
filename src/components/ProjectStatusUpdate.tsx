import React, { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useDesignerProfile } from '../hooks/useDesignerProfile';

interface ProjectStatusUpdateProps {
  projectId: string;
  currentStatus: string;
  onStatusUpdate: () => void;
}

const ProjectStatusUpdate: React.FC<ProjectStatusUpdateProps> = ({ 
  projectId, 
  currentStatus, 
  onStatusUpdate 
}) => {
  const { user } = useAuth();
  const { designer, isDesigner } = useDesignerProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Define status progression logic
  const isStatusDisabled = (status: string) => {
    // Once completed, no status changes allowed
    if (currentStatus === 'completed') {
      return true;
    }

    // Once a project is finalized, it cannot go back to assigned or pending
    if (['finalized', 'in_progress'].includes(currentStatus)) {
      return ['assigned', 'pending'].includes(status);
    }
    return false;
  };

  const statusOptions = [
    { value: 'assigned', label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'finalized', label: 'Finalized', color: 'bg-purple-100 text-purple-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-orange-100 text-orange-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' }
  ];

  const handleStatusChange = async (newStatus: string) => {
    if (!user || !isDesigner || !designer) {
      setError('You must be logged in as a designer to update project status');
      return;
    }

    if (newStatus === currentStatus) {
      return; // No change needed
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update the project status
      const { error } = await supabase
        .from('customers')
        .update({ 
          assignment_status: newStatus,
          last_modified_by: user.id
        })
        .eq('id', projectId)
        .eq('assigned_designer_id', designer.id);

      if (error) throw error;

      setSuccess(`Project status updated to ${newStatus}`);
      onStatusUpdate();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error updating project status:', error);
      setError(error.message || 'Failed to update project status');
    } finally {
      setLoading(false);
    }
  };

  // Only show for designers
  if (!isDesigner) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-primary-600" />
        Project Status
      </h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 flex items-start space-x-2">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {statusOptions.map((status) => (
          <button
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            disabled={loading || status.value === currentStatus || isStatusDisabled(status.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              status.value === currentStatus
                ? `${status.color} border border-current`
                : isStatusDisabled(status.value)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {status.value === currentStatus && loading ? (
              <Loader2 className="w-4 h-4 mr-1 inline animate-spin" />
            ) : null}
            {status.label}
          </button>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-500 space-y-2">
        <p>Current status: <span className="font-medium">{currentStatus || 'Not set'}</span></p>
        <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>

        {currentStatus === 'completed' && (
          <div className="flex items-start space-x-2 text-green-600 bg-green-50 p-3 rounded-lg mt-3">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              This project is marked as completed. No further status changes or edits are allowed.
              All project details and updates are now locked.
            </p>
          </div>
        )}

        {['finalized', 'in_progress'].includes(currentStatus) && (
          <div className="flex items-start space-x-2 text-blue-600 bg-blue-50 p-3 rounded-lg mt-3">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Once a project is finalized, it cannot be moved back to assigned or pending status.
              This ensures project continuity and maintains the integrity of the workflow.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectStatusUpdate;