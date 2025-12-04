import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle, User, Mail } from 'lucide-react';
import { useProjectTracking } from '../hooks/useProjectTracking';
import type { Customer } from '../lib/supabase';

interface AssignProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Customer;
  onSuccess?: () => void;
}

const AssignProjectModal: React.FC<AssignProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  project, 
  onSuccess 
}) => {
  const { assignProjectToDesigner } = useProjectTracking();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    designer_email: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.designer_email.trim()) {
      setError('Designer email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.designer_email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await assignProjectToDesigner(
        project.id,
        formData.designer_email.trim(),
        formData.message.trim() || undefined
      );

      setSuccess(true);
      
      // Reset form and close modal after success
      setTimeout(() => {
        setFormData({
          designer_email: '',
          message: ''
        });
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error assigning project to designer:', error);
      setError(error.message || 'Failed to assign project to designer');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        designer_email: '',
        message: ''
      });
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-800">
            Assign Project to Designer
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-secondary-800 mb-2">Project Assigned Successfully!</h3>
            <p className="text-gray-600">
              The designer will be notified and can now collaborate on your project.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-secondary-800 mb-2">Project: {project.project_name}</h3>
              <p className="text-gray-600 text-sm">
                Assign this project to a designer for collaboration and professional guidance.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designer Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="designer_email"
                    value={formData.designer_email}
                    onChange={handleInputChange}
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="designer@example.com"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the email address of the designer you want to assign this project to.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Designer (Optional)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Add a personal message or specific instructions for the designer..."
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-800 mb-1">Assignment Failed</p>
                      <p className="whitespace-pre-line">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-start space-x-2">
                  <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">What happens next?</p>
                    <ul className="mt-1 text-xs space-y-1">
                      <li>• The designer will be notified about the assignment</li>
                      <li>• They can accept or decline the project</li>
                      <li>• Once accepted, they can edit and collaborate on the project</li>
                      <li>• You'll see all changes in the activity log</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Assigning...' : 'Assign Project'}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AssignProjectModal;