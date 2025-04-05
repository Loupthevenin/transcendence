const path = require("path");

module.exports = async function (app, opts) {
  // // Serve static files (client-side code)
  app.register(require("@fastify/static"), {
    root: require("path").join(__dirname, "../../client"),
  });
};
