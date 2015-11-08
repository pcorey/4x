var instruments = Meteor.settings.public.instruments || [];

Meteor.startup(function() {
  instruments.forEach(function(instrument) {
    console.log(`Getting candles for ${instrument}.`);
    var last = Candlesticks.mostRecent({
      instrument: instrument
    });
    
    var start = last ?
                moment(last.date) :
                moment().subtract(30, "days");
    var end = moment();

    var result = OANDA.getCandles({
      instrument: instrument,
      granularity: "D",
      start: start.utc().format("YYYY-MM-DDTHH:mm:ss.000000Z"),
      end: end.utc().format("YYYY-MM-DDTHH:mm:ss.000000Z")
    });

    if (result && result.data) {
      console.log(`Got ${result.data.candles.length} candles for ${instrument}.`);
      result.data.candles.map(function(candle) {
        Candlesticks.insertOandaCandle(candle, result);
      });
      Candlesticks.calculateMinimaMaxima(Candlesticks.find({
        date: {
          $gte: start.toDate()
        }
      }).fetch());
    }
    else {
      console.log("No results!")
    }
  });
});
