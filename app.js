var async = require("async");
var asyncQ = require("async-q");
var Q = require("Q");
var _ = require("underscore");
var Client = require('node-rest-client').Client;


var Activities = {
  GetJSONAcitivity: function(url) {
    var deferred = Q.defer();
    client = new Client();
    client.get(url, function(data, response){
      json = JSON.parse(data);
      deferred.resolve(json);
    });
    return deferred.promise;
  },
  GetMaxByKeyActivity: function(datas, key) {
    return Q( _.max(datas, function(data){ return data[key]; }) );
  },
  GetMinByKeyActivity: function(datas, key) {
    return Q( _.max(datas, function(data){ return data[key]; }) );
  },
  ParallelActivity: function(subActivities) {
    return asyncQ.parallel(subActivities);
  },
  LoggingActivity: function(logInput) {
    console.log(logInput);
    return Q(logInput);
  }
};

function parseActivityArguments(args, context) {
  return _.map(args, function(arg){
    if (_.isArray(arg)) {
      return parseActivityArguments(arg);
    } else if (_.isObject(arg) && arg.type && arg.arguments) {
      return deserializeActivity(arg);
    } else {
      if (arg == "$previousResult") {
        return context;
      } else {
        return arg;
      }
    }
  })
}

function deserializeActivity(json) {
  var activityType = Activities[json.type];

  if (!activityType)
    console.log(activityType, " not exist.");

  return function(result) {
    return activityType.apply(null, parseActivityArguments(json.arguments, result));
  }
}


var promise = null;

_.each([
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
], function(activity) {
  var newActivity = deserializeActivity(activity);
  if (promise) {
    promise = promise.then(newActivity);
  } else {
    promise = newActivity();
  }
});