import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesignerProfile } from '../hooks/useDesignerProfile';
import DesignerVerificationModal from './DesignerVerificationModal';

interface ProtectedDesignerRouteProps {
  children: React.ReactNode;
}

const ProtectedDesignerRoute: React.FC<ProtectedDesignerRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const { designer, loading } = useDesignerProfile();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!designer) {
      navigate('/');
      return;
    }

    if (designer.verification_status === 'pending' || designer.verification_status === 'rejected') {
      setShowModal(true);
    }
  }, [designer, loading, navigate]);

  const handleModalClose = () => {
    setShowModal(false);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!designer || designer.verification_status !== 'verified') {
    return (
      <DesignerVerificationModal
        isOpen={showModal}
        status={designer?.verification_status === 'rejected' ? 'rejected' : 'pending'}
        rejectedReason={designer?.rejected_reason}
        onClose={handleModalClose}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedDesignerRoute;
