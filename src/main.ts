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

const canvasToolsDiv = createDiv("canvas-tools");
const canvas = document.createElement("canvas");
canvas.height = 256;
canvas.width = 256;
app.append(canvas);
const lineToolsDiv = createDiv("line-tools");
const stickerToolsDiv = createDiv("sticker-tools");
const stickerSliderDiv = createDiv("sticker-size-slider");

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
let currStickerSize = "30";

interface Point {
  x: number;
  y: number;
}
const ORIGIN: Point = { x: 0, y: 0 };

interface Line {
  drag(newPoint: Point): void;
  display(ctx: CanvasRenderingContext2D): void;
  displayPreview(ctx: CanvasRenderingContext2D, location: Point): void;
  color: string
}
function createLine(initPoint: Point, width: number): Line {
  const points: Array<Point> = [initPoint];
  const lineColor = currColor;
  return {
    color: lineColor,
    drag: (newPoint: Point) => {
      points.push(newPoint);
    },
    display: (ctx: CanvasRenderingContext2D) => {
      ctx.lineWidth = width;
      ctx.strokeStyle = lineColor; // Use the stored color for this line
      for (let i = 0; i < points.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
      }
    },
    displayPreview: (ctx: CanvasRenderingContext2D, location: Point) => {
      ctx.lineWidth = currLineWidth;
      ctx.strokeStyle = lineColor; // Use stored color for preview
      ctx.fillStyle = lineColor; // Use stored color for preview
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

function calculateStickerOrigin(location: Point, size: string): Point {
  const offset: Point = { x: +size / -1.5, y: +size / 3 };
  return { x: location.x + offset.x, y: location.y + offset.y };
}

interface Sticker {
  drag(newPoint: Point): void;
  display(ctx: CanvasRenderingContext2D): void;
  displayPreview(ctx: CanvasRenderingContext2D, location: Point): void;
}

function createSticker(location: Point, type: string, size: string): Sticker {
  return {
    drag: (newPoint: Point) => {
      location = newPoint;
    },
    display: (ctx: CanvasRenderingContext2D) => {
      ctx.font = "bold " + size + "px cursive";
      const origin = calculateStickerOrigin(location, size);
      ctx.fillText(type, origin.x, origin.y);
    },
    displayPreview: (ctx: CanvasRenderingContext2D, location: Point) => {
      ctx.font = "bold " + currStickerSize + "px cursive";
      const origin = calculateStickerOrigin(location, currStickerSize);
      ctx.fillText(type, origin.x, origin.y);
    },
  };
}

interface ToolPreview {
  display(ctx: CanvasRenderingContext2D): void;
}
function createToolPreview(location: Point): ToolPreview {
  canvas.style.cursor = "none";
  return {
    display: (ctx: CanvasRenderingContext2D) => {
      currTool!.displayPreview(ctx, location);
    },
  };
}

function clearCanvas(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function redraw(ctx: CanvasRenderingContext2D) {
  clearCanvas(ctx);
  drawList.forEach((item) => item.display(ctx));
  if (toolPreview) {
    toolPreview.display(ctx);
  }
}

const drawingChangedEvent = new Event("drawing-changed");
const toolChangedEvent = new Event("tool-changed");

canvas.addEventListener("drawing-changed", () => {
  redraw(ctx!);
});
canvas.addEventListener("tool-changed", () => {
  redraw(ctx!);
});

function setCursorActivation(setting: boolean) {
  cursorActive = setting;
  toolPreview = null;
  canvas.dispatchEvent(toolChangedEvent);
}

function showToolPreview(e: MouseEvent) {
  const mouseLocation: Point = { x: e.offsetX, y: e.offsetY };
  toolPreview = createToolPreview(mouseLocation);
  canvas.dispatchEvent(toolChangedEvent);
}

canvas.addEventListener("mousedown", (e) => {
  if (currTool) {
    setCursorActivation(true);
    const mouseLocation: Point = { x: e.offsetX, y: e.offsetY };
    if (currSticker == "") {
      currTool = createLine(mouseLocation, currLineWidth);
    } else {
      currTool = createSticker(mouseLocation, currSticker, currStickerSize);
    }
    drawList.push(currTool);
  }
});
canvas.addEventListener("mouseenter", (e) => {
  if (currTool) {
    showToolPreview(e);
  }
});
canvas.addEventListener("mouseout", () => {
  if (currTool) {
    setCursorActivation(false);
  }
});
canvas.addEventListener("mousemove", (e) => {
  if (currTool) {
    if (cursorActive) {
      const mouseLocation: Point = { x: e.offsetX, y: e.offsetY };
      currTool.drag(mouseLocation);
      canvas.dispatchEvent(drawingChangedEvent);
    } else {
      showToolPreview(e);
    }
  }
});

canvas.addEventListener("mouseup", (e) => {
  if (currTool) {
    cursorActive = false;
    showToolPreview(e);
    redoList = []; 
  }
});

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
  name: "🗑️", 
  div: canvasToolsDiv,
  clickFunction: () => {
    drawList = [];
    redoList = [];
    clearCanvas(ctx!);
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

createButton({
  name: "💾", 
  div: canvasToolsDiv,
  clickFunction: () => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.height = 1024;
    exportCanvas.width = 1024;
    const ectx = exportCanvas.getContext("2d");
    ectx!.scale(4, 4);
    redraw(ectx!);
    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
  },
});

function selectTool(toolButton: HTMLButtonElement) {
  lineToolButtons.forEach((button) => button.classList.remove("selectedTool"));
  stickerButtons.forEach((button) => button.classList.remove("selectedTool"));
  toolButton.classList.add("selectedTool");
}

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
      currTool = createLine(ORIGIN, currLineWidth);
      selectTool(lineToolButton);
    },
  });
  lineToolButtons.push(lineToolButton);
});

