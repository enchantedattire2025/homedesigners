import React from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DesignerVerificationModalProps {
  isOpen: boolean;
  status: 'pending' | 'rejected';
  rejectedReason?: string;
  onClose: () => void;
}

const DesignerVerificationModal: React.FC<DesignerVerificationModalProps> = ({
  isOpen,
  status,
  rejectedReason,
  onClose
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          {status === 'pending' && (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-secondary-800 mb-4 text-center">
                Account Pending Verification
              </h2>
              <p className="text-gray-600 mb-6 text-center">
                Thank you for registering as a designer! Your profile is currently under review by our admin team.
                You will be able to access the dashboard once your account is verified.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 text-center">
                  This process typically takes 24-48 hours. We will notify you via email once your account is approved.
                </p>
              </div>
            </>
          )}

          {status === 'rejected' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-secondary-800 mb-4 text-center">
                Account Verification Rejected
              </h2>
              <p className="text-gray-600 mb-4 text-center">
                Unfortunately, your designer profile was not approved by our admin team.
              </p>
              {rejectedReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-red-800 mb-2 text-center">Reason for Rejection:</p>
                  <p className="text-sm text-red-700 text-center">{rejectedReason}</p>
                </div>
              )}
              <p className="text-gray-600 mb-6 text-center">
                If you believe this is an error or would like to reapply, please contact our support team for assistance.
              </p>
            </>
          )}

          <button
            onClick={handleClose}
            className="w-full btn-primary py-3"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignerVerificationModal;
