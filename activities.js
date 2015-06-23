var asyncQ = require("async-q");
var Q      = require("Q");
var _      = require("underscore");
var Client = require('node-rest-client').Client;

var Activity = function(name, promiseGenerator) {
  STATUS = {
    WAIT: "WAIT",
    RUNNING: "RUNNING", 
    FINISHED: "FINISHED"
  };

  var _name = name;
  var _status = STATUS.WAIT;
  this.setStatus = function(status) {
    indent = "";
    for (i=0;i<this.excutionDepth;i++) {
      indent += "   ";
    }
    console.log(indent, name, status);
    _status = status;
  }
  this.getStatus = function() {
    return _status;
  }

  var self = this;
  this.run = function(generatorArguments, excutionDepth) {
    if (!excutionDepth) { 
      excutionDepth = 0;
    }
    this.excutionDepth = excutionDepth;

    if (self.getStatus() != STATUS.WAIT) {
      throw new Error("This Activity already " + self.getStatus());
      return;
    }

    self.setStatus(STATUS.RUNNING);
    return promiseGenerator.apply(self, generatorArguments).then(function(result) {
      self.setStatus(STATUS.FINISHED);
      return Q(result);
    });
  }
};

var Activities = {};

Activities["GetJSONAcitivity"] = function() {
  Activity.call(
    this, 
    "GetJSONAcitivity", 
    function(url) {
      var deferred = Q.defer();
      client = new Client();
      client.get(url, function(data, response){
        json = JSON.parse(data);
        deferred.resolve(json);
      });
      return deferred.promise;
    }
  );
};

Activities["GetMaxByKeyActivity"] = function() {
  Activity.call(
    this, 
    "GetMaxByKeyActivity", 
    function(datas, key) {
      maxValue = _.max(datas, function(data){ return data[key]; });
      return Q( maxValue );
    }
  );
};

Activities["ParallelActivity"] = function() {
  Activity.call(
    this, 
    "ParallelActivity", 
    function(subActivities) {
      return asyncQ.parallel(subActivities);
    }
  );
};

Activities["WaterfallActivity"] = function() {
  Activity.call(
    this, 
    "WaterfallActivity", 
    function(subActivities) {
      return asyncQ.waterfall(subActivities);
    }
  );
};

Activities["LoggingActivity"] = function() {
  Activity.call(
    this, 
    "LoggingActivity", 
    function(logInput) {
      console.log(logInput.id);
      return Q(logInput);
    }
  );
};

module.exports = Activities;