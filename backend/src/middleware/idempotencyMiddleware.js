import { createHash } from "node:crypto";
import IdempotencyRecord from "../models/IdempotencyRecord.js";

const buildFingerprint = (req) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        method: req.method,
        path: req.originalUrl,
        body: req.body,
      }),
    )
    .digest("hex");

const replayOrReject = (record, fingerprint, res) => {
  if (record.fingerprint !== fingerprint) {
    return res.status(409).json({
      success: false,
      code: "IDEMPOTENCY_KEY_REUSED",
      message: "This sync request key was already used for different data.",
    });
  }

  if (record.state === "PROCESSING") {
    const startedAt = record.updatedAt || record.createdAt;
    const isRecent = startedAt && Date.now() - startedAt.getTime() < 5 * 60_000;
    if (isRecent) {
      return res.status(425).json({
        success: false,
        code: "SYNC_IN_PROGRESS",
        message: "This sync request is still being processed.",
      });
    }

    return res.status(409).json({
      success: false,
      code: "SYNC_REQUIRES_REVIEW",
      message:
        "The previous request may have been applied. Review this item before retrying.",
    });
  }

  res.set("Idempotency-Replayed", "true");
  return res.status(record.responseStatus).json(record.responseBody);
};

export const idempotencyMiddleware = async (req, res, next) => {
  const key = req.get("Idempotency-Key");
  if (!key || !["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  if (key.length > 128 || !req.user?._id || !req.tenantId) {
    return res.status(400).json({
      success: false,
      message: "Invalid idempotency request.",
    });
  }

  const fingerprint = buildFingerprint(req);
  const scope = {
    tenantId: req.tenantId,
    userId: req.user._id,
    key,
  };

  try {
    let record = await IdempotencyRecord.findOne(scope);
    if (record) return replayOrReject(record, fingerprint, res);

    record = new IdempotencyRecord({
      ...scope,
      fingerprint,
      state: "PROCESSING",
    });

    try {
      await record.save();
    } catch (error) {
      if (error.code !== 11000) throw error;
      record = await IdempotencyRecord.findOne(scope);
      if (!record) throw error;
      return replayOrReject(record, fingerprint, res);
    }

    const sendJson = res.json.bind(res);
    res.json = (body) => {
      res.json = sendJson;
      record.state = "COMPLETED";
      record.responseStatus = res.statusCode;
      record.responseBody =
        body === undefined ? null : JSON.parse(JSON.stringify(body));

      return record.save().then(
        () => sendJson(body),
        (error) => {
          console.error("Could not persist idempotency response:", error);
          return res.status(503).json({
            success: false,
            code: "SYNC_REQUIRES_REVIEW",
            message:
              "The server could not confirm the sync result. Review this item before retrying.",
          });
        },
      );
    };

    return next();
  } catch (error) {
    console.error("Idempotency processing failed:", error);
    return res.status(500).json({
      success: false,
      message: "Could not safely process this sync request.",
    });
  }
};
