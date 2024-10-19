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
}
const currLine: Line = { points: [] };
let allLines: Array<Line> = [];
const redoLines: Array<Line> = [];

const drawingChangeEvent = new Event("drawing-changed");

canvas.addEventListener("mousedown", () => {
  cursor.active = true;
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    const newPoint: Point = { x: e.offsetX, y: e.offsetY };
    currLine.points.push(newPoint);
    canvas.dispatchEvent(drawingChangeEvent);
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  const finishedLine: Line = { points: currLine.points };
  allLines.push(finishedLine); // Push finished line to the lines array
  currLine.points = []; // Clear current points to start a new line
});

function drawLine(line: Line) {
  for (let i = 0; i < line.points.length - 1; i++) {
    ctx!.beginPath();
    ctx!.moveTo(line.points[i].x, line.points[i].y);
    ctx!.lineTo(line.points[i + 1].x, line.points[i + 1].y);
    ctx!.stroke();
  }
}

function clearCanvas() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
}

canvas.addEventListener("drawing-changed", () => {
  console.log("drawing changed");
  clearCanvas();
  // Draw current line
  drawLine(currLine);
  // Draw all past lines
  for (let i = 0; i < allLines.length; i++) {
    drawLine(allLines[i]);
  }
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
app.append(clearButton);

clearButton.addEventListener("click", () => {
  allLines = [];
  clearCanvas();
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
app.append(undoButton);

undoButton.addEventListener("click", () => {
  const undoLine = allLines.pop();
  if (undoLine) {
    redoLines.push(undoLine);
  }
  canvas.dispatchEvent(drawingChangeEvent);
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
app.append(redoButton);

redoButton.addEventListener("click", () => {
  const redoLine = redoLines.pop();
  if (redoLine) {
    allLines.push(redoLine);
  }
  canvas.dispatchEvent(drawingChangeEvent);
});
