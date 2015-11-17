var NodeOanda = Npm.require("node-oanda");
var Future = Npm.require("fibers/future");
var Counts = [];

function getCount() {
  for (var i = 0; i < Counts.length; i++) {
    if (!Counts[i]) {
      Counts[i] = true;
      return i;
    }
  }
  var l = Counts.length;
  Counts[l] = true;
  return l;
}

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

OANDA.order = function(side, units, options) {
  var future = new Future();
  var request = OANDA.orders.createNewOrder(
    Meteor.settings.OANDA_ACCOUNT,
    "EUR_USD", units, side, "market",
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

OANDA.long = function(units, options) {
  return OANDA.order("buy", units + getCount(), options);
};

OANDA.short = function(units, options) {
  return OANDA.order("sell", units + getCount(), options);
};

OANDA.close = function(tradeId) {
  var future = new Future();
  var request = OANDA.trades.closeOpenTrade(
    Meteor.settings.OANDA_ACCOUNT,
    tradeId);
  request.error(function(err) {
    future.throw(err);
  });
  request.success(function(res) {
    future.return(res);
  });
  request.go();
  return future.wait();
};
