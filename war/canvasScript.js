
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
	for (var b of boxes) {
		for (var i = 0; i < boxes.length; i++) {
			if (b.connections[i]) {
				var X = boxes[i].x;
				var Y = boxes[i].y;
				var dx = X - b.x;
				var dy = Y - b.y;
				if (dx == 0 && dy == 0) continue;
				//Compute how far we have to back up to reach the squares' edges
				var factor;
				if (Math.abs(dy) > Math.abs(dx)) {
					factor = 10/Math.abs(dy);
				} else {
					factor = 10/Math.abs(dx);
				}
				dx *= factor;
				dy *= factor;
				graphics.beginPath();
				//The arrow's shaft
				graphics.moveTo(b.x+dx+10, b.y+dy+10)
				X += 10-dx;
				Y += 10-dy;
				graphics.lineTo(X, Y);
				//Draw the arrow head
				graphics.lineTo(X-dx+dy, Y-dy-dx);
				graphics.moveTo(X, Y);
				graphics.lineTo(X-dx-dy, Y-dy+dx);
				//Close the path, draw the line.
				graphics.stroke();
			}
		}
	}
}

function initBoxes() {
	var numBoxes = 8;
	boxes = new Array(numBoxes);
	for (var i = 0; i < numBoxes; i++) {
		var tmp = {
			x:25*i,
			y:0,
			color:"rgb("+(255*(i&1))+","+(255*((i&2)/2))+","+(255*((i&4)/4))+")",
			connections:[]};
		boxes[i] = tmp;
	}
	boxes[0].connections[1] = true;
	boxes[0].connections[3] = true;
	boxes[0].connections[4] = true;
	boxes[5].connections[3] = true;
	boxes[5].connections[4] = true;
	boxes[4].connections[5] = true;
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
