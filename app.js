function Activity(worker) {
  this.run = function() {
    worker(function(error, result) {

    });
  }
}














var async = require("async");
var Q = require("Q");

var createNotification = function(data, callback) {
  setTimeout(function(){
    console.log("createNotification");
    callback(null, data.id);
  }, 300);
}

var getNotificationCTR = function(notificationId, callback) {
  var results = {
    "1" : 0.5,
    "2" : 0.1252,
  }
  setTimeout(function(){
    console.log("getNotificationCTR");
    callback(null, results[notificationId]);
  }, 300);
}


function ParallelActivity(/*
  arguments
*/) {

  var deferred = Q.defer();
  async.parallel(arguments, function(error, results){
    if (error) {
      deferred.reject(new Error(error));
    } else {
      deferred.resolve(results);
    }
  });
  return deferred.promise;
}

ParallelActivity(
  function(callback){
    createNotification({id: "1"}, callback);
  },
  function(callback){
    createNotification({id: "2"}, callback);
  }
).then(function(results){
  return ParallelActivity(results.
    function(callback){
      getNotificationCTR(results[0], callback);
    },
    function(callback){
      getNotificationCTR(results[1], callback);
    }
  )
}).then(function(results){
  console.log(results);
});

// function A(){
//   async.parallel([
    // function(callback){
    //   createNotification({id: "1"}, callback);
    // },
    // function(callback){
    //   createNotification({id: "2"}, callback);
    // }
//   ],function(err, results){
//     // console.log(results);
//   });
// }

















