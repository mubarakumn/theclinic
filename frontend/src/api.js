import axios from 'axios';
import {
  cacheApiResponse,
  clearCachedApiResponses,
  enqueueOfflineRequest,
  getCachedApiResponse,
  getNextPendingRequest,
  isRetryableOfflineMutation,
  markOutboxRecordSynced,
  updateOutboxRecord,
} from "./offline/outbox";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
if (!apiBaseUrl) {
  throw new Error(
    "VITE_API_BASE_URL is not configured. Set it in the frontend environment.",
  );
}

const API = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (isRetryableOfflineMutation(config)) {
      config.headers["Idempotency-Key"] ??= crypto.randomUUID();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration
API.interceptors.response.use(
  (response) => {
    if (response.config.method?.toLowerCase() === "get") {
      cacheApiResponse(response.config, response.data).catch((error) => {
        console.error("Could not cache encrypted offline API data:", error);
      });
    } else if (isRetryableOfflineMutation(response.config)) {
      clearCachedApiResponses().catch((error) => {
        console.error("Could not invalidate encrypted offline API data:", error);
      });
    }
    return response;
  },
  async (error) => {
    const requestConfig = error.config;
    if (
      !error.response &&
      requestConfig?.method?.toLowerCase() === "get" &&
      !requestConfig._outboxReplay
    ) {
      const cached = await getCachedApiResponse(requestConfig);
      if (cached) {
        return {
          data: cached.data,
          status: 200,
          statusText: "OK (offline cache)",
          headers: { "x-offline-cache": "true" },
          config: requestConfig,
          request: null,
        };
      }
    }

    if (
      !error.response &&
      requestConfig &&
      !requestConfig._outboxReplay &&
      isRetryableOfflineMutation(requestConfig)
    ) {
      return enqueueOfflineRequest(requestConfig).then((operationId) => {
        const queuedError = new Error(
          "Saved on this device. Waiting for a connection to sync.",
        );
        queuedError.code = "OFFLINE_QUEUED";
        queuedError.operationId = operationId;
        queuedError.response = {
          status: 202,
          data: {
            success: false,
            pendingSync: true,
            operationId,
            message: queuedError.message,
          },
        };
        return Promise.reject(queuedError);
      });
    }

    if (
      !error.response &&
      requestConfig &&
      ["post", "put", "patch", "delete"].includes(
        requestConfig.method?.toLowerCase(),
      ) &&
      !requestConfig.url?.startsWith("/auth/")
    ) {
      error.code = "OFFLINE_UNSUPPORTED";
      error.response = {
        status: 0,
        data: {
          message:
            "This action is not enabled for offline sync yet. No change was saved; reconnect and try again.",
        },
      };
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

let isSyncingOutbox = false;

const drainOfflineOutbox = async () => {
  if (isSyncingOutbox || !navigator.onLine) return;
  isSyncingOutbox = true;

  try {
    while (navigator.onLine) {
      const next = await getNextPendingRequest();
      if (!next) return;

      const { record, payload } = next;
      await updateOutboxRecord(record, {
        state: "SYNCING",
        attempts: record.attempts + 1,
        lastError: null,
      });

      try {
        await API.request({
          ...payload,
          headers: { "Idempotency-Key": record.id },
          _outboxReplay: true,
        });
        await markOutboxRecordSynced(record.id);
        clearCachedApiResponses().catch((cacheError) => {
          console.error("Could not clear stale offline API data:", cacheError);
        });
      } catch (error) {
        if (error.response?.status === 401) return;

        const reviewRequired =
          Boolean(error.response) &&
          error.response.data?.code !== "SYNC_IN_PROGRESS";
        await updateOutboxRecord(record, {
          state: reviewRequired ? "NEEDS_REVIEW" : "PENDING",
          lastError:
            error.response?.data?.message ||
            "Sync failed. The app will retry when connected.",
        });

        if (!reviewRequired) return;
      }
    }
  } finally {
    isSyncingOutbox = false;
  }
};

export const syncOfflineOutbox = async () => {
  if (!navigator.locks?.request) return drainOfflineOutbox();

  return navigator.locks.request(
    "clinic-hms-offline-outbox-sync",
    { ifAvailable: true },
    async (lock) => {
      if (lock) await drainOfflineOutbox();
    },
  );
};

export default API;