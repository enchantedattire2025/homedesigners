import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Save, Upload, Youtube, Link as LinkIcon, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VideoSettings {
  id: string;
  video_type: 'youtube' | 'vimeo' | 'hosted';
  video_url: string;
  video_title: string;
  video_description: string;
}

const AdminVideoManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    id: '',
    video_type: 'youtube',
    video_url: '',
    video_title: '',
    video_description: ''
  });

  useEffect(() => {
    fetchVideoSettings();
  }, []);

  const fetchVideoSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'intro_video')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setVideoSettings({
          id: data.id,
          video_type: data.video_type,
          video_url: data.video_url || '',
          video_title: data.video_title || '',
          video_description: data.video_description || ''
        });
      }
    } catch (error) {
      console.error('Error fetching video settings:', error);
      setMessage({ type: 'error', text: 'Failed to load video settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          video_type: videoSettings.video_type,
          video_url: videoSettings.video_url,
          video_title: videoSettings.video_title,
          video_description: videoSettings.video_description,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'intro_video');

      if (error) throw error;

      setMessage({ type: 'success', text: 'Video settings updated successfully!' });
    } catch (error) {
      console.error('Error saving video settings:', error);
      setMessage({ type: 'error', text: 'Failed to save video settings' });
    } finally {
      setSaving(false);
    }
  };

  const getVideoPreviewUrl = () => {
    if (!videoSettings.video_url) return '';

    if (videoSettings.video_type === 'youtube') {
      const videoId = videoSettings.video_url.includes('youtu.be')
        ? videoSettings.video_url.split('/').pop()
        : videoSettings.video_url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (videoSettings.video_type === 'vimeo') {
      const videoId = videoSettings.video_url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    } else {
      return videoSettings.video_url;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Intro Video Management</h1>
              <p className="text-gray-600">Manage the video shown in "Watch Our Story" button</p>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p>{message.text}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Type
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setVideoSettings({ ...videoSettings, video_type: 'youtube' })}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                    videoSettings.video_type === 'youtube'
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Youtube className="w-6 h-6 text-red-600" />
                  <span className="font-medium">YouTube</span>
                </button>
                <button
                  onClick={() => setVideoSettings({ ...videoSettings, video_type: 'vimeo' })}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                    videoSettings.video_type === 'vimeo'
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Video className="w-6 h-6 text-blue-600" />
                  <span className="font-medium">Vimeo</span>
                </button>
                <button
                  onClick={() => setVideoSettings({ ...videoSettings, video_type: 'hosted' })}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                    videoSettings.video_type === 'hosted'
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Upload className="w-6 h-6 text-green-600" />
                  <span className="font-medium">Self-Hosted</span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-2">
                <LinkIcon className="w-4 h-4 inline mr-1" />
                Video URL
              </label>
              <input
                type="text"
                id="video_url"
                value={videoSettings.video_url}
                onChange={(e) => setVideoSettings({ ...videoSettings, video_url: e.target.value })}
                placeholder={
                  videoSettings.video_type === 'youtube'
                    ? 'https://www.youtube.com/watch?v=...'
                    : videoSettings.video_type === 'vimeo'
                    ? 'https://vimeo.com/...'
                    : 'https://your-domain.com/video.mp4'
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                {videoSettings.video_type === 'youtube' && 'Enter the full YouTube video URL'}
                {videoSettings.video_type === 'vimeo' && 'Enter the full Vimeo video URL'}
                {videoSettings.video_type === 'hosted' && 'Enter the direct URL to your video file'}
              </p>
            </div>

            <div>
              <label htmlFor="video_title" className="block text-sm font-medium text-gray-700 mb-2">
                Video Title
              </label>
              <input
                type="text"
                id="video_title"
                value={videoSettings.video_title}
                onChange={(e) => setVideoSettings({ ...videoSettings, video_title: e.target.value })}
                placeholder="Welcome to The Home Designers"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="video_description" className="block text-sm font-medium text-gray-700 mb-2">
                Video Description
              </label>
              <textarea
                id="video_description"
                value={videoSettings.video_description}
                onChange={(e) => setVideoSettings({ ...videoSettings, video_description: e.target.value })}
                placeholder="Describe what viewers will see in this video..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            {videoSettings.video_url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Preview
                </label>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  {videoSettings.video_type === 'hosted' ? (
                    <video
                      src={getVideoPreviewUrl()}
                      className="w-full h-full"
                      controls
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <iframe
                      src={getVideoPreviewUrl()}
                      title="Video Preview"
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving || !videoSettings.video_url}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Tips for Best Results
          </h3>
          <ul className="text-sm text-blue-800 space-y-2 ml-7">
            <li>Use high-quality videos that showcase your platform effectively</li>
            <li>Keep the video duration between 1-3 minutes for optimal engagement</li>
            <li>For YouTube videos, you can use either the full URL or the share link</li>
            <li>Test the video after saving to ensure it plays correctly</li>
            <li>Consider adding captions to make your video accessible</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminVideoManagement;
