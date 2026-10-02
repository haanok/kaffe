const { CosmosClient } = require("@azure/cosmos");
let client;
function getContainer() {
  client ||= new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
  return client.database("caffeinetracker").container("userstate");
}

module.exports = async function (context, req) {
  const principalHeader = req.headers["x-ms-client-principal"] || req.headers["X-MS-CLIENT-PRINCIPAL"];
  if (!principalHeader) { context.res = { status: 401, body: "Not authenticated" }; return; }
  const userId = JSON.parse(Buffer.from(principalHeader, "base64").toString("utf8")).userId;

  try {
    const { resource } = await getContainer().item(userId, userId).read();
    if (!resource) { context.res = { status: 404 }; return; }
    context.res = { status: 200, headers: { "Content-Type": "application/json" }, body: resource };
  } catch (err) {
    if (err.code === 404 || err.statusCode === 404) { context.res = { status: 404 }; return; }
    context.log.error("Cosmos read error:", err);
    context.res = { status: 500, body: `Could not load journal: ${err.message || err}` };
  }
};