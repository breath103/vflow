var async = require("async");
var asyncQ = require("async-q");
var Q = require("Q");
var _ = require("underscore");
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
    console.log(name, status);
    _status = status;
  }
  this.getStatus = function() {
    return _status;
  }

  var self = this;
  this.run = function(generatorArguments) {
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

function AcitivtyFactory(name, runner) {
  return function() {
    var activity = new Activity(name, runner);
    return activity.run(arguments)
  };
}

var Activities = {};

Activities["GetJSONAcitivity"] = AcitivtyFactory("GetJSONAcitivity", function(url) {
  var deferred = Q.defer();
  client = new Client();
  client.get(url, function(data, response){
    json = JSON.parse(data);
    deferred.resolve(json);
  });
  return deferred.promise;
});

Activities["GetMaxByKeyActivity"] = AcitivtyFactory("GetMaxByKeyActivity", function(datas, key) {
  maxValue = _.max(datas, function(data){ return data[key]; });
  return Q( maxValue );
});

Activities["GetMinByKeyActivity"] = AcitivtyFactory("GetMinByKeyActivity", function(datas, key) {
  return Q( _.max(datas, function(data){ return data[key]; }) );
});

Activities["ParallelActivity"] = AcitivtyFactory("ParallelActivity",function(subActivities) {
  return asyncQ.parallel(subActivities);
});

Activities["LoggingActivity"] = AcitivtyFactory("LoggingActivity", function(logInput) {
  console.log(logInput.id);
  return Q(logInput);
});



var jsonActivities = [
  {
    type: "ParallelActivity",
    arguments: [
      [
        {
          type: "GetJSONAcitivity",
          arguments: ["https://www.vingle.net/api/cards/123456"]
        },
        {
          type: "GetJSONAcitivity",
          arguments: ["https://www.vingle.net/api/cards/234567"]
        }
      ]
    ]
  }
  , {
    type: "GetMaxByKeyActivity",
    arguments: [
      "$previousResult",
      "likes_count"
    ]
  }
  , {
    type: "LoggingActivity",
    arguments: [
      "$previousResult"
    ]
  }
];

function ActivityRunner() {
  var _parseActivityArguments = function(args, context) {
    return _.map(args, function(arg){
      if (_.isArray(arg)) {
        return _parseActivityArguments(arg);
      } else if (_.isObject(arg) && arg.type && arg.arguments) {
        return _deserializeActivity(arg);
      } else {
        if (arg == "$previousResult") {
          return context;
        } else {
          return arg;
        }
      }
    })
  }
  
  var _deserializeActivity = function(json) {
    var activityType = Activities[json.type];

    if (!activityType)
      console.log(activityType, " not exist.");

    return function(result) {
      return activityType.apply(null, _parseActivityArguments(json.arguments, result));
    }
  }

  this.run = function(jsonActivities) {
    var promise = null;
    _.each(jsonActivities, function(activity) {
      var newActivity = _deserializeActivity(activity);
      if (promise) {
        promise = promise.then(newActivity);
      } else {
        promise = newActivity();
      }
    });
  }
}

runner = new ActivityRunner();
runner.run(jsonActivities);