const { CosmosClient } = require("@azure/cosmos");

let client;
function getContainer() {
  client ||= new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
  return client.database("caffeinetracker").container("userstate");
}

// Static Web Apps replaces any client-sent x-ms-client-principal header with
// the signed-in user's, so it can be trusted here. Only GitHub logins count.
function getUserId(req) {
  const header = req.headers["x-ms-client-principal"];
  if (!header) return null;
  try {
    const principal = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    if (principal.identityProvider !== "github" || typeof principal.userId !== "string" || !principal.userId) return null;
    return principal.userId;
  } catch {
    return null;
  }
}

const json = (status, body) => ({ status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body });
const publicState = doc => ({ version: doc.version, entries: doc.entries, settings: doc.settings, updatedAt: doc.updatedAt });

module.exports = { getContainer, getUserId, json, publicState };
