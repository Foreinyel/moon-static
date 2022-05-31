"use strict";

const path = require("path");
const fsp = require("fs/promises");
const crypto = require("crypto");
const mime = require("mime-types");
const assert = require("assert");
const { Readable } = require("stream");
const hm = require("@hemyn/utils-node");
const { createGzip } = require("zlib");
const compressible = require("compressible");
const PUBLIC_PREFIX = "public";

module.exports = function (options, app) {
  const publicPath = path.resolve(app.config.baseDir, PUBLIC_PREFIX);
  const fileManager = new FileManager({ dir: publicPath });

  app.beforeStart(async () => {
    await fileManager.load();
  });

  return async (ctx, next) => {
    if (!["HEAD", "GET"].includes(ctx.method)) {
      return await next();
    }
    if (ctx.path.indexOf(PUBLIC_PREFIX) !== 1) {
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
      const stream = Readable.from(fileInfo.buffer.toString());
      stream.pipe(createGzip()).pipe(ctx.res);
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

const loadFile = async (filepath) => {
  const stats = await fsp.stat(filepath);
  const buffer = await fsp.readFile(filepath);
  const md5 = crypto
    .createHash("md5")
    .update(buffer.toString())
    .digest("base64");
  return {
    buffer: buffer,
    length: (await stats).size,
    mtime: (await stats).mtime,
    md5: md5,
    type: mime.lookup(filepath) || "application/octet-stream",
  };
};

function FileManager({ dir }) {
  assert(!!dir, "Invalid dir of FileManager");
  this.dir = dir;
  this.map = new Map();

  return this;
}

FileManager.prototype.set = function (key, value) {
  this.map.set(key, value);
};

FileManager.prototype.get = function (key) {
  return this.map.get(key);
};

FileManager.prototype.load = async function () {
  const fileList = await hm.listFiles(this.dir);
  for (let file of fileList) {
    const fileInfo = await loadFile(file);
    const key = `/${path.relative(path.resolve(this.dir, ".."), file)}`;
    this.map.set(key, fileInfo);
  }
};
