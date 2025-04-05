const userController = require("../controllers/userController");

module.exports = async function (app, opts) {
  app.get("/", userController.listUsers);
  app.get("/init", userController.addUser);
};
