import React, { useState } from 'react';
import { X, Upload, Compass, Sun, Wind, Heater as Water, Home, Check, AlertTriangle, Loader } from 'lucide-react';

interface VastuAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  existingLayoutUrl?: string;
}

interface VastuRecommendation {
  zone: string;
  element: string;
  status: 'good' | 'warning' | 'bad';
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

const VastuAnalysisModal: React.FC<VastuAnalysisModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId,
  existingLayoutUrl
}) => {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'results'>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(existingLayoutUrl || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [vastuScore, setVastuScore] = useState(0);
  const [recommendations, setRecommendations] = useState<VastuRecommendation[]>([]);
  
  // Initialize state and start analysis when modal opens with existing layout
  React.useEffect(() => {
    if (isOpen) {
      if (existingLayoutUrl) {
        setUploadedImage(existingLayoutUrl);
      }
    }
  }, [isOpen, existingLayoutUrl]);

  // Start analysis immediately when modal opens with existing layout
  React.useEffect(() => {
    if (isOpen && existingLayoutUrl) {
      if (step === 'upload') {
        setStep('analyzing');
      }
      if (step === 'analyzing') {
        simulateAnalysis();
      }
    }
  }, [isOpen, existingLayoutUrl, step]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.includes('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }
    
    setError(null);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Simulate upload progress
    simulateUpload();
  };
  
  const simulateUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep('analyzing');
          simulateAnalysis();
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };
  
  const simulateAnalysis = async () => {
    try {
      // Call the Vastu analysis Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/vastu-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            projectId: projectId,
            layoutImageUrl: uploadedImage || existingLayoutUrl
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze floor plan');
      }

      const data = await response.json();

      const score = data.score;
      setVastuScore(score);

      setRecommendations(data.recommendations);
      setStep('results');
    } catch (error) {
      console.error('Error analyzing floor plan:', error);
      setError('Failed to analyze floor plan. Please try again.');
      setStep('upload');
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'bad') => {
    switch (status) {
      case 'good':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'bad':
        return <X className="w-4 h-4 text-red-500" />;
    }
  };
  
  const getStatusColor = (status: 'good' | 'warning' | 'bad') => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'bad':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };
  
  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">High Priority</span>;
      case 'medium':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">Medium Priority</span>;
      case 'low':
        return <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">Low Priority</span>;
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getElementIcon = (element: string) => {
    switch (element.toLowerCase()) {
      case 'water':
        return <Water className="w-4 h-4" />;
      case 'fire':
        return <Sun className="w-4 h-4" />;
      case 'air':
        return <Wind className="w-4 h-4" />;
      case 'earth':
        return <Home className="w-4 h-4" />;
      default:
        return <Compass className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;
  
  // If we have an existing layout URL and we're still in upload step, skip to analyzing
  if (existingLayoutUrl && step === 'upload') {
    setStep('analyzing');
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Compass className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-secondary-800">AI Vastu Shastra Analysis</h2>
              <p className="text-sm text-gray-600">Get personalized Vastu recommendations for your home</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 'upload' && !existingLayoutUrl && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-800 mb-4">Upload Your Floor Plan</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Upload your 2D home layout to receive AI-powered Vastu Shastra analysis and recommendations.
              </p>
              
              <div className="mb-8">
                <label className="block w-full max-w-md mx-auto">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG or PDF (max. 5MB)</p>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,application/pdf" 
                      onChange={handleFileChange}
                    />
                  </div>
                </label>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg max-w-md mx-auto mb-6">
                  {error}
                </div>
              )}
              
              <div className="text-sm text-gray-500 max-w-md mx-auto">
                <p className="font-medium mb-2">How it works:</p>
                <ol className="space-y-2 text-left list-decimal pl-5">
                  <li>Upload your floor plan or 2D layout</li>
                  <li>Our AI analyzes the layout according to Vastu principles</li>
                  <li>Receive personalized recommendations for each zone</li>
                  <li>Implement suggestions to improve energy flow in your home</li>
                </ol>
              </div>
            </div>
          )}
          
          {step === 'analyzing' && (
            <div className="text-center py-12">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div 
                  className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent"
                  style={{ 
                    animation: 'spin 1.5s linear infinite',
                    clipPath: uploadedImage ? 'none' : `polygon(0 0, 100% 0, 100% ${uploadProgress}%, 0 ${uploadProgress}%)`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Compass className="w-12 h-12 text-primary-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-secondary-800 mb-4">
                Analyzing Your Floor Plan
              </h3>
              
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Our AI is analyzing your floor plan according to Vastu Shastra principles. This will take just a moment...
              </p>
              
              {uploadedImage && (
                <div className="max-w-md mx-auto mb-8 relative">
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={uploadedImage} 
                      alt="Floor plan" 
                      className="w-full h-48 object-contain bg-gray-50"
                    />
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <Loader className="w-8 h-8 text-primary-600 animate-spin mb-2" />
                        <span className="text-sm font-medium text-gray-700">Analyzing...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center space-x-2 text-sm text-gray-500">
                <span>Identifying zones</span>
                <span>•</span>
                <span>Checking alignments</span>
                <span>•</span>
                <span>Generating recommendations</span>
              </div>
            </div>
          )}
          
          {step === 'results' && (
            <div className="py-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-1">
                  {uploadedImage && (
                    <div className="rounded-lg overflow-hidden border border-gray-200 mb-6">
                      <img 
                        src={uploadedImage} 
                        alt="Analyzed floor plan" 
                        className="w-full object-contain bg-gray-50"
                      />
                    </div>
                  )}
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center">
                      <Compass className="w-5 h-5 mr-2 text-primary-600" />
                      Vastu Score
                    </h3>
                    
                    <div className="flex items-center justify-center mb-4">
                      <div className="relative">
                        <svg className="w-32 h-32">
                          <circle
                            className="text-gray-200"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r="58"
                            cx="64"
                            cy="64"
                          />
                          <circle
                            className="text-primary-500"
                            strokeWidth="8"
                            strokeDasharray={365}
                            strokeDashoffset={365 - (365 * vastuScore) / 100}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="58"
                            cx="64"
                            cy="64"
                          />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                          <p className={`text-3xl font-bold ${getScoreColor(vastuScore)}`}>{vastuScore}%</p>
                          <p className="text-xs text-gray-500">Vastu Compliance</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p className="mb-4">
                        {vastuScore >= 85 
                          ? 'Your home layout has excellent Vastu alignment. Minor adjustments can perfect the energy flow.'
                          : vastuScore >= 70
                          ? 'Your home has good Vastu alignment with some areas needing attention.'
                          : 'Your home layout has several Vastu misalignments that should be addressed.'}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Directional Alignment</span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${Math.min(100, vastuScore + Math.floor(Math.random() * 10) - 5)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Room Placement</span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${Math.min(100, vastuScore + Math.floor(Math.random() * 10) - 5)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Element Balance</span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${Math.min(100, vastuScore + Math.floor(Math.random() * 10) - 5)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-2">
                  <h3 className="text-xl font-bold text-secondary-800 mb-6">Vastu Recommendations</h3>
                  
                  <div className="space-y-4">
                    {recommendations.map((rec, index) => (
                      <div 
                        key={index} 
                        className={`border rounded-lg p-4 ${getStatusColor(rec.status)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                              {getElementIcon(rec.element)}
                            </div>
                            <h4 className="font-semibold">{rec.zone}</h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(rec.status)}
                            {getPriorityBadge(rec.priority)}
                          </div>
                        </div>
                        <p className="text-sm ml-10">{rec.recommendation}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-medium mb-2">About Vastu Shastra Analysis:</p>
                    <p>
                      These recommendations are generated by our AI based on traditional Vastu principles. 
                      For a more detailed analysis, consider consulting with one of our Vastu-specialized designers.
                    </p>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        // In a real implementation, this would save the analysis to the database
                        // and potentially connect the user with a Vastu specialist
                        alert('Your Vastu analysis has been saved. A Vastu specialist will contact you soon.');
                        onClose();
                      }}
                      className="btn-primary py-2"
                    >
                      Save & Connect with Vastu Specialist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VastuAnalysisModal;