import React from 'react';
import { X, Star, Heart, Users } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'designer' | 'customer';
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, userType }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-8 text-center shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Star className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-3xl font-bold text-secondary-800 mb-4">
          Welcome to Our Community!
        </h2>

        {userType === 'designer' ? (
          <div>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Congratulations! You're now part of India's premier interior design platform. 
              Start showcasing your talent and connecting with clients who need your expertise.
            </p>
            <div className="bg-primary-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3 text-primary-800">
                <Users className="w-5 h-5" />
                <span className="font-medium">What's next?</span>
              </div>
              <ul className="mt-2 text-sm text-primary-700 space-y-1 text-left">
                <li>• Complete your profile with portfolio images</li>
                <li>• Set your services and pricing</li>
                <li>• Start receiving project assignments</li>
                <li>• Build your reputation with client reviews</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Congratulations! Your project has been created successfully.
              Now it's time to find the perfect designer to bring your vision to life.
            </p>
            <div className="bg-secondary-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3 text-secondary-800">
                <Heart className="w-5 h-5" />
                <span className="font-medium">Next Steps:</span>
              </div>
              <ul className="mt-2 text-sm text-secondary-700 space-y-1 text-left">
                <li>• Browse our expert designers and their portfolios</li>
                <li>• Select a designer that matches your style and budget</li>
                <li>• Assign your project to your chosen designer</li>
                <li>• Receive quotations and collaborate to finalize design</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
              <p className="text-xs text-blue-800 font-medium">
                💡 Tip: Visit the "Designers" page to explore profiles, view portfolios, and assign your project to the designer of your choice.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full btn-primary"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;