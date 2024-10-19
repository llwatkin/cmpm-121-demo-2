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
let currLine: Array<Point> = [];
let allLines: Array<Array<Point>> = [];
const drawingChangeEvent = new Event("drawing-changed");

interface Point {
  x: number;
  y: number;
}

canvas.addEventListener("mousedown", (e) => {
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
  allLines.push(currLine);
  currLine = [];
});

canvas.addEventListener("drawing-changed", () => {
  console.log("drawing changed");
  clearCanvas();
  // Draw current line
  for (let i = 0; i < currLine.length - 1; i++) {
    ctx!.beginPath();
    ctx!.moveTo(currLine[i].x, currLine[i].y);
    ctx!.lineTo(currLine[i + 1].x, currLine[i + 1].y);
    ctx!.stroke();
  }
  // Draw all past lines
  for (let i = 0; i < allLines.length; i++) {
    for (let j = 0; j < allLines[i].length - 1; j++) {
      ctx!.beginPath();
      ctx!.moveTo(allLines[i][j].x, allLines[i][j].y);
      ctx!.lineTo(allLines[i][j + 1].x, allLines[i][j + 1].y);
      ctx!.stroke();
    }
  }
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
app.append(clearButton);

function clearCanvas() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
}

clearButton.addEventListener("click", () => {
  allLines = [];
  clearCanvas();
});
