const { CosmosClient } = require("@azure/cosmos");
let client;
function getContainer() {
  client ||= new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
  return client.database("caffeinetracker").container("userstate");
}

module.exports = async function (context, req) {
  const principalHeader = req.headers["x-ms-client-principal"];
  if (!principalHeader) { context.res = { status: 401, body: "Not authenticated" }; return; }
  const userId = JSON.parse(Buffer.from(principalHeader, "base64").toString("utf8")).userId;

  const body = req.body;
  if (!body || body.version !== 2 || !Array.isArray(body.entries)) {
    context.res = { status: 400, body: "Invalid journal data" }; return;
  }

  const doc = { id: userId, userId, version: body.version, entries: body.entries, settings: body.settings, updatedAt: Date.now() };
  try {
    await getContainer().items.upsert(doc);
    context.res = { status: 200, body: doc };
  } catch (err) {
    context.log.error(err);
    context.res = { status: 500, body: "Could not save journal" };
  }
};