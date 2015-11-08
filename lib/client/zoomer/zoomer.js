SimplePanAndZoom = class SimplePanAndZoom {
    changeZoom(oldZoom, delta) {
      var factor = 1.05;
      if (delta < 0) {
        return oldZoom * factor;
      }
      if (delta > 0) {
        return oldZoom / factor;
      }
      return oldZoom;
    }

    changeCenter(oldCenter, deltaX, deltaY, factor) {
      var offset = new paper.Point(deltaX, -deltaY)
      offset = offset.multiply(factor)
      return oldCenter.add(offset)
    }
}
