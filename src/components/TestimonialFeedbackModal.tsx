import React, { useState } from 'react';
import { X, Star, Send, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TestimonialFeedbackModalProps {
  projectId: string;
  projectName: string;
  designerId: string;
  designerName: string;
  customerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TestimonialFeedbackModal: React.FC<TestimonialFeedbackModalProps> = ({
  projectId,
  projectName,
  designerId,
  designerName,
  customerId,
  onClose,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a title');
      return;
    }

    if (!comment.trim()) {
      setError('Please provide your feedback');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          designer_id: designerId,
          customer_id: customerId,
          project_id: projectId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          would_recommend: wouldRecommend,
          verified_purchase: true,
          is_featured: false
        });

      if (reviewError) throw reviewError;

      const { data: designerData } = await supabase
        .from('designers')
        .select('rating, total_reviews')
        .eq('id', designerId)
        .single();

      if (designerData) {
        const currentTotalReviews = designerData.total_reviews || 0;
        const currentRating = designerData.rating || 0;
        const newTotalReviews = currentTotalReviews + 1;
        const newRating = ((currentRating * currentTotalReviews) + rating) / newTotalReviews;

        await supabase
          .from('designers')
          .update({
            rating: newRating,
            total_reviews: newTotalReviews
          })
          .eq('id', designerId);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-secondary-800">Share Your Experience</h2>
            <p className="text-sm text-gray-600 mt-1">Project: {projectName}</p>
            <p className="text-sm text-gray-600">Designer: {designerName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating *
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-3 text-lg font-medium text-gray-700">
                {rating > 0 ? `${rating} out of 5` : 'Select rating'}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Review Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Excellent work and great attention to detail"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Your Feedback *
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Share your experience working with this designer. What did you like most? How was the communication and final result?"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{comment.length}/1000 characters</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wouldRecommend}
                onChange={(e) => setWouldRecommend(e.target.checked)}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">
                I would recommend this designer to others
              </span>
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Your feedback will be displayed as a testimonial on the designer's profile page, helping other customers make informed decisions.
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestimonialFeedbackModal;
