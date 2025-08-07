"use client";

import { useState, useEffect } from "react";
import { setCookie, getCookie } from "cookies-next";

type CookiePreferences = {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

const CookieConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Essential cookies are always required
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if consent has been given before
    const consent = getCookie("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    } else {
      try {
        const savedPreferences = JSON.parse(consent as string);
        setPreferences(savedPreferences);
      } catch (e) {
        // If parsing fails, show the banner again
        setShowBanner(true);
      }
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    
    setCookie("cookie-consent", JSON.stringify(allAccepted), {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: "/",
    });
    
    setPreferences(allAccepted);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const acceptEssential = () => {
    const essentialOnly = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    
    setCookie("cookie-consent", JSON.stringify(essentialOnly), {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: "/",
    });
    
    setPreferences(essentialOnly);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const savePreferences = () => {
    setCookie("cookie-consent", JSON.stringify(preferences), {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: "/",
    });
    
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handlePreferenceChange = (category: keyof CookiePreferences) => {
    if (category === 'essential') return; // Essential cookies can't be turned off
    
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/90 text-white shadow-lg">
      <div className="container mx-auto max-w-6xl">
        {!showPreferences ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">We value your privacy</h2>
              <p className="text-sm text-white/80">
                We use cookies to enhance your browsing experience, provide personalized content, 
                and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                Visit our <a href="/docs.codexhub.ai/cookie-policy.md" className="underline">Cookie Policy</a> to
                learn more or manage your preferences.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <button
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 bg-transparent border border-white/20 rounded hover:bg-white/10 transition"
                aria-label="Customize cookie preferences"
              >
                Customize
              </button>
              <button
                onClick={acceptEssential}
                className="px-4 py-2 bg-transparent border border-white/20 rounded hover:bg-white/10 transition"
                aria-label="Accept only essential cookies"
              >
                Essential Only
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 bg-red-500 border border-red-500 rounded hover:bg-red-600 transition"
                aria-label="Accept all cookies"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Cookie Preferences</h2>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-white/80 hover:text-white"
                aria-label="Close preferences panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 mb-4">
              <div className="flex items-center justify-between p-3 bg-white/10 rounded">
                <div>
                  <h3 className="font-semibold">Essential Cookies</h3>
                  <p className="text-sm text-white/70">Required for the website to function. Cannot be disabled.</p>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed">
                  <input 
                    type="checkbox" 
                    checked={preferences.essential} 
                    className="sr-only peer" 
                    disabled 
                  />
                  <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/10 rounded">
                <div>
                  <h3 className="font-semibold">Functional Cookies</h3>
                  <p className="text-sm text-white/70">Enable enhanced functionality and personalization.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={preferences.functional} 
                    onChange={() => handlePreferenceChange('functional')} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/10 rounded">
                <div>
                  <h3 className="font-semibold">Analytics Cookies</h3>
                  <p className="text-sm text-white/70">Help us understand how you use our website.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={preferences.analytics} 
                    onChange={() => handlePreferenceChange('analytics')} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/10 rounded">
                <div>
                  <h3 className="font-semibold">Marketing Cookies</h3>
                  <p className="text-sm text-white/70">Used to deliver relevant advertisements and track their effectiveness.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={preferences.marketing} 
                    onChange={() => handlePreferenceChange('marketing')} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={savePreferences}
                className="px-4 py-2 bg-red-500 rounded hover:bg-red-600 transition"
                aria-label="Save cookie preferences"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsentBanner;