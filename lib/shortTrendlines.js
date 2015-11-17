ShortTrendlines = new Mongo.Collection("shortTrendlines");

if (Meteor.isServer) {
  ShortTrendlines.helpers({
    rr: function(point) {
      var ss = Meteor.npmRequire("simple-statistics");
      var line = ss.linearRegressionLine(this.line);
      var union = _.union(this.candles, point);
      var points = union.map(function(candle) {
        return [candle.index, candle.highMid];
      });
      return ss.rSquared(points, line);
    },
    mb: function(point) {
      var ss = Meteor.npmRequire("simple-statistics");
      var line = ss.linearRegressionLine(this.line);
      var union = _.union(this.candles, point);
      var points = union.map(function(candle) {
        return [candle.index, candle.highMid];
      });
      return ss.linearRegression(points);
    },
    expected: function(point) {
      var ss = Meteor.npmRequire("simple-statistics");
      var line = ss.linearRegressionLine(this.line);
      return line(point.index);
    },
    standardDeviation: function() {
      var ss = Meteor.npmRequire("simple-statistics");
      var points = _.pluck(this.candles, "highMid");
      return ss.sampleStandardDeviation(points);
    },
    marginOfError: function() {
      var ss = Meteor.npmRequire("simple-statistics");
      var confidence = (1 - Meteor.settings.trends.confidence) / 2;
      var standardError = this.standardDeviation() / Math.sqrt(this.candles.length);
      var criticalValue = cumulativeDistribution(confidence);
      return criticalValue * standardError;
    },
    breaks: function(point) {
      var margin = this.marginOfError();
      var expected = this.expected(point);
      return point.highMid - expected > margin;
    },
    bounces: function(point) {
      var margin = this.marginOfError();
      var expected = this.expected(point);
      return point.highMid - expected > - margin;
    },
    short: function() {
      var ago = moment().subtract(15, "minutes").toDate();
      if (_.last(this.candles).date < ago) {
        return console.log("Preventing SHORT in simulation");
      }
      var margin = this.marginOfError() * 4;
      var stopLoss = this.highMid + margin;
      stopLoss = parseFloat(stopLoss.toFixed(4));
      var trade = OANDA.short(100);
      console.log("trade", JSON.stringify(trade));
      if (trade && trade.tradeOpened && trade.tradeOpened.id) {
        ShortTrendlines.update(this._id, {
          $push: {
            trades: trade.tradeOpened
          }
        });
        console.log(`SHORT trade {$trade.tradeOpened.id} - stopLoss: ${stopLoss}`);
      }
      else {
        console.log(`ERROR making SHORT trade ${JSON.stringify(trade)}`);
      }
    },
    close: function() {
      (this.trades || []).forEach(function(trade) {
        console.log(`CLOSE trade ${trade.id}`);
        var close = OANDA.close(trade.id);
        console.log(JSON.stringify(close));
      });
    }
  });
}
