import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { syncOfflineOutbox } from "../api";
import {
  getOutboxCounts,
  getOutboxItems,
  subscribeToOutbox,
} from "../offline/outbox";

const OfflineSyncStatus = () => {
  const { isAuthenticated, offlineSession } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const [counts, setCounts] = useState({
    pending: 0,
    syncing: 0,
    needsReview: 0,
  });
  const [items, setItems] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [storageError, setStorageError] = useState("");
  const syncingRef = useRef(false);

  const refreshStatus = useCallback(async () => {
    try {
      const [nextCounts, nextItems] = await Promise.all([
        getOutboxCounts(),
        getOutboxItems(),
      ]);
      setCounts(nextCounts);
      setItems(nextItems);
      setStorageError("");
    } catch (error) {
      console.error("Could not read offline sync status:", error);
      setStorageError("Offline storage is unavailable on this device.");
    }
  }, []);

  const runSync = useCallback(async () => {
    if (!navigator.onLine || syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      await syncOfflineOutbox();
    } catch (error) {
      console.error("Offline sync failed:", error);
    } finally {
      await refreshStatus();
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [refreshStatus]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const updateOnlineStatus = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void runSync();
    };
    const unsubscribe = subscribeToOutbox(() => void refreshStatus());
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    const initialRefresh = window.setTimeout(() => {
      void refreshStatus();
      if (navigator.onLine) void runSync();
    }, 0);
    const retryTimer = window.setInterval(() => {
      if (navigator.onLine) void runSync();
    }, 60_000);

    return () => {
      unsubscribe();
      window.clearTimeout(initialRefresh);
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      window.clearInterval(retryTimer);
    };
  }, [isAuthenticated, refreshStatus, runSync]);

  if (!isAuthenticated) return null;

  const pendingCount = counts.pending + counts.syncing;
  const statusText = !online
    ? "Offline"
    : offlineSession
      ? "Verify session"
      : counts.needsReview
        ? `${counts.needsReview} need review`
        : pendingCount
          ? `${pendingCount} pending`
          : "Synced";
  const statusColor = !online || offlineSession || counts.needsReview
    ? "bg-amber-500"
    : pendingCount
      ? "bg-blue-600"
      : "bg-emerald-500";

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowDetails((visible) => !visible)}
          aria-expanded={showDetails}
          aria-label={`Offline sync status: ${statusText}`}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor}`} />
          <span className="hidden sm:inline">{statusText}</span>
        </button>
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={runSync}
            disabled={!online || syncing}
            className="rounded-md bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        )}
      </div>

      {showDetails && (
        <section className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-1rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900">Offline sync</p>
              <p className="text-xs text-slate-600">
                {!online
                  ? "Reconnect to sync saved patient data."
                  : offlineSession
                    ? "Your session needs online verification."
                    : counts.needsReview
                      ? "Review these items before repeating an action."
                      : pendingCount
                        ? "Saved patient changes are waiting to sync."
                        : "No patient changes are waiting to sync."}
              </p>
            </div>
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={runSync}
                disabled={!online || syncing}
                className="shrink-0 rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {syncing ? "Syncing…" : "Sync now"}
              </button>
            )}
          </div>
          {offlineSession && (
            <p className="mt-2 border-t pt-2 text-xs text-amber-800">
              Cached sign-in cannot confirm current permissions or account status.
            </p>
          )}
          {storageError && (
            <p role="alert" className="mt-2 border-t pt-2 text-xs text-red-700">
              {storageError}
            </p>
          )}
          {items.length > 0 && (
            <ul className="mt-2 max-h-48 space-y-2 overflow-auto border-t pt-2">
              {items.map((item) => (
                <li key={item.id} className="text-xs text-slate-700">
                  <span className="font-semibold">
                    {item.state === "NEEDS_REVIEW"
                      ? "Needs review"
                      : item.state === "SYNCED"
                        ? "Synced"
                        : item.state === "SYNCING"
                          ? "Syncing"
                          : "Pending"}
                  </span>
                  <span>
                    {" · "}
                    {item.operation}
                    {" · "}
                    {item.state === "SYNCED" && item.syncedAt
                      ? `synced ${new Date(item.syncedAt).toLocaleString()}`
                      : `queued ${new Date(item.queuedAt).toLocaleString()}`}
                  </span>
                  {item.lastError && (
                    <p className="mt-0.5 text-amber-800">{item.lastError}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};

export default OfflineSyncStatus;
