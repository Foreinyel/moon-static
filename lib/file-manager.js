"use strict";

const fsp = require("fs/promises");
const crypto = require("crypto");
const mime = require("mime-types");
const assert = require("assert");
const hm = require("@hemyn/utils-node");
const path = require("path");

const loadFile = async (filepath) => {
  const stats = await fsp.stat(filepath);
  const buffer = await fsp.readFile(filepath);
  const md5 = crypto
    .createHash("md5")
    .update(buffer.toString())
    .digest("base64");
  return {
    buffer: buffer,
    length: stats.size,
    mtime: stats.mtime,
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

module.exports = FileManager;
