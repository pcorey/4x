var instruments = Meteor.settings.public.instruments || [];

function getCandles() {
  instruments.forEach(function(instrument) {
    console.log(`Getting candles for ${instrument}.`);
    var last = Candlesticks.mostRecent({
      instrument: instrument
    });
    
    var start = last ?
                moment(last.date) :
                moment().subtract(24, "hours");
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
}

Meteor.startup(getCandles);

SyncedCron.add({
  name: "Get candles",
  schedule: function(parser) {
    return parser.text("every 30 seconds");
  },
  job: getCandles
});

SyncedCron.start();
