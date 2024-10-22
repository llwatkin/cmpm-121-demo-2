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
  allLines.push(currLine); // Push finished line to the total lines array
  currLine = createLine(); // Reset line to prepare for next stroke
  redoLines = []; // Clear previous redo lines when a new line is drawn
});

function clearCanvas() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
}

canvas.addEventListener("drawing-changed", () => {
  clearCanvas();
  // Draw current line
  currLine.display(ctx!);
  // Draw all past lines
  for (let i = 0; i < allLines.length; i++) {
    allLines[i].display(ctx!);
  }
});

function createButton(name: string) {
  const newButton = document.createElement("button");
  newButton.innerHTML = name;
  app.append(newButton);
  return newButton;
}

const clearButton = createButton("Clear");
clearButton.addEventListener("click", () => {
  allLines = [];
  redoLines = [];
  clearCanvas();
});

const undoButton = createButton("Undo");
undoButton.addEventListener("click", () => {
  const undoLine = allLines.pop();
  if (undoLine) {
    redoLines.push(undoLine);
  }
  canvas.dispatchEvent(drawingChangeEvent);
});

const redoButton = createButton("Redo");
redoButton.addEventListener("click", () => {
  const redoLine = redoLines.pop();
  if (redoLine) {
    allLines.push(redoLine);
  }
  canvas.dispatchEvent(drawingChangeEvent);
});
