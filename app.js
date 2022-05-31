"use strict";

module.exports = (app) => {
  const index = app.config.coreMiddleware.indexOf("bodyParser");
  const staticIndex = app.config.coreMiddle.indexOf("static");
  if (staticIndex) {
    app.config.coreMiddleware.splice(staticIndex, 1, "moonStatic");
  } else {
    if (index === -1) {
      app.config.coreMiddleware.push("moonStatic");
    } else {
      app.config.coreMiddleware.splice(index, 0, "moonStatic");
    }
  }
};
