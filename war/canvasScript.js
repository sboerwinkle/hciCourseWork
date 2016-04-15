
var canvas;
var graphics;

var menuBoxes;
var boxes;
var selected = null;
var closest = null;

var mouseX = 0; mouseY = 0;

var menuHeight = 20;
/*
Boxes have:
type - one of {"top", "in", "out"}
x
y
w - width
h - height
color
Top boxes have:
	label
	children
In/Out boxes have:
	owner
*/

function boxDist(b, x, y) {
	return Math.max(x-b.x-b.w, b.x-x, y-b.y-b.h, b.y-y);
}

var last;
function keyPress(e) {
	if (e.code == "Backspace" || e.code=="Del" || e.code=="Delete") {
		if (e.cancelable) e.preventDefault();
		if (closest == null) return;
		var rmMe = closest.type=="top" ? closest : closest.owner;
		boxes[boxes.indexOf(rmMe)] = boxes[boxes.length-1];
		boxes.length--;
		selected = null;
		findClosest();
		render();
	}
}

function mouseDown(e) {
	var b;
	for (b of menuBoxes) {
		if (boxDist(b, e.offsetX, e.offsetY) <= 0) {
			var tmp = {type:"top", w: b.w, h: b.h, label: b.label, color: b.color};
			tmp.children = [];
			for (var i = 0; i < b.children.length; i++) {
				var kid = b.children[i];
				//You can read more about this on the webs. It doesn't actually copy it, but sets up the b.children[i] as the prototype of tmp.children[i].
				tmp.children[i] = Object.create(b.children[i]);
				//This property we want to set by hand
				tmp.children[i].owner = tmp;
			}
			boxes[boxes.length] = tmp;
			selected = tmp;
			closest = tmp;
			//This call sets x and y
			mouseMove(e);
			return;
		}
	}
	if (closest != null && boxDist(closest, e.offsetX, e.offsetY) <= 0) {
		selected = closest;
	}
}

function mouseMove(e) {
	mouseX = e.offsetX;
	mouseY = e.offsetY;
	if (selected != null) {
		selected.x = e.offsetX-selected.w/2;
		selected.y = e.offsetY-selected.h/2;
		if (selected.y < menuHeight) selected.y = menuHeight;
	} else {
		findClosest();
	}
	render();
}

function mouseUp(e) {
	selected = null;
}

function renderBox(b) {
	graphics.fillStyle = b.color;
	graphics.fillRect(b.x, b.y, b.w, b.h);
	if (b.type == "top") {
		graphics.fillStyle = "rgb(0,0,0)";
		graphics.fillText(b.label, b.x+3, b.y+b.h-3);
		for (var c of b.children) renderBox(c);
	}
	if (b == closest) {
		graphics.strokeRect(b.x, b.y, b.w, b.h);
	}
}

function findClosest() {
	if (boxes.length == 0) {
		closest = null;
		return;
	}
	var best = boxDist(boxes[0], mouseX, mouseY);
	closest = boxes[0];
	for (var b of boxes) {
		var dist = boxDist(b, mouseX, mouseY);
		if (dist < best) {
			best = dist;
			closest = b;
		}
		for (var c of b.children) {
			var dist = boxDist(c, mouseX, mouseY);
			if (dist < best) {
				best = dist;
				closest = c;
			}
		}
	}
}

function render() {
	graphics.clearRect(0, 0, canvas.width, canvas.height);
	for (var b of menuBoxes) renderBox(b);
	for (var b of boxes) renderBox(b);
	//Draw the line separating the selection area from the working area
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

//The prototypical child. If you say child.x, it silently redirects to the x() function. This makes the children smoothly move with their parents.
var child = {get x() {return this.X+this.owner.x;}, get y() {return this.Y+this.owner.y}, w:6, h:6};

function addChild(b, type) {
	var sameCount = 0;
	for (var i = 0; i < b.children.length; i++) {
		if (b.children[i].type == type) sameCount++;
	}
	var tmp = Object.create(child);
	tmp.type = type;
	tmp.X = b.w*([0.0, 1.0, 0.5][sameCount]) - child.w/2;
	tmp.Y = (type=="in" ? 0 : b.h) - child.h/2;
	tmp.color = type=="in"?"#0f0":"#f00";
	tmp.owner = b;
	b.children[b.children.length] = tmp;

}

function initBoxes() {
	var numBoxes = 8;
	menuBoxes = new Array(numBoxes);
	boxes = [];
	for (var i = 0; i < numBoxes; i++) {
		var tmp = {
			type:"top",
			x:25*i,
			y:0,
			w:20,
			h:20,
			color:"rgb("+(255*(i&1))+","+(255*((i&2)/2))+","+(255*((i&4)/4))+")",
			label:i.toString(),
			children:[]
		};
		menuBoxes[i] = tmp;
	}
	addChild(menuBoxes[1], "in");
	addChild(menuBoxes[1], "in");
	addChild(menuBoxes[3], "in");
	addChild(menuBoxes[3], "out");
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
	graphics.lineWidth = 2;
	render();
	canvas.onmousedown = mouseDown;
	canvas.onmouseup = mouseUp;
	canvas.onmousemove = mouseMove;
	canvas.onkeydown = keyPress;
}
