import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const isAppleMobile = () => {
  if (typeof window === "undefined") return false;

  return (
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1)
  );
};

const isStandalone = () => {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
};

const InstallPWA = () => {
  const { isAuthenticated, tenant } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(() => {
    if (!isAuthenticated) return false;
    return isAppleMobile() && !isStandalone();
  });
  const isIOS = isAppleMobile();
  const [isInstalled, setIsInstalled] = useState(() => isStandalone());

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User installed Clinic HMS");
    }

    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (!showInstallBanner || !isAuthenticated || isInstalled) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 bg-blue-600 text-white p-4 rounded-xl shadow-2xl z-50 flex items-center justify-between border border-blue-400">
      <div>
        <h4 className="font-bold text-sm">
          Install {tenant?.name || "your clinic"} app
        </h4>
        <p className="text-xs text-blue-100">
          {isIOS && !deferredPrompt
            ? "To install, tap Share in Safari, then choose Add to Home Screen."
            : "Add your clinic workspace to this device for quick access."}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="bg-white text-blue-600 font-bold text-xs px-3 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            Install
          </button>
        )}
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
