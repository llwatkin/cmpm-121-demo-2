import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const APP_NAME = "AquaSketch";
document.title = APP_NAME;

const titleDisplay = document.createElement("h1");
titleDisplay.innerHTML = APP_NAME;
app.append(titleDisplay);

const canvas = document.createElement("canvas");
canvas.height = 256;
canvas.width = 256;
app.append(canvas);

const ctx = canvas.getContext("2d");
const cursor = { active: false, x: 0, y: 0 };

interface Point {
  x: number;
  y: number;
}

interface Line {
  points: Array<Point>;

  drag(newPoint: Point): void;
  display(ctx: CanvasRenderingContext2D): void;
}

function createLine(initPoint?: Point): Line {
  const points: Array<Point> = [];
  if (initPoint) {
    points.push(initPoint);
  }

  return {
    points: points,
    drag: (newPoint: Point) => {
      points.push(newPoint);
    },
    display: (ctx: CanvasRenderingContext2D) => {
      for (let i = 0; i < points.length - 1; i++) {
        ctx!.beginPath();
        ctx!.moveTo(points[i].x, points[i].y);
        ctx!.lineTo(points[i + 1].x, points[i + 1].y);
        ctx!.stroke();
      }
    },
  };
}

let currLine: Line;
let allLines: Array<Line> = [];
let redoLines: Array<Line> = [];

const drawingChangeEvent = new Event("drawing-changed");

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  const initPoint: Point = { x: e.offsetX, y: e.offsetY };
  currLine = createLine(initPoint);
  allLines.push(currLine);
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    const newPoint: Point = { x: e.offsetX, y: e.offsetY };
    currLine.drag(newPoint);
    canvas.dispatchEvent(drawingChangeEvent);
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  redoLines = []; // Clear previous redo lines whenever a new line is drawn
});

function clearCanvas() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
}

canvas.addEventListener("drawing-changed", () => {
  clearCanvas();
  for (let i = 0; i < allLines.length; i++) {
    allLines[i].display(ctx!);
  }
});

function createButton(name: string, clickFunction: VoidFunction) {
  const newButton = document.createElement("button");
  newButton.innerHTML = name;
  app.append(newButton);

  newButton.addEventListener("click", clickFunction);
  return newButton;
}

createButton("Clear", function () {
  allLines = [];
  redoLines = [];
  clearCanvas();
});

createButton("Undo", function () {
  const undoLine = allLines.pop();
  if (undoLine) {
    redoLines.push(undoLine);
  }
  canvas.dispatchEvent(drawingChangeEvent);
});

createButton("Redo", function () {
  const redoLine = redoLines.pop();
  if (redoLine) {
    allLines.push(redoLine);
  }
  canvas.dispatchEvent(drawingChangeEvent);
});
