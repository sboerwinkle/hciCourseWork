
var canvas;
var graphics;

var menuBoxes;
var boxes;
var selected = null;
var closest = null;

var mouseX = 0; mouseY = 0;

var menuHeight = 16+10; // Box height plus 5px buffer on either side
/*
Boxes have:
type - one of {"top", "in", "out"}
x
y
w - width
h - height
color
Top boxes have:
	children
	label
In boxes have:
	owner
	connection
Out boxes have:
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
		if (rmMe.label == "Start" || rmMe.label == "End") return; // These nodes can't be destroyed
		boxes[boxes.indexOf(rmMe)] = boxes[boxes.length-1];
		boxes.length--;
		for (var b of boxes) {
			for (var c of b.children) {
				if (c.type == "in" && c.connection != null && c.connection.owner == rmMe) c.connection = null;
			}
		}
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
	if (closest != null) {
		if (closest.type == "in") closest.connection = null;
		else selected = closest;
		render();
	}
}

function mouseMove(e) {
	mouseX = e.offsetX;
	mouseY = e.offsetY;
	if (selected != null && selected.type == "top") {
		selected.x = e.offsetX-selected.w/2;
		selected.y = e.offsetY-selected.h/2;
		if (selected.y < menuHeight) selected.y = menuHeight;
		render();
		return;
	}
	findClosest();
	render();
	if (selected != null && selected.type == "out") {
		graphics.beginPath();
		graphics.moveTo(selected.x + 3, selected.y + 3);
		graphics.lineTo(mouseX, mouseY);
		graphics.stroke();
	}
}

function mouseUp(e) {
	if (selected != null && selected.type == "out" && closest.type == "in") {
		closest.connection = selected;
		render();
	}
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
	for (var b of boxes) {
		for (var c of b.children) {
			if (c.type == "out" || c.connection == null) continue;
			graphics.beginPath();
			graphics.moveTo(c.connection.x + 3, c.connection.y + 3);
			graphics.lineTo(c.x + 3, c.y + 3);
			graphics.stroke();
		}
	}
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
	tmp.owner = b;
	if (type == "in") {
		tmp.connection = null;
		tmp.Y = -child.h/2;
		tmp.color = "#0f0";
	} else {
		tmp.Y = b.h - child.h/2;
		tmp.color = "#f00";
	}
	b.children[b.children.length] = tmp;

}

function createBox(name, r, g, b) {
	var w = graphics.measureText(name).width;
	var tmp = {
		type:"top",
		w:w+6,
		h:16,
		color:"rgb("+r+","+g+","+b+")",
		label:name.toString(),
		children:[]
	};
	return tmp;
}

function initBoxes() {
	var specs = [
		["Split", 255, 255, 0, 2, 1],
		["Unsplit", 255, 255, 0, 2, 1],
		["Then", 128, 128, 128, 2, 1],
		["Matches", 255, 0, 255, 2, 1],
		["Random", 0, 0, 255, 0, 1],
		["Select", 0, 255, 255, 3, 1]];
	menuBoxes = [];
	boxes = [];
	var menuSpaceUsed = 5;
	var i = 0;
	for (var s of specs) {
		var tmp = createBox(s[0], s[1], s[2], s[3]);
		while (s[4]--) addChild(tmp, "in");
		while (s[5]--) addChild(tmp, "out");
		tmp.x = menuSpaceUsed,
		tmp.y = 5,
		menuSpaceUsed += tmp.w+10;
		menuBoxes[i++] = tmp;
	}

	boxes[0] = createBox("End", 255, 0, 0);
	addChild(boxes[0], "in");
	boxes[0].x = (canvas.width-boxes[0].w)/2;
	boxes[0].y = canvas.height - boxes[0].h;

	boxes[1] = createBox("Start", 0, 255, 0);
	addChild(boxes[1], "out");
	boxes[1].x = (canvas.width-boxes[1].w)/2;
	boxes[1].y = menuHeight;
}

function initCanvas() {
	canvas = document.getElementById("canvas")
	graphics = canvas.getContext('2d');
	graphics.lineWidth = 2;
	initBoxes();
	render();
	canvas.onmousedown = mouseDown;
	canvas.onmouseup = mouseUp;
	canvas.onmousemove = mouseMove;
	canvas.onkeydown = keyPress;
}

//Called when the user clicks on the "Add String Constant" button
function addConstant() {
	var textbox = document.getElementById("constantText");
	var tmp = createBox("\""+textbox.value+"\"", 255, 255, 255);
	textbox.value="";
	addChild(tmp, "out");
	tmp.x = 0;
	tmp.y = menuHeight;
	boxes[boxes.length] = tmp;
	canvas.focus();
	render();
}

//Called from GWT code to get the results of the build-a-bot'ing
window.getBotString = function() {
	var ret = "";
	for (var b of boxes) {
		var text = b.label.replace(/\\/g, "\\\\").replace(/\(/g, "\\(");
		ret += text+"(";
		for (var c of b.children) {
			if (c.type=="out") continue;
			first = false;
			if (c.connection == null) return "";
			ret += boxes.indexOf(c.connection.owner);
			ret += ",";
		}
		ret += ")";
	}
	return ret;
}
