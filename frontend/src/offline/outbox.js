const DATABASE_NAME = "clinic-hms-offline";
const DATABASE_VERSION = 2;
const OUTBOX_STORE = "outbox";
const KEYS_STORE = "encryptionKeys";
const CACHE_STORE = "apiCache";
const outboxEvents = new EventTarget();
let currentIdentity = null;

const openDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(OUTBOX_STORE)) {
        const outbox = database.createObjectStore(OUTBOX_STORE, {
          keyPath: "id",
        });
        outbox.createIndex("identity", ["tenantId", "userId"]);
        outbox.createIndex("state", "state");
      }
      if (!database.objectStoreNames.contains(KEYS_STORE)) {
        database.createObjectStore(KEYS_STORE, { keyPath: "identity" });
      }
      if (!database.objectStoreNames.contains(CACHE_STORE)) {
        database.createObjectStore(CACHE_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async (storeName, mode, action) => {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      let result;
      try {
        result = action(store);
      } catch (error) {
        reject(error);
        return;
      }
      transaction.oncomplete = () =>
        resolve(result instanceof IDBRequest ? result.result : result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
};

const identityId = ({ tenantId, userId }) => `${tenantId}:${userId}`;

const fingerprint = async (value) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

export const configureOfflineIdentity = async (user) => {
  const tenantId = user?.tenant?._id || user?.tenantId;
  const userId = user?._id;
  if (!tenantId || !userId) {
    currentIdentity = null;
    return null;
  }

  const identity = { tenantId: String(tenantId), userId: String(userId) };
  const keyId = identityId(identity);
  let keyRecord = await withStore(KEYS_STORE, "readonly", (store) =>
    store.get(keyId),
  );
  if (!keyRecord) {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
    keyRecord = { identity: keyId, key };
    await withStore(KEYS_STORE, "readwrite", (store) => store.put(keyRecord));
  }

  currentIdentity = { ...identity, key: keyRecord.key };
  notifyOutboxChanged();
  return currentIdentity;
};

export const lockOfflineIdentity = () => {
  currentIdentity = null;
};

const notifyOutboxChanged = () => outboxEvents.dispatchEvent(new Event("change"));

export const subscribeToOutbox = (listener) => {
  outboxEvents.addEventListener("change", listener);
  return () => outboxEvents.removeEventListener("change", listener);
};

export const getOutboxCounts = async () => {
  const identity = currentIdentity;
  if (!identity) return { pending: 0, syncing: 0, needsReview: 0 };

  const records = await withStore(OUTBOX_STORE, "readonly", (store) =>
    store.getAll(),
  );
  return records
    .filter(
      (record) =>
        record.tenantId === identity.tenantId &&
        record.userId === identity.userId,
    )
    .reduce(
      (counts, record) => {
        if (record.state === "NEEDS_REVIEW") counts.needsReview += 1;
        else if (record.state === "SYNCING") counts.syncing += 1;
        else if (record.state === "PENDING") counts.pending += 1;
        return counts;
      },
      { pending: 0, syncing: 0, needsReview: 0 },
    );
};

export const getOutboxItems = async () => {
  if (!currentIdentity) return [];
  return (await getCurrentRecords())
    .sort((left, right) => left.queuedAt.localeCompare(right.queuedAt))
    .map(({ id, state, attempts, queuedAt, syncedAt, lastError, operation }) => ({
      id,
      state,
      attempts,
      queuedAt,
      syncedAt,
      lastError,
      operation,
    }));
};

export const cacheApiResponse = async (config, data) => {
  const identity = currentIdentity;
  if (!identity?.key || !isOfflineCacheableRead(config)) return;
  const cacheIdentity = `${config.url}:${JSON.stringify(config.params || {})}`;
  const key = `${identityId(identity)}:${await fingerprint(cacheIdentity)}`;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const encryptedResponse = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    identity.key,
    plaintext,
  );
  await withStore(CACHE_STORE, "readwrite", (store) =>
    store.put({
      key,
      tenantId: identity.tenantId,
      userId: identity.userId,
      encryptedResponse,
      iv,
      cachedAt: new Date().toISOString(),
    }),
  );
};

export const getCachedApiResponse = async (config) => {
  const identity = currentIdentity;
  if (!identity?.key || !isOfflineCacheableRead(config)) return null;
  const cacheIdentity = `${config.url}:${JSON.stringify(config.params || {})}`;
  const key = `${identityId(identity)}:${await fingerprint(cacheIdentity)}`;
  const record = await withStore(CACHE_STORE, "readonly", (store) =>
    store.get(key),
  );
  if (!record) return null;

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: record.iv },
    identity.key,
    record.encryptedResponse,
  );
  return {
    data: JSON.parse(new TextDecoder().decode(plaintext)),
    cachedAt: record.cachedAt,
  };
};

