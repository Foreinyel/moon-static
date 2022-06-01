"use strict";

const path = require("path");
const FileManager = require("./lib/file-manager");

module.exports = (app) => {
  const index = app.config.coreMiddleware.indexOf("bodyParser");
  const staticIndex = app.config.coreMiddleware.indexOf("static");
  if (staticIndex !== -1) {
    app.config.coreMiddleware.splice(staticIndex, 1, "moonStatic");
  } else {
    if (index === -1) {
      app.config.coreMiddleware.push("moonStatic");
    } else {
      app.config.coreMiddleware.splice(index, 0, "moonStatic");
    }
  }
  const publicPath = path.resolve(app.baseDir, app.config.moonStatic.publicDir);
  const FileManagerClass =
    app.config.moonStatic.FileManagerClass || FileManager;
  const fileManager = new FileManagerClass({ dir: publicPath, app });
  app.fileManager = fileManager;

  app.beforeStart(async () => {
    await fileManager.load();
  });
};
