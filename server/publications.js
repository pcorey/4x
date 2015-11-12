Meteor.publish("candlesticks", function() {
  return Candlesticks.find();
});

Meteor.publish("minima", function() {
  return Minima.find();
});

Meteor.publish("maxima", function() {
  return Maxima.find();
});

Meteor.publish("longTrendlines", function() {
  return LongTrendlines.find();
});

Meteor.publish("shortTrendlines", function() {
  return ShortTrendlines.find();
});
