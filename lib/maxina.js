Maxima = new Mongo.Collection("maxima");

Maxima.after.insert(function(userId, maxima) {
  var ss = Meteor.npmRequire("simple-statistics");
  var trendlines = ShortTrendlines.find({
    broken: {
      $ne: true
    },
    "candles.highMid": {
      $gt: maxima.highMid
    }
  }).fetch();

  var linked = [];
  trendlines.forEach(function(trendline) {
    if (trendline.bounces(maxima)) {
      console.log(`Adding maxima ${maxima._id} to trend ${trendline._id}`);
      ShortTrendlines.update(trendline._id, {
        $set: {
          line: trendline.mb(maxima)
        },
        $push: {
          candles: maxima
        }
      });
      linked = _.union(linked, _.pluck(trendline.candles, "candlestickId"));
    }
  });

  var previous = Maxima.find({
    candlestickId: {
      $nin: linked 
    },
    date: {
      $lt: maxima.date 
    },
    highMid: {
      $gt: maxima.highMid
    }
  }, {
    sort: {
      date: -1
    }
  });

  previous.forEach(function(from) {
    var between = Candlesticks.find({
      $and: [
        {date: {$gt: from.date}},
        {date: {$lt: maxima.date}}
      ]
    }).fetch();
    var ss = Meteor.npmRequire("simple-statistics");
    var mb = ss.linearRegression([[from.index, from.highMid],
                                  [maxima.index, maxima.highMid]]);
    var line = ss.linearRegressionLine(mb);
    var clear = between.reduce(function(clear, candle) {
      var y = line(candle.index);
      return clear && candle.highMid < y;
    }, true);
    if (clear) {
      ShortTrendlines.insert({
        line: mb,
        candles: [from, maxima]
      });
    }
  }.bind(this));
});
