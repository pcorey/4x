Candlesticks = new Mongo.Collection("candlesticks");

Candlesticks.mostRecent = function(query) {
  return Candlesticks.findOne(query, {
    sort: {
      date: -1
    }
  });
};

Candlesticks.insertOandaCandle = function(candle, instrument, granularity) {
  var m = moment(candle.time);
  candle = _.extend(candle, {
    date: m.toDate(),
    unix: m.unix(),
    index: Candlesticks.find().count(),
    instrument: instrument,
    granularity: granularity,
    openMid: candle.openBid + (candle.openAsk - candle.openBid) / 2,
    closeMid: candle.closeBid + (candle.closeAsk - candle.closeBid) / 2,
    highMid: candle.highBid + (candle.highAsk - candle.highBid) / 2,
    lowMid: candle.lowBid + (candle.lowAsk - candle.lowBid) / 2
  });
  Candlesticks.insert(candle);
};

Candlesticks.after.insert(function(userId, candle) {
  var ss = Meteor.npmRequire("simple-statistics");

  var trendlines = LongTrendlines.find({
    broken: {
      $ne: true
    }
  }).fetch();

  trendlines.forEach(function(trendline) {
    if (trendline.breaks(candle)) {
      console.log(`Candle ${candle._id} breaks trendline ${trendline._id}`);
      LongTrendlines.update(trendline._id, {
        $set: {
          broken: true,
          crossover: _.extend({
            candlestickId: this._id
          }, candle)
        }
      });
    }
  }.bind(this));

  var candlesticks = Candlesticks.find({}, {
    sort: {
      date: -1
    },
    limit: 3
  }).fetch();

  if (candlesticks.length < 3) {
    return;
  }

  candlesticks.forEach(function(candlestick, index) {
    if (index == 0 || index == candlesticks.length - 1) {
      return;
    }

    var previous = candlesticks[index - 1];
    var next = candlesticks[index + 1];

    candlestick.candlestickId = candlestick._id;
    delete candlestick._id;

    if (candlestick.lowMid < previous.lowMid &&
        candlestick.lowMid < next.lowMid) {
      Minima.insert(candlestick);
    }
    if (candlestick.highMid > previous.highMid &&
             candlestick.highMid > next.highMid) {
      Maxima.insert(candlestick);
    }
  });
});
