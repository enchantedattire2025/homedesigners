import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Quote {
  id: string;
  quote_number: string;
  title: string;
  project_id: string;
  total_amount: number;
  status: string;
  customer_name?: string;
  project_title?: string;
}

interface SaveDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quoteId: string) => Promise<void>;
  designerId: string;
}

const SaveDesignModal: React.FC<SaveDesignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  designerId
}) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && designerId) {
      fetchDesignerQuotes();
    }
  }, [isOpen, designerId]);

  const fetchDesignerQuotes = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!designerId) {
        console.error('No designer ID provided');
        setError('Designer ID not found. Please try refreshing the page.');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('designer_quotes')
        .select(`
          id,
          quote_number,
          title,
          project_id,
          total_amount,
          status,
          customers!designer_quotes_project_id_fkey (
            name,
            project_name
          )
        `)
        .eq('designer_id', designerId)
        .in('status', ['draft', 'sent', 'under_review'])
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      const formattedQuotes = data?.map((quote: any) => ({
        id: quote.id,
        quote_number: quote.quote_number,
        title: quote.title,
        project_id: quote.project_id,
        total_amount: quote.total_amount,
        status: quote.status,
        customer_name: quote.customers?.name,
        project_title: quote.customers?.project_name
      })) || [];

      setQuotes(formattedQuotes);

      if (formattedQuotes.length > 0) {
        setSelectedQuoteId(formattedQuotes[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching quotes:', err);
      setError(err.message || 'Failed to load quotations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedQuoteId) {
      setError('Please select a quotation');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(selectedQuoteId);
      onClose();
    } catch (err) {
      console.error('Error saving design:', err);
      setError('Failed to save design. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-secondary-800">Save Design to Quotation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={saving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <span className="ml-3 text-gray-600">Loading quotations...</span>
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-2">No active quotations found</p>
              <p className="text-sm text-gray-500">
                Create a quotation first before saving designs
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Quotation to Attach Design
              </label>

              <div className="space-y-3">
                {quotes.map((quote) => (
                  <label
                    key={quote.id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedQuoteId === quote.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="quote"
                      value={quote.id}
                      checked={selectedQuoteId === quote.id}
                      onChange={(e) => setSelectedQuoteId(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-semibold text-gray-900">
                            {quote.quote_number}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              quote.status === 'draft'
                                ? 'bg-gray-100 text-gray-700'
                                : quote.status === 'sent'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {quote.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {quote.title}
                        </p>
                        {quote.customer_name && (
                          <p className="text-sm text-gray-600">
                            Customer: {quote.customer_name}
                          </p>
                        )}
                        {quote.project_title && (
                          <p className="text-sm text-gray-600">
                            Project: {quote.project_title}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">
                          ₹{quote.total_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The 2D design will be saved as an image and attached to
                  the selected quotation. Customers will be able to view this design when they
                  review the quotation.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || quotes.length === 0 || !selectedQuoteId}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Design
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveDesignModal;
