const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
  const principalHeader = req.headers["x-ms-client-principal"];
  if (!principalHeader) {
    context.res = { status: 401, body: "Not authenticated" };
    return;
  }

  const principal = JSON.parse(Buffer.from(principalHeader, "base64").toString("utf8"));
  const userId = principal.userId;

  const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
  const container = client.database("caffeinetracker").container("entries");

  const entry = {
    id: crypto.randomUUID(),
    userId,
    drink: req.body.drink,
    mg: req.body.mg,
    timestamp: new Date().toISOString()
  };

  await container.items.create(entry);
  context.res = { status: 201, body: entry };
};