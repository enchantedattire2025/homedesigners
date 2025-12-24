import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Loader2,
  AlertCircle,
  Home,
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface QuoteItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  amount: number;
}

interface Quote {
  id: string;
  quote_number: string;
  title: string;
  description: string;
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  valid_until: string;
  terms_and_conditions: string;
  notes: string;
  created_at: string;
  design_image_url?: string;
  designer: {
    name: string;
    email: string;
    phone: string;
    location: string;
    specialization: string;
  };
  project: {
    name: string;
    email: string;
    phone: string;
    location: string;
    property_type: string;
    project_name: string;
  };
  items: QuoteItem[];
}

const QuoteViewer = () => {
  const { id: projectId } = useParams();
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('id');
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (quoteId) {
      fetchQuote();
    } else {
      setError('No quote ID provided');
      setLoading(false);
    }
  }, [quoteId]);

  const fetchQuote = async () => {
    if (!quoteId) return;

    try {
      setLoading(true);
      setError(null);

      const { data: quoteData, error: quoteError } = await supabase
        .from('designer_quotes')
        .select(`
          *,
          designer:designers(name, email, phone, location, specialization),
          project:customers(name, email, phone, location, property_type, project_name)
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      setQuote({
        ...quoteData,
        items: itemsData || []
      });
    } catch (error: any) {
      console.error('Error fetching quote:', error);
      setError(error.message || 'Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!printRef.current) return;

    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-800 mb-4">Error Loading Quote</h2>
          <p className="text-gray-600 mb-8">{error || 'Quote not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
            .print-break-inside {
              break-inside: avoid;
            }
          }
        `}
      </style>

      <div className="no-print bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div id="print-area" ref={printRef} className="bg-white rounded-xl shadow-lg p-12">
          <div className="flex flex-col md:flex-row justify-between items-start mb-12 print-break-inside">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-secondary-800">{quote.designer.name}</h3>
                  <p className="text-gray-600">{quote.designer.specialization}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{quote.designer.email}</p>
                <p>{quote.designer.phone}</p>
                <p>{quote.designer.location}</p>
              </div>
            </div>

            <div className="mt-6 md:mt-0 text-right">
              <h3 className="text-3xl font-bold text-primary-600 mb-3">QUOTATION</h3>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Quote #:</span> {quote.quote_number}
              </p>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Date:</span> {new Date(quote.created_at).toLocaleDateString()}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Valid Until:</span> {new Date(quote.valid_until).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8 print-break-inside">
            <h4 className="font-semibold text-secondary-800 mb-4 text-lg">Client Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Client Name</p>
                <p className="font-medium text-gray-800">{quote.project.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Project</p>
                <p className="font-medium text-gray-800">{quote.project.project_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-800">{quote.project.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-800">{quote.project.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-800">{quote.project.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Property Type</p>
                <p className="font-medium text-gray-800">{quote.project.property_type}</p>
              </div>
            </div>
          </div>

          <div className="mb-8 print-break-inside">
            <h4 className="font-semibold text-secondary-800 mb-3 text-lg">Quote Description</h4>
            <p className="text-gray-600">{quote.description || 'No description provided.'}</p>
          </div>

          {quote.design_image_url && (
            <div className="mb-8 print-break-inside">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-secondary-800 text-lg">2D Design Preview</h4>
                <a
                  href={quote.design_image_url}
                  download="2d-design-preview.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-print flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Design</span>
                </a>
              </div>
              <a
                href={quote.design_image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:border-primary-400 transition-colors cursor-pointer"
                title="Click to view full size"
              >
                <img
                  src={quote.design_image_url}
                  alt="2D Design Preview"
                  className="w-full h-auto"
                />
              </a>
              <p className="text-sm text-gray-500 mt-2">
                This design was created using our 2D design tool to help you visualize the proposed layout. Click the image to view it in full size or use the download button to save it.
              </p>
            </div>
          )}

          <div className="mb-8">
            <h4 className="font-semibold text-secondary-800 mb-4 text-lg">Quote Items</h4>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-secondary-800 border-b">Item</th>
                    <th className="text-left py-3 px-4 font-semibold text-secondary-800 border-b">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-secondary-800 border-b">Qty</th>
                    <th className="text-right py-3 px-4 font-semibold text-secondary-800 border-b">Unit</th>
                    <th className="text-right py-3 px-4 font-semibold text-secondary-800 border-b">Unit Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-secondary-800 border-b">Discount</th>
                    <th className="text-right py-3 px-4 font-semibold text-secondary-800 border-b">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-800">{item.name}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{item.description || '-'}</td>
                      <td className="py-3 px-4 text-right text-gray-800">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{item.unit}</td>
                      <td className="py-3 px-4 text-right text-gray-800">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{item.discount_percent}%</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-800">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end mb-8 print-break-inside">
            <div className="w-full md:w-80">
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(quote.subtotal)}</span>
                </div>
                {quote.discount_amount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Discount:</span>
                    <span className="font-medium text-green-600">-{formatCurrency(quote.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>Tax ({quote.tax_rate}%):</span>
                  <span className="font-medium">{formatCurrency(quote.tax_amount)}</span>
                </div>
                <div className="border-t border-gray-300 pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-secondary-800">Total:</span>
                    <span className="text-primary-600">{formatCurrency(quote.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {quote.terms_and_conditions && (
              <div className="print-break-inside">
                <h4 className="font-semibold text-secondary-800 mb-3 text-lg">Terms and Conditions</h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-line">
                  {quote.terms_and_conditions}
                </div>
              </div>
            )}

            {quote.notes && (
              <div className="print-break-inside">
                <h4 className="font-semibold text-secondary-800 mb-3 text-lg">Notes</h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                  {quote.notes}
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Thank you for your business</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteViewer;
