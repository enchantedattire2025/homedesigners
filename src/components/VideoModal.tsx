import React, { useState, useEffect } from 'react';
import { X, Play, Sparkles, Award, Users, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VideoInfo {
  video_type: 'youtube' | 'vimeo' | 'hosted';
  video_url: string;
  title: string;
  description: string;
}

const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose }) => {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchVideoInfo();
    }
  }, [isOpen]);

  const fetchVideoInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('video_type, video_url, video_title, video_description')
        .eq('setting_key', 'intro_video')
        .maybeSingle();

      if (data && !error) {
        setVideoInfo({
          video_type: data.video_type || 'youtube',
          video_url: data.video_url,
          title: data.video_title || 'Our Design Journey',
          description: data.video_description || 'Watch how our talented designers transform ordinary spaces into extraordinary homes.'
        });
      } else {
        setVideoInfo({
          video_type: 'youtube',
          video_url: 'https://www.youtube.com/embed/Zn11vXNRzqE',
          title: 'Welcome to The Home Designers',
          description: 'Discover how we connect homeowners with India\'s most talented interior designers. From traditional elegance to modern sophistication, we bring your dream home to life.'
        });
      }
    } catch (error) {
      console.error('Error fetching video info:', error);
      setVideoInfo({
        video_type: 'youtube',
        video_url: 'https://www.youtube.com/embed/Zn11vXNRzqE',
        title: 'Welcome to The Home Designers',
        description: 'Discover how we connect homeowners with India\'s most talented interior designers. From traditional elegance to modern sophistication, we bring your dream home to life.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getVideoEmbedUrl = () => {
    if (!videoInfo) return '';

    if (videoInfo.video_type === 'youtube') {
      const videoId = videoInfo.video_url.includes('youtu.be')
        ? videoInfo.video_url.split('/').pop()
        : videoInfo.video_url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (videoInfo.video_type === 'vimeo') {
      const videoId = videoInfo.video_url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    } else {
      return videoInfo.video_url;
    }
  };

  if (!isOpen) return null;

  const highlights = [
    { icon: Award, text: '500+ Expert Designers', color: 'text-sky-600' },
    { icon: Users, text: '10,000+ Happy Clients', color: 'text-green-600' },
    { icon: TrendingUp, text: '2,500+ Projects Completed', color: 'text-orange-600' },
    { icon: Sparkles, text: 'Pan-India Service', color: 'text-purple-600' }
  ];

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/95 hover:bg-white rounded-full p-2 transition-all shadow-lg hover:shadow-xl hover:scale-110"
          aria-label="Close video"
        >
          <X className="w-6 h-6 text-gray-800" />
        </button>

        {loading ? (
          <div className="aspect-video flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <div className="aspect-video bg-black">
              {videoInfo?.video_type === 'hosted' ? (
                <video
                  src={getVideoEmbedUrl()}
                  className="w-full h-full"
                  controls
                  autoPlay
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  src={getVideoEmbedUrl()}
                  title="TheHomeDesigners Story - Interior Design Portfolio"
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {videoInfo?.title}
                  </h2>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {videoInfo?.description}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                {highlights.map((highlight, index) => {
                  const IconComponent = highlight.icon;
                  return (
                    <div key={index} className="flex flex-col items-center text-center group">
                      <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${highlight.color}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">{highlight.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default VideoModal;