module.exports = async function (app, opts) {
  app.get("/", (request, reply) => {
    reply.send({
      domainName: process.env.DOMAIN_NAME,
      port: process.env.PORT,
      db_dir: process.env.DB_DIR,
      db_path: process.env.DB_PATH,
    });
  });
};
