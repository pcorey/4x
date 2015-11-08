Meteor.publish("candlesticks", function() {
  return Candlesticks.find();
});

Meteor.publish("minima", function() {
  return Minima.find();
});

Meteor.publish("maxima", function() {
  return Maxima.find();
});
