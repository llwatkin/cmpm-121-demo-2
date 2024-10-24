import "./style.css";
const app = document.querySelector<HTMLDivElement>("#app")!;
const APP_NAME = "AquaSketch";
document.title = APP_NAME;

const titleDisplay = document.createElement("h1");
titleDisplay.innerHTML = APP_NAME;
app.append(titleDisplay);

function createDiv(name: string) {
  const newDiv = document.createElement("div");
  newDiv.id = name;
  app.append(newDiv);
  return newDiv;
}
// Create tool divs and canvas
const canvasToolsDiv = createDiv("canvas-tools");
const canvas = document.createElement("canvas");
canvas.height = 256;
canvas.width = 256;
app.append(canvas);
const lineToolsDiv = createDiv("line-tools");
const stickerToolsDiv = createDiv("sticker-tools");

const ctx = canvas.getContext("2d");
let cursorActive = false;

const LINE_PREVIEW_RADIUS = 2;
const THICK_LINE_WIDTH = 6;
const THIN_LINE_WIDTH = 2;

let currTool: Line | Sticker | null = null;
let toolPreview: ToolPreview | null = null;
let drawList: Array<Line | Sticker> = [];
let redoList: Array<Line | Sticker> = [];

let currLineWidth = 0;
let currSticker = "";

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
      ctx.arc(
        location.x,
        location.y,
        LINE_PREVIEW_RADIUS,
        0,
        2 * Math.PI,
        false
      );
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
      ctx.font = "bold 20px cursive";
      ctx.fillText(type, location.x, location.y);
    },
  };
}

interface ToolPreview {
  display(ctx: CanvasRenderingContext2D): void;
}
function createToolPreview(location: Point): ToolPreview {
  // Disable cursor if still enabled
  if (canvas.style.cursor != "none") {
    canvas.style.cursor = "none";
  }
  return {
    display: (ctx: CanvasRenderingContext2D) => {
      currTool!.displayPreview(ctx, location);
    },
  };
}

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

const drawingChangedEvent = new Event("drawing-changed");
const toolChangedEvent = new Event("tool-changed");

canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-changed", redraw);

canvas.addEventListener("mousedown", (e) => {
  if (currTool) {
    cursorActive = true;
    toolPreview = null;
    canvas.dispatchEvent(toolChangedEvent);
    const mouseLocation: Point = { x: e.offsetX, y: e.offsetY };
    if (currSticker == "") {
      currTool = createLine(mouseLocation, currLineWidth);
    } else {
      currTool = createSticker(mouseLocation, currSticker);
    }
    drawList.push(currTool);
  }
});

canvas.addEventListener("mouseenter", (e) => {
  if (currTool) {
    const mouseLocation: Point = { x: e.offsetX, y: e.offsetY };
    toolPreview = createToolPreview(mouseLocation);
    canvas.dispatchEvent(toolChangedEvent);
  }
});

canvas.addEventListener("mouseout", () => {
  if (currTool) {
    toolPreview = null;
    canvas.dispatchEvent(toolChangedEvent);
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (currTool) {
    const mouseLocation: Point = { x: e.offsetX, y: e.offsetY };
    if (cursorActive) {
      currTool.drag(mouseLocation);
      canvas.dispatchEvent(drawingChangedEvent);
    } else {
      toolPreview = createToolPreview(mouseLocation);
      canvas.dispatchEvent(toolChangedEvent);
    }
  }
});

canvas.addEventListener("mouseup", (e) => {
  if (currTool) {
    cursorActive = false;
    const mouseLocation: Point = { x: e.offsetX, y: e.offsetY };
    toolPreview = createToolPreview(mouseLocation);
    canvas.dispatchEvent(toolChangedEvent);
    redoList = []; // Clear redo list whenever a new thing is drawn
  }
});

// Config object for general button creation function
interface ButtonConfig {
  name: string;
  div: HTMLDivElement;
  clickFunction(): void;
}
// General function to create a button with a name and click function in a certain div
function createButton(config: ButtonConfig) {
  const newButton = document.createElement("button");
  newButton.innerHTML = config.name;
  config.div.append(newButton);

  newButton.addEventListener("click", config.clickFunction);
  return newButton;
}

// Create canvas tool buttons
createButton({
  name: "🗑️",
  div: canvasToolsDiv,
  clickFunction: () => {
    drawList = [];
    redoList = [];
    clearCanvas();
  },
});
createButton({
  name: "↩️",
  div: canvasToolsDiv,
  clickFunction: () => {
    const undoLine = drawList.pop();
    if (undoLine) {
      redoList.push(undoLine);
    }
    canvas.dispatchEvent(drawingChangedEvent);
  },
});
createButton({
  name: "↪️",
  div: canvasToolsDiv,
  clickFunction: () => {
    const redoLine = redoList.pop();
    if (redoLine) {
      drawList.push(redoLine);
    }
    canvas.dispatchEvent(drawingChangedEvent);
  },
});

// Removes selectedTool class from all buttons & adds it to the button passed to the function
function selectTool(toolButton: HTMLButtonElement) {
  lineToolButtons.forEach((button) => button.classList.remove("selectedTool"));
  stickerButtons.forEach((button) => button.classList.remove("selectedTool"));
  toolButton.classList.add("selectedTool");
}

// Create line tool buttons
const lineTools = [
  { name: "○", size: THIN_LINE_WIDTH },
  { name: "◯", size: THICK_LINE_WIDTH },
];
const lineToolButtons: Array<HTMLButtonElement> = [];
lineTools.forEach((tool) => {
  const lineToolButton = createButton({
    name: tool.name,
    div: lineToolsDiv,
    clickFunction: () => {
      currLineWidth = tool.size;
      currSticker = "";
      currTool = createLine({ x: 0, y: 0 }, currLineWidth);
      selectTool(lineToolButton);
    },
  });
  lineToolButtons.push(lineToolButton);
});

// Create sticker buttons
const stickers: Array<string> = ["🐟", "🌿", "🪨"];
const stickerButtons: Array<HTMLButtonElement> = [];
function createStickerButton(sticker: string) {
  const stickerButton = createButton({
    name: sticker,
    div: stickerToolsDiv,
    clickFunction: () => {
      currSticker = sticker;
      currTool = createSticker({ x: 0, y: 0 }, currSticker);
      selectTool(stickerButton);
    },
  });
  stickerButtons.push(stickerButton);
}
stickers.forEach((sticker) => {
  createStickerButton(sticker);
});

const customStickerButton = createButton({
  name: "+",
  div: stickerToolsDiv,
  clickFunction: () => {
    const customText = prompt("Enter custom sticker text:", "");
    if (customText) {
      createStickerButton(customText);
      // Remove and re-add custom sticker button so it always appears at the end
      customStickerButton.remove();
      stickerToolsDiv.append(customStickerButton);
    }
  },
});
