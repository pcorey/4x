var instruments = Meteor.settings.public.instruments || [];

Meteor.startup(function() {
  instruments.forEach(function(instrument) {
    console.log(`Getting candles for ${instrument}.`);
    var last = Candlesticks.mostRecent({
      instrument: instrument
    });
    
    var start = last ?
                moment(last.date) :
                moment().subtract(8, "hours");
    var end = moment();

    var result = OANDA.getCandles(instrument, {
      granularity: "M5",
      start: start.utc().format("YYYY-MM-DDTHH:mm:ss.000000Z"),
      end: end.utc().format("YYYY-MM-DDTHH:mm:ss.000000Z")
    });

    if (result) {
      console.log(`Got ${result.candles.length} candles for ${instrument}.`);
      result.candles.map(function(candle) {
        Candlesticks.insertOandaCandle(candle, result.instrument, result.granularity);
      });
    }
    else {
      console.log("No results!")
    }
  });
});
