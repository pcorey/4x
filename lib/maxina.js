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
    var line = trendline.mb(maxima);
    // TODO: This slope restriction may be too strict
    if (trendline.bounces(maxima) && line.m >= trendline.line.m) {
      console.log(`Adding maxima ${maxima._id} to trend ${trendline._id}`);
      ShortTrendlines.update(trendline._id, {
        $set: {
          line: line
        },
        $push: {
          candles: maxima
        }
      });
      trendline.candles.push(maxima);
      if (trendline.candles.length == 3) {
        trendline.short();
      }
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
