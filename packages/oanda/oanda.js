var NodeOanda = Npm.require("node-oanda");
var Future = Npm.require("fibers/future");

OANDA = new NodeOanda({
  token: Meteor.settings.OANDA_TOKEN,
  type: Meteor.settings.OANDA_TYPE,
  dateFormat: "RFC3339"
});

OANDA.getCandles = function(instrument, options) {
  var future = new Future();
  var request = OANDA.rates.retrieveInstrumentHistory(instrument, _.extend({
    dailyAlignment: "0",
    alignmentTimezone: "America/New_York",
    includeFirst: "false"
  }, options));
  request.error(function(err) {
    future.throw(err);
  });
  request.success(function(res) {
    future.return(res);
  });
  request.go();
  return future.wait();
};

OANDA.buy = function(instrument, units, options) {
  var future = new Future();
  var request = OANDA.orders.createNewOrder(
    Meteor.settings.OANDA_ACCOUNT,
    instrument, units, "buy", "market",
    undefined, undefined, options);
  request.error(function(err) {
    future.throw(err);
  });
  request.success(function(res) {
    future.return(res);
  });
  request.go();
  return future.wait();
};
