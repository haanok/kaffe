const { getContainer, getUserId, json, publicState } = require("../shared/journal");

module.exports = async function (context, req) {
  const userId = getUserId(req);
  if (!userId) { context.res = json(401, { error: "Not signed in" }); return; }

  try {
    const { resource } = await getContainer().item(userId, userId).read();
    context.res = resource ? json(200, publicState(resource)) : json(404, { error: "No journal yet" });
  } catch (err) {
    if (err.code === 404) { context.res = json(404, { error: "No journal yet" }); return; }
    context.log.error("Cosmos read error:", err);
    context.res = json(500, { error: "Could not load journal" });
  }
};
