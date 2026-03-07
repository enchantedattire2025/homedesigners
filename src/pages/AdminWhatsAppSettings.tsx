import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Save, AlertCircle, CheckCircle, Loader2, Eye, EyeOff, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface WhatsAppSettings {
  id?: string;
  provider: string;
  account_sid: string;
  auth_token: string;
  from_number: string;
  is_enabled: boolean;
}

const AdminWhatsAppSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  const [settings, setSettings] = useState<WhatsAppSettings>({
    provider: 'twilio',
    account_sid: '',
    auth_token: '',
    from_number: '',
    is_enabled: false,
  });

  useEffect(() => {
    const init = async () => {
      console.log('AdminWhatsAppSettings: Init, authLoading:', authLoading, 'user:', user);

      if (authLoading) {
        console.log('AdminWhatsAppSettings: Auth still loading, waiting...');
        return;
      }

      if (!user) {
        console.log('AdminWhatsAppSettings: No user after auth loaded, redirecting to login');
        setLoading(false);
        navigate('/admin-login');
        return;
      }

      try {
        console.log('AdminWhatsAppSettings: Checking admin status for user:', user.id);
        const { data: adminUser, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        console.log('AdminWhatsAppSettings: Admin check result:', { adminUser, error });

        if (error || !adminUser) {
          console.log('AdminWhatsAppSettings: Not an admin, redirecting to login');
          setLoading(false);
          navigate('/admin-login');
          return;
        }

        console.log('AdminWhatsAppSettings: User is admin, loading settings');
        setIsAdmin(true);
        await fetchSettings();
      } catch (err) {
        console.error('AdminWhatsAppSettings: Error checking admin access:', err);
        setLoading(false);
        navigate('/admin-login');
      }
    };

    init();
  }, [user, authLoading]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setError('Failed to load WhatsApp settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!user) throw new Error('User not authenticated');

      const settingsData = {
        provider: settings.provider,
        account_sid: settings.account_sid,
        auth_token: settings.auth_token,
        from_number: settings.from_number,
        is_enabled: settings.is_enabled,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (settings.id) {
        const { error } = await supabase
          .from('whatsapp_settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('whatsapp_settings')
          .insert([settingsData])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setSettings(prev => ({ ...prev, id: data.id }));
        }
      }

      setSuccess('WhatsApp settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save WhatsApp settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (!testPhone) {
      setError('Please enter a phone number to test');
      return;
    }

    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: testProject } = await supabase
        .from('customers')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!testProject) {
        setError('No projects found to test with. Please create a project first.');
        setTesting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: {
          projectId: testProject.id,
          notificationType: 'status_update',
          customMessage: `This is a test message from The Home Designers WhatsApp notification system. If you receive this, your WhatsApp integration is working correctly! 🎉`,
          testMode: true,
          testPhone: testPhone,
        },
      });

      if (error) throw error;

      if (data?.skipped) {
        setError(data.message || 'Test notification was skipped');
      } else if (data?.error) {
        setError(data.error);
      } else {
        setSuccess(`Test notification sent successfully to ${testPhone}! Check your WhatsApp.`);
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err: any) {
      console.error('Error sending test notification:', err);
      setError(err.message || 'Failed to send test notification');
    } finally {
      setTesting(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading WhatsApp settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-secondary-800">WhatsApp Settings</h1>
              <p className="text-gray-600">Configure WhatsApp notifications for customer updates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Setup Instructions</h3>
          <ol className="text-sm text-blue-700 space-y-2 ml-4 list-decimal">
            <li>Sign up for a Twilio account at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="underline">twilio.com</a></li>
            <li>Enable WhatsApp messaging in your Twilio console</li>
            <li>Get your Account SID and Auth Token from the Twilio dashboard</li>
            <li>Set up your WhatsApp sender number</li>
            <li>Enter the credentials below and enable notifications</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="space-y-6">
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_enabled"
                  checked={settings.is_enabled}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="font-medium text-gray-700">Enable WhatsApp Notifications</span>
              </label>
              <p className="text-sm text-gray-500 mt-1 ml-7">
                When enabled, customers will receive WhatsApp notifications for project updates
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <select
                name="provider"
                value={settings.provider}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="twilio">Twilio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account SID *
              </label>
              <input
                type="text"
                name="account_sid"
                value={settings.account_sid}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auth Token *
              </label>
              <div className="relative">
                <input
                  type={showAuthToken ? 'text' : 'password'}
                  name="auth_token"
                  value={settings.auth_token}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="********************************"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAuthToken(!showAuthToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showAuthToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Number (WhatsApp) *
              </label>
              <input
                type="text"
                name="from_number"
                value={settings.from_number}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+14155238886"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Your Twilio WhatsApp-enabled phone number (include country code with +)
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {settings.is_enabled && settings.id && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-secondary-800 mb-4">Test Notification</h3>
            <p className="text-gray-600 mb-4">
              Send a test WhatsApp message to verify your configuration is working correctly.
            </p>
            <div className="flex space-x-3">
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter phone number (e.g., +919876543210)"
              />
              <button
                onClick={handleTestNotification}
                disabled={testing || !testPhone}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Test</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWhatsAppSettings;
