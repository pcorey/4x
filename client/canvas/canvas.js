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
    wick.fillColor = '#aaa';
    // wick.strokeColor = '#888';
    // candle.strokeColor = '#888';
    candle.fillColor = '#444';

    if (open >= close) {
      candle.fillColor = "#E4572E";
    }
    else {
      candle.fillColor = "#76B041";
    }

    var group = new Group([
        wick,
        candle
    ]);

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

Template.canvas.onCreated(function() {
  this.zoomer = new SimplePanAndZoom();
  var subscriptions = [
    this.subscribe("candlesticks"),
    this.subscribe("minima"),
    this.subscribe("maxima")
  ];

  this.ready = function() {
    return subscriptions.reduce(function(ready, sub) {
      return ready && sub.ready();
    }, true);
  };
});

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
      var scale = 10000;

      candles.forEach(function(data, index) {
        var candle = buildCandle(data, index, scale);
        // candle.scale(1, view.size.height / height);
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
