Minima = new Mongo.Collection("minima");

/*
 * On every minima:
 *  - Check if it's a bounce for a LongTrendline
 *    = Make sure LongTrendline is not broken
 *  - Check if it can make a new LongTrendline
 *    = Make sure no existing points break it
 */

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
    if (trendline.bounces(minima)) {
      // var from = _.last(trendline.candles);
      // var between = Candlesticks.find({
      //   $and: [
      //     {date: {$gt: from.date}},
      //     {date: {$lt: minima.date}}
      //   ]
      // }).fetch();
      // var clear = between.reduce(function(clear, candle) {
      //   return clear && !trendline.breaks(candle);
      // }, true);
      // if (clear) {
        console.log(`Adding minima ${minima._id} to trend ${trendline._id}`);
        LongTrendlines.update(trendline._id, {
          $set: {
            line: trendline.mb(minima)
          },
          $push: {
            candles: minima
          }
        });
        linked = _.union(linked, _.pluck(trendline.candles, "candlestickId"));
      // }
    }
  });

  var previous = Minima.find({
    // candlestickId: {
    //   $nin: linked 
    // },
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
