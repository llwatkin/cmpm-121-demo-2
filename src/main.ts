import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const APP_NAME = "AquaSketch";
document.title = APP_NAME;

const titleDisplay = document.createElement("h1");
titleDisplay.innerHTML = APP_NAME;
app.append(titleDisplay);

const canvasTools = document.createElement("div");
app.append(canvasTools);

const canvas = document.createElement("canvas");
canvas.height = 256;
canvas.width = 256;
canvas.style.cursor = "none";
app.append(canvas);

const markerTools = document.createElement("div");
app.append(markerTools);

const stickerTools = document.createElement("div");
app.append(stickerTools);

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
  displayPreview(ctx: CanvasRenderingContext2D, location: Point): void;
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
    displayPreview: (ctx: CanvasRenderingContext2D, location: Point) => {
      ctx.lineWidth = currLineWidth;
      ctx.beginPath();
      ctx.arc(location.x, location.y, PREVIEW_RADIUS, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.stroke();
    },
  };
}

interface Sticker {
  location: Point;
  type: string;

  drag(newPoint: Point): void;
  display(ctx: CanvasRenderingContext2D): void;
  displayPreview(ctx: CanvasRenderingContext2D, location: Point): void;
}

let currSticker: string = "";

function createSticker(location: Point, type: string): Sticker {
  return {
    location: location,
    type: type,
    drag: (newPoint: Point) => {
      location = newPoint;
    },
    display: (ctx: CanvasRenderingContext2D) => {
      ctx.fillText(type, location.x, location.y);
    },
    displayPreview: (ctx: CanvasRenderingContext2D, location: Point) => {
      ctx.font = "20px serif";
      ctx.fillText(type, location.x, location.y);
    },
  };
}

interface ToolPreview {
  display(ctx: CanvasRenderingContext2D): void;
}

function createToolPreview(location: Point): ToolPreview {
  return {
    display: (ctx: CanvasRenderingContext2D) => {
      currTool.displayPreview(ctx, location);
    },
  };
}

let currTool: Line | Sticker = createLine({ x: 0, y: 0 }, THIN_LINE_WIDTH);
let drawList: Array<Line | Sticker> = [];
let redoList: Array<Line | Sticker> = [];

const drawingChangedEvent = new Event("drawing-changed");
const toolChangedEvent = new Event("tool-changed");

canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-changed", redraw);

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  toolPreview = null;
  canvas.dispatchEvent(toolChangedEvent);

  const mouseLocation: Point = { x: e.offsetX, y: e.offsetY };
  if (currSticker == "") {
    currTool = createLine(mouseLocation, currLineWidth);
  } else {
    currTool = createSticker(mouseLocation, currSticker);
  }
  drawList.push(currTool);
});

canvas.addEventListener("mouseenter", (e) => {
  const point: Point = { x: e.offsetX, y: e.offsetY };
  toolPreview = createToolPreview(point);
  canvas.dispatchEvent(toolChangedEvent);
});

canvas.addEventListener("mouseout", () => {
  toolPreview = null;
  canvas.dispatchEvent(toolChangedEvent);
});

canvas.addEventListener("mousemove", (e) => {
  const point: Point = { x: e.offsetX, y: e.offsetY };
  if (cursor.active) {
    currTool.drag(point);
    canvas.dispatchEvent(drawingChangedEvent);
  } else {
    toolPreview = createToolPreview(point);
    canvas.dispatchEvent(toolChangedEvent);
  }
});

canvas.addEventListener("mouseup", (e) => {
  cursor.active = false;
  const point: Point = { x: e.offsetX, y: e.offsetY };
  toolPreview = createToolPreview(point);
  canvas.dispatchEvent(toolChangedEvent);
  redoList = []; // Clear previous redo lines whenever a new line is drawn
});

function clearCanvas() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
}

function redraw() {
  clearCanvas();

  drawList.forEach((item) => item.display(ctx!));
  if (toolPreview) {
    toolPreview.display(ctx!);
  }
}

interface ButtonConfig {
  name: string;
  div: HTMLDivElement;
  clickFunction(): void;
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
    drawList = [];
    redoList = [];
    clearCanvas();
  },
});

createButton({
  name: "Undo",
  div: canvasTools,
  clickFunction: () => {
    const undoLine = drawList.pop();
    if (undoLine) {
      redoList.push(undoLine);
    }
    canvas.dispatchEvent(drawingChangedEvent);
  },
});

createButton({
  name: "Redo",
  div: canvasTools,
  clickFunction: () => {
    const redoLine = redoList.pop();
    if (redoLine) {
      drawList.push(redoLine);
    }
    canvas.dispatchEvent(drawingChangedEvent);
  },
});

const thinToolButton = createButton({
  name: "Thin",
  div: markerTools,
  clickFunction: () => {
    currLineWidth = THIN_LINE_WIDTH;
    currSticker = "";
    currTool = createLine({ x: 0, y: 0 }, currLineWidth);

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
    currSticker = "";
    currTool = createLine({ x: 0, y: 0 }, currLineWidth);

    thickToolButton.classList.add("selectedTool");
    thinToolButton.classList.remove("selectedTool");
  },
});

createButton({
  name: "🐟",
  div: stickerTools,
  clickFunction: () => {
    currSticker = "🐟";
    currTool = createSticker({ x: 0, y: 0 }, currSticker);
  },
});

createButton({
  name: "🌿",
  div: stickerTools,
  clickFunction: () => {
    currSticker = "🌿";
    currTool = createSticker({ x: 0, y: 0 }, currSticker);
  },
});

createButton({
  name: "🪨",
  div: stickerTools,
  clickFunction: () => {
    currSticker = "🪨";
    currTool = createSticker({ x: 0, y: 0 }, currSticker);
  },
});
