import React, { useState, useEffect } from "react";

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the native browser install prompt
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User installed Clinic HMS");
    }

    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 bg-blue-600 text-white p-4 rounded-xl shadow-2xl z-50 flex items-center justify-between border border-blue-400">
      <div>
        <h4 className="font-bold text-sm">Install Clinic HMS App</h4>
        <p className="text-xs text-blue-100">
          Add to home screen for fast 1-tap access.
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleInstallClick}
          className="bg-white text-blue-600 font-bold text-xs px-3 py-2 rounded-lg hover:bg-blue-50 transition"
        >
          Install
        </button>
        <button
          onClick={() => setShowInstallBanner(false)}
          className="text-blue-200 hover:text-white text-xs px-2 py-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;
