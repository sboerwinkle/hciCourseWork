
var graphics;
var boxes;
var selected = null;

function coords(e) {
	graphics.fillRect(e.offsetX, e.offsetY, 20, 20);
}

function mouseDown(e) {
	for (var b of boxes) {
		var dx = Math.abs(e.offsetX-10-b.x);
		if (dx > 10) continue;
		var dy = Math.abs(e.offsetY-10-b.y);
		if (dy > 10) continue;
		selected = b;
		return;
	}
	selected = null;
	initBoxes();
	drawBoxes();
}

function mouseMove(e) {
	if (selected == null) return;
	selected.x = e.offsetX-10;
	selected.y = e.offsetY-10;
	drawBoxes();
}

function mouseUp(e) {
	selected = null;
}

function drawBoxes() {
	graphics.clearRect(0, 0, 300, 150);
	for (var b of boxes) {
		graphics.fillStyle = b.color;
		graphics.fillRect(b.x, b.y, 20, 20);
	}
}

function initBoxes() {
	var numBoxes = 8;
	boxes = new Array(numBoxes);
	for (var i = 0; i < numBoxes; i++) {
		var tmp = {x:25*i, y:0, color:"rgb("+(255*(i&1))+","+(255*((i&2)/2))+","+(255*((i&4)/4))+")"};
		boxes[i] = tmp;
	}
}

function initCanvas() {
	initBoxes();
	var can = document.getElementById("canvas")
	graphics = can.getContext('2d');
	drawBoxes();
	can.onmousedown = mouseDown;
	can.onmouseup = mouseUp;
	can.onmousemove = mouseMove;
}
