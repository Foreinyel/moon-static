"use strict";

const path = require("path");

const { Readable } = require("stream");
const { createGzip } = require("zlib");
const compressible = require("compressible");

module.exports = function (options, app) {
  const fileManager = app.fileManager;
  return async (ctx, next) => {
    if (!["HEAD", "GET"].includes(ctx.method)) {
      return await next();
    }
    if (ctx.path.indexOf(options.publicDir) !== 1) {
      return await next();
    }
    const filepath = path.normalize(safeDecodeURIComponent(ctx.path));
    const fileInfo = fileManager.get(filepath);
    if (!fileInfo) {
      return await next();
    }
    const noneMatch = ctx.headers["if-none-match"];
    if (noneMatch === fileInfo.md5) {
      ctx.res.writeHead(304);
      return;
    }

    const acceptGzip = ctx.acceptsEncodings("gzip") === "gzip";
    if (acceptGzip && compressible(fileInfo.type)) {
      ctx.remove("content-length");
      ctx.res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Encoding": "gzip",
        "Cache-Control": "max-age=0",
        ETag: fileInfo.md5,
      });
      const stream = Readable.from(fileInfo.buffer);

      ctx.body = stream.pipe(createGzip());
      return;
    }

    ctx.type = fileInfo.type;
    ctx.length = fileInfo.length;
    ctx.body = fileInfo.buffer;

    ctx.res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "max-age=0",
      ETag: fileInfo.md5,
    });
    ctx.body = fileInfo.buffer;
  };
};

function safeDecodeURIComponent(text) {
  try {
    return decodeURIComponent(text);
  } catch (e) {
    return text;
  }
}
