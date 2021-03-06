Minima = new Mongo.Collection("minima");

Minima.after.insert(function(userId, minima) {
  var ss = Meteor.npmRequire("simple-statistics");
  var trendlines = LongTrendlines.find({
    broken: {
      $ne: true
    },
    "candles.lowMid": {
      $lt: minima.lowMid
    }
  }).fetch();

  var linked = [];
  trendlines.forEach(function(trendline) {
    var line = trendline.mb(minima);
    if (trendline.bounces(minima) && line.m <= trendline.line.m) {
      console.log(`Adding minima ${minima._id} to trend ${trendline._id}`);
      LongTrendlines.update(trendline._id, {
        $set: {
          line: line
        },
        $push: {
          candles: minima
        }
      });
      trendline.candles.push(minima);
      if (trendline.candles.length == 3) {
        trendline.long();
      }
      linked = _.union(linked, _.pluck(trendline.candles, "candlestickId"));
    }
  });

  var previous = Minima.find({
    candlestickId: {
      $nin: linked 
    },
    date: {
      $lt: minima.date 
    },
    lowMid: {
      $lt: minima.lowMid
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
        {date: {$lt: minima.date}}
      ]
    }).fetch();
    var ss = Meteor.npmRequire("simple-statistics");
    var mb = ss.linearRegression([[from.index, from.lowMid],
                                  [minima.index, minima.lowMid]]);
    var line = ss.linearRegressionLine(mb);
    var clear = between.reduce(function(clear, candle) {
      var y = line(candle.index);
      return clear && candle.lowMid > y;
    }, true);
    if (clear) {
      LongTrendlines.insert({
        line: mb,
        candles: [from, minima]
      });
    }
  }.bind(this));
});
