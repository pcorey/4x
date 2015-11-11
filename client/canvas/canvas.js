Template.canvas.onCreated(function() {
  this.zoomer = new SimplePanAndZoom();
  var subscriptions = [
    this.subscribe("candlesticks"),
    this.subscribe("minima"),
    this.subscribe("maxima"),
    this.subscribe("longTrendlines")
  ];

  this.ready = function() {
    return subscriptions.reduce(function(ready, sub) {
      return ready && sub.ready();
    }, true);
  };
});

function candleToPoint(candle, scale, line) {
  var candlesticks = Candlesticks.find({}, {
    sort: {
      date: -1
    }
  }).fetch();
  var ids = _.pluck(candlesticks, "_id");
  var index = ids.indexOf(candle.candlestickId);
  var x = index * -60;
  var y = -candle.lowMid * scale;
  if (line) {
    y = -(line.m * candle.index + line.b) * scale;
  }
  return new paper.Point(x + 20, y);
}

function buildCandle(data, index, scale) {
  var high = data.highMid * scale;
  var low = data.lowMid * scale;
  var open = data.openMid * scale;
  var close = data.closeMid * scale;
  with (paper) {
    var wick = new Path.Rectangle(
        new Point(10,0),
        new Size(20, high - low));
    var candle = new Path.Rectangle(
        new Point(0, high - Math.max(open, close)),
        new Size(40, Math.max(open, close) - Math.min(open, close)));

    var group = new Group([
        wick,
        candle
    ]);

    if (open >= close) {
      group.fillColor = "#E4572E";
    }
    else {
      group.fillColor = "#76B041";
    }

    if (Minima.findOne({
      candlestickId: data._id
    })) {
      var minima = new Path.Circle(new Point(20, high - low), 10);
      minima.strokeColor = 'blue';
      minima.fillColor = 'lightblue';
      group.addChild(minima);
    }
    if (Maxima.findOne({
      candlestickId: data._id
    })) {
      var maxima = new Path.Circle(new Point(20, 0), 10);
      maxima.strokeColor = 'red';
      maxima.fillColor = 'pink';
      group.addChild(maxima);
    }

    group.translate(new Point(index * -60, -high));
    return group;
  }
}

Template.canvas.onRendered(function() {
  with (paper) {
    var canvas = $('#canvas')[0];
    setup(canvas);
    
    this.autorun(() => {
      if (!this.ready()) {
        return;
      }

      var candles = Candlesticks.find({}, {
        sort: {
          date: -1
        },
        limit: 500
      }).fetch();

      if (!candles.length) {
        return;
      }

      console.log("Rendering...");
      project.activeLayer.removeChildren();

      var high = Candlesticks.findOne({}, {$sort: {highMid: -1}}).highMid;
      var low = Candlesticks.findOne({}, {$sort: {lowMid: 1}}).lowMid;
      var height = high - low;
      var scale = 1000000;

      candles.forEach(function(data, index) {
        var candle = buildCandle(data, index, scale);
        // candle.scale(1, view.size.height / height);
      });

      LongTrendlines.find({
        // broken: {$ne: true},
        $where: "this.candles.length > 2"
      }).fetch().map(function(trendline) {
        var from = _.first(trendline.candles);
        var to = _.last(trendline.candles);
        var line = new Path.Line(candleToPoint(from, scale),
                                 candleToPoint(to, scale, trendline.line));
        if (trendline.broken) {
          line.strokeColor = 'pink';
          line.strokeWidth = 1;
        }
        else {
          line.strokeColor = 'lightblue';
          var candles = trendline.candles.length;
          line.strokeWidth = candles <= 2 ? 1 : candles * 10;
        }
      });

      view.center = new Point(0, -candles[0].highMid * scale);
      view.zoom = 0.25;
      V = view;
      P = paper;
      view.draw();
    });
  }
});

Template.canvas.events({
  'mousewheel #canvas': function(e, t) {
    if (e.shiftKey) {
      paper.view.zoom = t.zoomer.changeZoom(paper.view.zoom, -e.deltaY);
    }
    else {
      paper.view.center = t.zoomer.changeCenter(paper.view.center,
                                                e.deltaX,
                                                e.deltaY,
                                                e.deltaFactor);
    }
    e.preventDefault();
  }
});
