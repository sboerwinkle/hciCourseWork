
var canvas;
var graphics;

var menuBoxes;
var boxes;
var selected = null;

var mouseX = 0; mouseY = 0;

var menuHeight = 20;
/*
Boxes have:
x
y
w - width
h - height
label
color
*/

function boxDist(b, x, y) {
	return Math.max(x-b.x-b.w, b.x-x, y-b.y-b.h, b.y-y);
}

var last;
function keyPress(e) {
	if (e.code == "Backspace" || e.code=="Del" || e.code=="Delete") {
		if (e.cancelable) e.preventDefault();
		if (boxes.length == 0) return;
		boxes[getNearest()] = boxes[boxes.length-1];
		boxes.length--;
		selected = null;
		render();
	}
}

function mouseDown(e) {
	var b;
	for (b of boxes) {
		if (boxDist(b, e.offsetX, e.offsetY) <= 0) {
			selected = b;
			return;
		}
	}
	for (b of menuBoxes) {
		if (boxDist(b, e.offsetX, e.offsetY) <= 0) {
			boxes[boxes.length] = {w: b.w, h: b.h, label: b.label, color: b.color};
			selected = boxes[boxes.length-1];
			//This call sets x and y
			mouseMove(e);
			return;
		}
	}
}

function mouseMove(e) {
	mouseX = e.offsetX;
	mouseY = e.offsetY;
	if (selected != null) {
		selected.x = e.offsetX-selected.w/2;
		selected.y = e.offsetY-selected.h/2;
		if (selected.y < menuHeight) selected.y = menuHeight;
	}
	render();
}

function mouseUp(e) {
	selected = null;
}

function renderBox(b) {
	graphics.fillStyle = b.color;
	graphics.fillRect(b.x, b.y, b.w, b.h);
	graphics.fillStyle = "rgb(0,0,0)"
	graphics.fillText(b.label, b.x+3, b.y+b.h-3);
}

function getNearest() {
	if (boxes.length == 0) return -1;
	var ret = 0;
	var best = boxDist(boxes[0], mouseX, mouseY);
	for (var i = 1; i < boxes.length; i++) {
		var dist = boxDist(boxes[i], mouseX, mouseY);
		if (dist < best) {
			best = dist;
			ret = i;
		}
	}
	return ret;
}

function highlightSelected() {
	if (boxes.length == 0) return;
	var hl;
	if (selected != null) {
		graphics.lineWidth = 3;
		hl = selected;
	} else {
		hl = boxes[getNearest()];
		if (boxDist(hl, mouseX, mouseY) <= 0) graphics.lineWidth = 3;
	}
	graphics.strokeRect(hl.x, hl.y, hl.w, hl.h);
	graphics.lineWidth = 1;
}

function render() {
	graphics.clearRect(0, 0, canvas.width, canvas.height);
	for (var b of menuBoxes) renderBox(b);
	for (var b of boxes) renderBox(b);
	highlightSelected();
	//Draw the line separating the selection area from the working area
	graphics.fillStyle = "black";
	graphics.beginPath();
	graphics.moveTo(0, menuHeight);
	graphics.lineTo(canvas.width, menuHeight);
	graphics.stroke();
	/*for (var b of boxes) {
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
				//End the path, draw the line.
				graphics.stroke();
			}
		}
	}*/
}

function initBoxes() {
	var numBoxes = 8;
	menuBoxes = new Array(numBoxes);
	boxes = [];
	for (var i = 0; i < numBoxes; i++) {
		var tmp = {
			x:25*i,
			y:0,
			w:20,
			h:20,
			label:i.toString(),
			color:"rgb("+(255*(i&1))+","+(255*((i&2)/2))+","+(255*((i&4)/4))+")"};
		menuBoxes[i] = tmp;
	}
	/*boxes[0].connections[1] = true;
	boxes[0].connections[3] = true;
	boxes[0].connections[4] = true;
	boxes[5].connections[3] = true;
	boxes[5].connections[4] = true;
	boxes[4].connections[5] = true;*/
}

function initCanvas() {
	initBoxes();
	canvas = document.getElementById("canvas")
	graphics = canvas.getContext('2d');
	render();
	canvas.onmousedown = mouseDown;
	canvas.onmouseup = mouseUp;
	canvas.onmousemove = mouseMove;
	canvas.onkeydown = keyPress;
}
