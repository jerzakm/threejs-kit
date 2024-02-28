import { Point } from ".";

export function styleCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) {
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  canvas.style.position = "fixed";
  canvas.style.top = `50%`;
  canvas.style.left = `25%`;
  canvas.style.transform = `translate(-50%, -50%)`;
  canvas.style.zIndex = `100`;
  canvas.style.pointerEvents = `none`;
}

export function drawConvexHull(
  convexHull: Array<{ x: number; y: number }>,
  canvas: HTMLCanvasElement,
  color = "green"
) {
  const ctx = canvas.getContext("2d")!;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // renders the polygon
  convexHull.forEach((p, i) => {
    const next = convexHull[i + 1] || convexHull[0];

    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    ctx.closePath();
  });
}

export function drawPoints(
  points: Point[],
  canvas: HTMLCanvasElement,
  offset = [0, 0]
) {
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "green";

  points.forEach(({ x, y }) => {
    ctx.fillRect(x + offset[0], y + offset[1], 1, 1);
  });
}

export function drawPoint(
  point: { x: number; y: number },
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "green";

  ctx.fillRect(point.x - 2.5, point.y - 2.5, 5, 5);
}

export function drawOriginalRect(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;

  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
  ctx.setLineDash([0, 0]);

  ctx.closePath();
}

export function drawGrid(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) {
  const ctx = canvas.getContext("2d")!;

  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1;

  // stroke a rect around the whole canvas
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  const w = canvas.width / width;
  const h = canvas.height / height;

  // make a cross at the center of each sector
  ctx.setLineDash([0, 0]);

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      // circle at center
      ctx.beginPath();
      const r = 4;
      ctx.arc(i * w + w / 2, j * h + h / 2, r, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = "red";
      ctx.fill();
    }
  }

  ctx.setLineDash([4, 4]);
  for (let i = 0; i < height; i++) {
    ctx.moveTo(i * h - 0.5, 0);
    ctx.lineTo(i * h - 0.5, canvas.height);
  }

  for (let i = 0; i < width; i++) {
    ctx.moveTo(0, i * w - 0.5);
    ctx.lineTo(canvas.width, i * w - 0.5);
  }

  ctx.stroke();
  ctx.setLineDash([0, 0]);
}
