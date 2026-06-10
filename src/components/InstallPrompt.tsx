import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Smartphone, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallState = 'idle' | 'available' | 'installed' | 'unavailable';

// Module-level state so Footer can access it
let _deferredPrompt: BeforeInstallPromptEvent | null = null;
let _installState: InstallState = 'idle';
let _triggerShow: (() => void) | null = null;

export function triggerInstallPrompt() {
  if (_installState === 'installed') return;
  if (_deferredPrompt && _triggerShow) {
    // Clear dismissed flag so footer-triggered install always works
    localStorage.removeItem('pwa-install-dismissed');
    _triggerShow();
  } else if (_installState === 'unavailable' && _triggerShow) {
    _triggerShow();
  }
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installState, setInstallState] = useState<InstallState>('idle');

  const updateInstallState = useCallback((state: InstallState, prompt?: BeforeInstallPromptEvent | null) => {
    _installState = state;
    setInstallState(state);
    if (prompt !== undefined) {
      _deferredPrompt = prompt ?? null;
      setDeferredPrompt(prompt ?? null);
    }
  }, []);

  useEffect(() => {
    _triggerShow = () => setShowPrompt(true);

    if (isInStandaloneMode()) {
      updateInstallState('installed');
      return;
    }

    // iOS Safari — show manual instructions banner
    if (isIos()) {
      updateInstallState('unavailable');
      const dismissed = localStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      updateInstallState('available', promptEvent);

      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    const handleAppInstalled = () => {
      updateInstallState('installed', null);
      setShowPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      _triggerShow = null;
    };
  }, [updateInstallState]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        updateInstallState('installed', null);
      } else {
        // Prompt consumed — wait for browser to offer again
        updateInstallState('idle', null);
        localStorage.setItem('pwa-install-dismissed', 'true');
      }
    } catch {
      updateInstallState('idle', null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIos()) {
      localStorage.setItem('pwa-ios-dismissed', 'true');
    } else {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  if (installState === 'installed' || !showPrompt) return null;

  // iOS Safari manual install instructions
  if (isIos()) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slideUp">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-5 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-secondary-500 to-secondary-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Install App on iPhone</h3>
              <p className="text-sm text-gray-600">
                Tap the <strong>Share</strong> button in Safari, then select <strong>"Add to Home Screen"</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unavailable state (prompt consumed, waiting for browser)
  if (!deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slideUp">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-5 relative">
          <button onClick={() => setShowPrompt(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-secondary-500 to-secondary-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Install App</h3>
              <p className="text-sm text-gray-600">
                To install, tap the <strong>menu icon (⋮)</strong> in Chrome and select <strong>"Add to Home screen"</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard install prompt (Android Chrome)
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slideUp">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-secondary-800 mb-1">
              Install Our App
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Add to your home screen for quick access and a better experience.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