export const clearCachedApiResponses = async () => {
  const identity = currentIdentity;
  if (!identity) return;
  const records = await withStore(CACHE_STORE, "readonly", (store) =>
    store.getAll(),
  );
  const database = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(CACHE_STORE, "readwrite");
      const store = transaction.objectStore(CACHE_STORE);
      records
        .filter(
          (record) =>
            record.tenantId === identity.tenantId &&
            record.userId === identity.userId,
        )
        .forEach((record) => store.delete(record.key));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
};

export const enqueueOfflineRequest = async (config) => {
  const identity = currentIdentity;
  if (!identity?.key) {
    throw new Error(
      "This change could not be saved offline because this account has no offline workspace on this device.",
    );
  }

  const id = config.headers?.["Idempotency-Key"] || crypto.randomUUID();
  const payload = {
    method: config.method,
    url: config.url,
    baseURL: config.baseURL,
    params: config.params,
    data: config.data,
  };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    identity.key,
    plaintext,
  );

  await withStore(OUTBOX_STORE, "readwrite", (store) =>
    store.put({
      id,
      tenantId: identity.tenantId,
      userId: identity.userId,
      encryptedPayload: ciphertext,
      iv,
      state: "PENDING",
      attempts: 0,
      queuedAt: new Date().toISOString(),
      lastError: null,
      operation: `${config.method.toUpperCase()} ${config.url}`,
    }),
  );
  notifyOutboxChanged();
  return id;
};

const getCurrentRecords = async () => {
  const identity = currentIdentity;
  if (!identity) return [];
  const records = await withStore(OUTBOX_STORE, "readonly", (store) =>
    store.getAll(),
  );
  return records.filter(
    (record) =>
      record.tenantId === identity.tenantId &&
      record.userId === identity.userId,
  );
};

export const getNextPendingRequest = async () => {
  if (!currentIdentity?.key) return null;

  const record = (await getCurrentRecords())
    .filter((item) => item.state === "PENDING" || item.state === "SYNCING")
    .sort((left, right) => left.queuedAt.localeCompare(right.queuedAt))[0];
  if (!record) return null;

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: record.iv },
    currentIdentity.key,
    record.encryptedPayload,
  );
  return {
    record,
    payload: JSON.parse(new TextDecoder().decode(plaintext)),
  };
};

export const updateOutboxRecord = async (record, updates) => {
  await withStore(OUTBOX_STORE, "readwrite", (store) =>
    store.put({ ...record, ...updates }),
  );
  notifyOutboxChanged();
};

export const removeOutboxRecord = async (recordId) => {
  await withStore(OUTBOX_STORE, "readwrite", (store) => store.delete(recordId));
  notifyOutboxChanged();
};

export const markOutboxRecordSynced = async (recordId) => {
  const records = await getCurrentRecords();
  const record = records.find((item) => item.id === recordId);
  if (!record) return;

  delete record.encryptedPayload;
  delete record.iv;
  await withStore(OUTBOX_STORE, "readwrite", (store) =>
    store.put({
      ...record,
      state: "SYNCED",
      syncedAt: new Date().toISOString(),
      lastError: null,
    }),
  );

  const syncedRecords = records
    .filter((item) => item.state === "SYNCED" && item.id !== recordId)
    .sort((left, right) => (right.syncedAt || "").localeCompare(left.syncedAt || ""));
  for (const oldRecord of syncedRecords.slice(49)) {
    await withStore(OUTBOX_STORE, "readwrite", (store) =>
      store.delete(oldRecord.id),
    );
  }
  notifyOutboxChanged();
};

export const isRetryableOfflineMutation = (config) => {
  const method = config.method?.toLowerCase();
  if (method !== "post") return false;

  const path = config.url || "";
  if (/^\/patients$/.test(path)) return true;
  if (!/^\/medical-records\/encounter$/.test(path)) return false;

  let data = config.data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return false;
    }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const allowedFields = new Set(["patientId", "vitals"]);
  if (Object.keys(data).some((key) => !allowedFields.has(key))) return false;
  if (!data.patientId || !data.vitals || typeof data.vitals !== "object") {
    return false;
  }

  const allowedVitals = new Set([
    "bloodPressure",
    "pulseRate",
    "temperature",
    "weight",
  ]);
  if (
    Object.keys(data.vitals).some((key) => !allowedVitals.has(key)) ||
    !Object.values(data.vitals).some(
      (value) => value !== undefined && value !== null && value !== "",
    )
  ) {
    return false;
  }

  return true;
};

const isOfflineCacheableRead = (config) =>
  config.method?.toLowerCase() === "get" && config.url === "/patients";
