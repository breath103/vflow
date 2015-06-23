var Q      = require("Q");
var _      = require("underscore");
var Activities = require("./activities.js");


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
  var _parseActivityArguments = function(args, context, depth) {
    if (arguments.length != 3) {
      throw new Error(arguments.length);
    }

    return _.map(args, function(arg){
      if (_.isArray(arg)) {
        return _parseActivityArguments(arg, null, depth + 1);
      } else if (_.isObject(arg) && arg.type && arg.arguments) {
        return _deserializeActivityWithArguments(arg, depth);
      } else {
        if (arg == "$previousResult") {
          return context;
        } else {
          return arg;
        }
      }
    })
  }
  
  var _deserializeActivityWithArguments = function(json, depth) {
    return function(result) {
      var activityType = Activities[json.type];
      if (!activityType) { throw new Error(activityType + " not exist."); }

      var newActivity = new activityType();
      return newActivity.run(_parseActivityArguments(json.arguments, result, depth), depth);
    }
  }

  this.run = function(jsonActivities) {
    var promise = null;
    _.each(jsonActivities, function(activity) {
      var newActivity = _deserializeActivityWithArguments(activity, 0);
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