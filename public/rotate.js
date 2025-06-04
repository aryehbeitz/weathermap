(function () {
  function getAngle(a, b) {
    return Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) * 180 / Math.PI;
  }

  L.Map.addInitHook(function () {
    if (!L.Browser.touch) {
      return;
    }

    const container = this.getContainer();
    container.style.touchAction = "none";
    container.style.transformOrigin = "center center";
    let pointer1 = null;
    let pointer2 = null;
    let startAngle = 0;
    let startRotation = 0;

    function onPointerDown(e) {
      if (!pointer1) {
        pointer1 = e;
      } else if (!pointer2) {
        pointer2 = e;
        startAngle = getAngle(pointer1, pointer2);
        startRotation = currentRotation();
      }
    }

    function currentRotation() {
      const match = container.style.transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/);
      return match ? parseFloat(match[1]) : 0;
    }

    function onPointerMove(e) {
      if (pointer1 && e.pointerId === pointer1.pointerId) pointer1 = e;
      if (pointer2 && e.pointerId === pointer2.pointerId) pointer2 = e;
      if (pointer1 && pointer2) {
        const angle = getAngle(pointer1, pointer2);
        const delta = angle - startAngle;
        const rotation = startRotation + delta;
        container.style.transform = `rotate(${rotation}deg)`;
      }
    }

    function endPointer(e) {
      if (pointer1 && e.pointerId === pointer1.pointerId) pointer1 = null;
      if (pointer2 && e.pointerId === pointer2.pointerId) pointer2 = null;
    }

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", endPointer);
    container.addEventListener("pointercancel", endPointer);
  });
})();
