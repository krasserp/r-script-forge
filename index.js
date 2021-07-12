var _ = require("underscore"),
    child_process = require("child_process");

function init(path) {
  var obj = new R(path);
  _.bindAll(obj, "data", "call", "callSync");
  return obj;
}


function isJson(str) {
  try {
      JSON.parse(str);
  } catch (e) {
      return false;
  }
  return true;
}

function R(path) {
  this.d = {};
  this.path = path;
  this.options = {
    env: _.extend({DIRNAME: __dirname}, process.env),
    encoding: "utf8"
  };
  this.idCounter = 0;
  this.args = ["--vanilla", __dirname + "/R/launch.R"];
}

R.prototype.data = function() {
  for (var i = 0; i < arguments.length; i++) {
    this.d[++this.idCounter] = arguments[i];
  }
  return this;
};

R.prototype.call = function(_opts, _callback) {
  var callback = _callback || _opts;
  var opts = _.isFunction(_opts) ? {} : _opts;
  this.options.env.input = JSON.stringify([this.d, this.path, opts]);
  var child = child_process.spawn("Rscript", this.args, this.options);
  var body = "";
  var error = "";
  // child.stderr.on("data", callback);
  child.stdout.on("data", function(d) {
     body += d;
  });
  child.stderr.on("data", (data) =>{
    error += data;
  })
  child.on("close", function(code) {
    var returnValue = body;
    if(isJson(body)){
      returnValue = JSON.parse(body);
    } else {
      returnValue = JSON.parse(error);
    }
    callback(null, returnValue);
  });
};

R.prototype.callSync = function(_opts) {
  var opts = _opts || {};
  this.options.env.input = JSON.stringify([this.d, this.path, opts]);
  var child = child_process.spawnSync("Rscript", this.args, this.options);
  if (child.stderr) throw child.stderr;
  return(JSON.parse(child.stdout));
};

module.exports = init;
