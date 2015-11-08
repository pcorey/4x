Candlesticks = new Mongo.Collection("candlesticks");

Candlesticks.mostRecent = function(query) {
  return Candlesticks.findOne(query, {
    sort: {
      date: -1
    }
  });
};

Candlesticks.insertOandaCandle = function(candle, result) {
  var m = moment(candle.time);
  candle = _.extend(candle, {
    date: m.toDate(),
    unix: m.unix(),
    instrument: result.data.instrument,
    granularity: result.data.granularity,
    openMid: candle.openBid + (candle.openAsk - candle.openBid) / 2,
    closeMid: candle.closeBid + (candle.closeAsk - candle.closeBid) / 2,
    highMid: candle.highBid + (candle.highAsk - candle.highBid) / 2,
    lowMid: candle.lowBid + (candle.lowAsk - candle.lowBid) / 2
  });
  Candlesticks.insert(candle);
};

Candlesticks.after.insert(function(userId, doc) {
  var previous = Candlesticks.find({
    date: {$lt: doc.date}
  }, {
    sort: {
      date: -1
    },
    limit: 3
  }).fetch();

  if (previous.length < 3) {
    return;
  }

  if (previous[1].lowMid < previous[0].lowMid &&
      previous[1].lowMid < previous[2].lowMid) {
    var minima = _.extend({
      candlestickId: previous[1]._id
    }, previous[1]);
    delete minima._id;
    Minima.insert(minima);
  }
  else if (previous[1].lowMid > previous[0].lowMid &&
           previous[1].lowMid > previous[2].lowMid) {
    var maxima = _.extend({
      candlestickId: previous[1]._id
    }, previous[1]);
    delete maxima._id;
    Maxima.insert(maxima);
  }
});
