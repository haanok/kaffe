const { getContainer, getUserId, json } = require("../shared/journal");

const MAX_ENTRIES = 50000;
const MAX_BYTES = 1500000; // Cosmos DB caps documents at 2 MB.

module.exports = async function (context, req) {
  const userId = getUserId(req);
  if (!userId) { context.res = json(401, { error: "Not signed in" }); return; }

  // Only accept real JSON requests. A cross-site form can send text/plain
  // without a CORS preflight, but never application/json.
  if (!String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
    context.res = json(415, { error: "Expected application/json" }); return;
  }
  const body = req.body;
  if (!body || typeof body !== "object" || body.version !== 2 || !Array.isArray(body.entries) || body.entries.length > MAX_ENTRIES
    || (body.settings !== undefined && (typeof body.settings !== "object" || Array.isArray(body.settings)))) {
    context.res = json(400, { error: "Invalid journal data" }); return;
  }
  if (Buffer.byteLength(JSON.stringify(body)) > MAX_BYTES) { context.res = json(413, { error: "Journal too large" }); return; }

  const container = getContainer();
  try {
    const { resource: current, etag } = await container.item(userId, userId).read().catch(err => {
      if (err.code === 404) return {};
      throw err;
    });
    // Refuse to overwrite changes saved by another device since this client
    // last synced. The client merges and retries.
    if (current && body.baseUpdatedAt !== current.updatedAt) {
      context.res = json(409, { error: "Journal changed on another device", updatedAt: current.updatedAt }); return;
    }
    const doc = { id: userId, userId, version: 2, entries: body.entries, settings: body.settings || {}, updatedAt: Math.max(Date.now(), (current?.updatedAt || 0) + 1) };
    if (current) await container.item(userId, userId).replace(doc, { accessCondition: { type: "IfMatch", condition: etag } });
    else await container.items.create(doc);
    context.res = json(200, { updatedAt: doc.updatedAt });
  } catch (err) {
    if (err.code === 409 || err.code === 412) { context.res = json(409, { error: "Journal changed on another device" }); return; }
    context.log.error("Cosmos save error:", err);
    context.res = json(500, { error: "Could not save journal" });
  }
};
