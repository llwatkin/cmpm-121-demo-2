import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const APP_NAME = "AquaSketch";
document.title = APP_NAME;

const titleDisplay = document.createElement("h1");
titleDisplay.innerHTML = APP_NAME;
app.append(titleDisplay);

const canvasTools = document.createElement("div");
canvasTools.id = "canvas-tools";
app.append(canvasTools);

const canvas = document.createElement("canvas");
canvas.height = 256;
canvas.width = 256;
canvas.style.cursor = "none";
app.append(canvas);

const markerTools = document.createElement("div");
markerTools.id = "marker-tools";
app.append(markerTools);

const ctx = canvas.getContext("2d");
const cursor = { active: false };
let toolPreview: ToolPreview | null = null;
const PREVIEW_RADIUS = 2;

interface Point {
  x: number;
  y: number;
}

interface Line {
  points: Array<Point>;

  drag(newPoint: Point): void;
  display(ctx: CanvasRenderingContext2D): void;
}

const THICK_LINE_WIDTH = 6;
const THIN_LINE_WIDTH = 2;
let currLineWidth = THIN_LINE_WIDTH;

function createLine(initPoint: Point, lineWidth: number): Line {
  const points: Array<Point> = [initPoint];

  return {
    points: points,
    drag: (newPoint: Point) => {
      points.push(newPoint);
    },
    display: (ctx: CanvasRenderingContext2D) => {
      ctx.lineWidth = lineWidth;
      for (let i = 0; i < points.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
      }
    },
  };
}

interface ToolPreview {
  display(ctx: CanvasRenderingContext2D): void;
}

function createToolPreview(location: Point): ToolPreview {
  return {
    display: (ctx: CanvasRenderingContext2D) => {
      ctx.lineWidth = currLineWidth;
      ctx.beginPath();
      ctx.arc(location.x, location.y, PREVIEW_RADIUS, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.stroke();
    },
  };
}

let currLine: Line;
let allLines: Array<Line> = [];
let redoLines: Array<Line> = [];

const drawingChangeEvent = new Event("drawing-changed");
const toolMovedEvent = new Event("tool-moved");

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  toolPreview = null;
  canvas.dispatchEvent(toolMovedEvent);
  const initPoint: Point = { x: e.offsetX, y: e.offsetY };
  currLine = createLine(initPoint, currLineWidth);
  allLines.push(currLine);
});

canvas.addEventListener("mouseenter", (e) => {
  const point: Point = { x: e.offsetX, y: e.offsetY };
  toolPreview = createToolPreview(point);
  canvas.dispatchEvent(toolMovedEvent);
});

canvas.addEventListener("mouseout", () => {
  toolPreview = null;
  canvas.dispatchEvent(toolMovedEvent);
});

canvas.addEventListener("mousemove", (e) => {
  const point: Point = { x: e.offsetX, y: e.offsetY };
  if (cursor.active) {
    currLine.drag(point);
    canvas.dispatchEvent(drawingChangeEvent);
  } else {
    toolPreview = createToolPreview(point);
    canvas.dispatchEvent(toolMovedEvent);
  }
});

canvas.addEventListener("mouseup", (e) => {
  cursor.active = false;
  const point: Point = { x: e.offsetX, y: e.offsetY };
  toolPreview = createToolPreview(point);
  canvas.dispatchEvent(toolMovedEvent);
  redoLines = []; // Clear previous redo lines whenever a new line is drawn
});

canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

function clearCanvas() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
}

function redraw() {
  clearCanvas();

  allLines.forEach((line) => line.display(ctx!));
  if (toolPreview) {
    toolPreview.display(ctx!);
  }
}

interface ButtonConfig {
  name: string;
  div: HTMLDivElement;
  clickFunction: VoidFunction;
}

function createButton(config: ButtonConfig) {
  const newButton = document.createElement("button");
  newButton.innerHTML = config.name;
  config.div.append(newButton);

  newButton.addEventListener("click", config.clickFunction);
  return newButton;
}

createButton({
  name: "Clear",
  div: canvasTools,
  clickFunction: () => {
    allLines = [];
    redoLines = [];
    clearCanvas();
  },
});

createButton({
  name: "Undo",
  div: canvasTools,
  clickFunction: () => {
    const undoLine = allLines.pop();
    if (undoLine) {
      redoLines.push(undoLine);
    }
    canvas.dispatchEvent(drawingChangeEvent);
  },
});

createButton({
  name: "Redo",
  div: canvasTools,
  clickFunction: () => {
    const redoLine = redoLines.pop();
    if (redoLine) {
      allLines.push(redoLine);
    }
    canvas.dispatchEvent(drawingChangeEvent);
  },
});

const thinToolButton = createButton({
  name: "Thin",
  div: markerTools,
  clickFunction: () => {
    currLineWidth = THIN_LINE_WIDTH;
    thinToolButton.classList.add("selectedTool");
    thickToolButton.classList.remove("selectedTool");
  },
});
thinToolButton.classList.add("selectedTool");

const thickToolButton = createButton({
  name: "Thick",
  div: markerTools,
  clickFunction: () => {
    currLineWidth = THICK_LINE_WIDTH;
    thickToolButton.classList.add("selectedTool");
    thinToolButton.classList.remove("selectedTool");
  },
});
