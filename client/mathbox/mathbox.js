Template.mathbox.onCreated(function() {
  this.subscribe("candlesticks");

  this.autorun(function() {
    candles = Candlesticks.find({}, {
      sort: {
        date: -1
      },
      limit: 200
    }).fetch();
  }.bind(this));
});
Template.mathbox.onRendered(function() {
  mathbox = mathBox({
    plugins: ['core', 'controls', 'cursor'],
    controls: {
      klass: THREE.OrbitControls,
    },
    loop: {
      start: window == window.top,
    },
    camera: {
      near: .01,
      far: 2000,
    }
  });
  three = mathbox.three;

  three.camera.position.set(0, 0, 2);
  three.camera.lookAt(new THREE.Vector3())
  three.renderer.setClearColor(new THREE.Color(0xFFFFFF), 1.0);

  view = mathbox
  .set({
    scale: null,
  })
  .cartesian({
        range: [[-1, 1], [1.0617, 1.075285], [-1, 2000]],
        scale: [1, 1, 1],
      });

  view.interval({
    length: 200,
    expr: function (emit, x, i, t) {
      var candle = candles[i];
      // y = Math.sin(x + t / 4) * .5 + .75;
      var y = candle.lowMid;
      var z = candle.volume;
      emit(x, y, z);
    },
    channels: 3,
  })
  .line({
    color: 0x30C0FF,
    width: 4,
  })
  .resample({
    width: 20,
  })
  .point({
    color: 0x30C0FF,
    size: 20,
  })
  .html({
    width:  20,
    height: 1,
    expr: function (emit, el, i, j, k, l, t) {
      var candle = candles[i];
      var color = ['#30D0FF','#30A0FF'][i%2];
      emit(el('span', {style: {color: color}}, candle.lowMid.toFixed(4)));
    },
  })
  .dom({
    snap: false,
    offset: [0, 16],
    depth: 0,
    zoom: 1,
    outline: 1,
    size: 10,
  });

});
