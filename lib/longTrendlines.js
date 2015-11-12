LongTrendlines = new Mongo.Collection("longTrendlines");

if (Meteor.isServer) {
  LongTrendlines.helpers({
    rr: function(point) {
      var ss = Meteor.npmRequire("simple-statistics");
      var line = ss.linearRegressionLine(this.line);
      var union = _.union(this.candles, point);
      var points = union.map(function(candle) {
        return [candle.index, candle.lowMid];
      });
      return ss.rSquared(points, line);
    },
    mb: function(point) {
      var ss = Meteor.npmRequire("simple-statistics");
      var line = ss.linearRegressionLine(this.line);
      var union = _.union(this.candles, point);
      var points = union.map(function(candle) {
        return [candle.index, candle.lowMid];
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
      var points = _.pluck(this.candles, "lowMid");
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
      if (this.line.m > 0) {
        return point.lowMid - expected < - margin;
      }
      else {
        return point.lowMid - expected > margin;
      }
    },
    bounces: function(point) {
      var margin = this.marginOfError();
      var expected = this.expected(point);
      if (this.line.m > 0) {
        return point.lowMid - expected < margin;
      }
      else {
        return point.lowMid - expected > - margin;
      }
    }
  });
}

function cumulativeDistribution(z) {
  var SQRT_2PI = Math.sqrt(2 * Math.PI);
  var sum = z,
      tmp = z;

  // 15 iterations are enough for 4-digit precision
  for (var i = 1; i < 15; i++) {
    tmp *= z * z / (2 * i + 1);
    sum += tmp;
  }
  return Math.round((0.5 + (sum / SQRT_2PI) * Math.exp(-z * z / 2)) * 1e4) / 1e4;
}
