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
let currLine: Array<Point> = [];
let allLines: Array<Array<Point>> = [];

const drawingChangeEvent = new Event("drawing-changed");

canvas.addEventListener("mousedown", () => {
  cursor.active = true;
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    const newPoint: Point = { x: e.offsetX, y: e.offsetY };
    currLine.push(newPoint);
    canvas.dispatchEvent(drawingChangeEvent);
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  allLines.push(currLine); // Push finished line to the lines array
  currLine = [];
});

function drawLine(line: Array<Point>) {
  for (let i = 0; i < line.length - 1; i++) {
    ctx!.beginPath();
    ctx!.moveTo(line[i].x, line[i].y);
    ctx!.lineTo(line[i + 1].x, line[i + 1].y);
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
