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

  const { resources } = await container.items
    .query({
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC",
      parameters: [{ name: "@userId", value: userId }]
    })
    .fetchAll();

  context.res = { status: 200, body: resources };
};