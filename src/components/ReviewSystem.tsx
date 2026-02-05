import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageCircle, User, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Review {
  id: string;
  customer_name: string;
  customer_email: string;
  designer_id: string;
  project_id: string;
  rating: number;
  title: string;
  comment: string;
  project_name: string;
  project_type: string;
  completion_date: string;
  would_recommend: boolean;
  helpful_votes: number;
  created_at: string;
  verified_purchase: boolean;
}

interface ReviewSystemProps {
  designerId: string;
  showAddReview?: boolean;
  projectId?: string;
}

const ReviewSystem: React.FC<ReviewSystemProps> = ({ 
  designerId, 
  showAddReview = false, 
  projectId 
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
    would_recommend: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [designerId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          customers:project_id (
            project_name,
            property_type
          )
        `)
        .eq('designer_id', designerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReviews = data.map((review: any) => ({
        id: review.id,
        customer_name: 'Customer',
        customer_email: '',
        designer_id: review.designer_id,
        project_id: review.project_id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        project_name: review.customers?.project_name || 'Project',
        project_type: review.customers?.property_type || 'Residential',
        completion_date: review.created_at,
        would_recommend: review.would_recommend,
        helpful_votes: review.helpful_votes,
        created_at: review.created_at,
        verified_purchase: review.verified_purchase
      }));

      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !projectId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          designer_id: designerId,
          customer_id: user.id,
          project_id: projectId,
          rating: newReview.rating,
          title: newReview.title,
          comment: newReview.comment,
          would_recommend: newReview.would_recommend,
          verified_purchase: true
        });

      if (error) {
        console.error('Error submitting review:', error);
        alert('Failed to submit review. Please try again.');
        return;
      }

      alert('Review submitted successfully!');

      // Reset form
      setNewReview({
        rating: 5,
        title: '',
        comment: '',
        would_recommend: true
      });
      setShowReviewForm(false);

      // Refresh reviews
      await fetchReviews();

    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0
  }));

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-secondary-800">Customer Reviews</h2>
        {showAddReview && user && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="btn-primary"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-secondary-800 mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center mb-2">
            {renderStars(Math.round(averageRating))}
          </div>
          <p className="text-gray-600">Based on {reviews.length} reviews</p>
        </div>

        <div className="space-y-2">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700 w-8">{rating}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Write Your Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              {renderStars(newReview.rating, true, (rating) => 
                setNewReview(prev => ({ ...prev, rating }))
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title *
              </label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Summarize your experience"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Share details about your experience with this designer"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recommend"
                checked={newReview.would_recommend}
                onChange={(e) => setNewReview(prev => ({ ...prev, would_recommend: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="recommend" className="text-sm text-gray-700">
                I would recommend this designer to others
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-secondary-800">{review.customer_name}</p>
                    {review.verified_purchase && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <h4 className="font-semibold text-secondary-800 mb-2">{review.title}</h4>
            <p className="text-gray-600 mb-3 leading-relaxed">{review.comment}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Project: {review.project_name}</span>
                <span>•</span>
                <span>Completed: {new Date(review.completion_date).toLocaleDateString()}</span>
                {review.would_recommend && (
                  <>
                    <span>•</span>
                    <span className="text-green-600 font-medium">Recommends</span>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-1 text-gray-500 hover:text-primary-600 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm">Helpful ({review.helpful_votes})</span>
                </button>
                <button className="flex items-center space-x-1 text-gray-500 hover:text-primary-600 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Reply</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-8">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-500">Be the first to review this designer's work!</p>
        </div>
      )}
    </div>
  );
};

export default ReviewSystem;