const stickers: Array<string> = ["🐟", "🌿", "🪨"];
const stickerButtons: Array<HTMLButtonElement> = [];
function createStickerButton(sticker: string) {
  const stickerButton = createButton({
    name: sticker,
    div: stickerToolsDiv,
    clickFunction: () => {
      currSticker = sticker;
      currTool = createSticker(ORIGIN, currSticker, currStickerSize);
      selectTool(stickerButton);
    },
  });
  stickerButtons.push(stickerButton);
}
stickers.forEach((sticker) => {
  createStickerButton(sticker);
});

const stickerSliderLabel = document.createElement("h3");
stickerSliderLabel.innerHTML = "Sticker Size";
stickerSliderLabel.style.display = "inline-block";
stickerSliderLabel.style.marginRight = "10px";
stickerSliderDiv.append(stickerSliderLabel);

const stickerSlider = document.createElement("input");
stickerSlider.type = "range";
stickerSlider.min = "5";
stickerSlider.max = "100";
stickerSlider.value = "30";
stickerSlider.style.display = "inline-block";
stickerSliderDiv.append(stickerSlider);

const stickerSliderOutput = document.createElement("h3");
stickerSliderOutput.innerHTML = stickerSlider.value;
stickerSliderOutput.style.display = "inline-block";
stickerSliderOutput.style.marginLeft = "10px";
stickerSliderDiv.append(stickerSliderOutput);

stickerSlider.addEventListener("change", () => {
  stickerSliderOutput.innerHTML = stickerSlider.value;
  currStickerSize = stickerSlider.value;
});

const customStickerButton = createButton({
  name: "+",
  div: stickerToolsDiv,
  clickFunction: () => {
    const customText = prompt("Enter custom sticker text:", "");
    if (customText) {
      createStickerButton(customText);
      customStickerButton.remove();
      stickerToolsDiv.append(customStickerButton);
    }
  },
});


const colorSliderDiv = createDiv("color-slider");

const colorSliderLabel = document.createElement("h3");
colorSliderLabel.innerHTML = "Line Color";
colorSliderLabel.style.display = "inline-block";
colorSliderLabel.style.marginRight = "10px";
colorSliderDiv.append(colorSliderLabel);

const colorSlider = document.createElement("input");
colorSlider.type = "range";
colorSlider.min = "0";
colorSlider.max = "360"; // Represents degrees in the HSL color space
colorSlider.value = "0";
colorSlider.style.display = "inline-block";
colorSliderDiv.append(colorSlider);

const colorPreview = document.createElement("div");
colorPreview.style.display = "inline-block";
colorPreview.style.width = "30px";
colorPreview.style.height = "30px";
colorPreview.style.marginLeft = "10px";
colorPreview.style.border = "1px solid #000";
colorSliderDiv.append(colorPreview);

let currColor = `hsl(${colorSlider.value}, 100%, 50%)`;
colorPreview.style.backgroundColor = currColor;

colorSlider.addEventListener("input", () => {
  currColor = `hsl(${colorSlider.value}, 100%, 50%)`;
  colorPreview.style.backgroundColor = currColor;
  ctx!.strokeStyle = currColor;
  ctx!.fillStyle = currColor;
});
