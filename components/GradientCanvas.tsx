"use client";

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { ColorPoint, GradientConfig } from "@/lib/types";
import { renderGradient } from "@/lib/gradient-renderer";

interface GradientCanvasProps {
  config: GradientConfig;
  aspectRatio: [number, number];
  selectedPointId: string | null;
  onSelectPoint: (id: string | null) => void;
  onMovePoint: (id: string, x: number, y: number) => void;
  onAddPoint: (x: number, y: number) => void;
}

export interface GradientCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

const HANDLE_RADIUS = 9;
const HIT_RADIUS = 20;

const GradientCanvas = forwardRef<GradientCanvasHandle, GradientCanvasProps>(
  function GradientCanvas(
    {
      config,
      aspectRatio,
      selectedPointId,
      onSelectPoint,
      onMovePoint,
      onAddPoint,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<string | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));

    // Resize canvas to fill container while maintaining aspect ratio
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const observer = new ResizeObserver(() => {
        const { clientWidth, clientHeight } = container;
        const [aw, ah] = aspectRatio;
        const containerAspect = clientWidth / clientHeight;
        const gradientAspect = aw / ah;

        let w: number, h: number;
        if (containerAspect > gradientAspect) {
          h = clientHeight;
          w = h * gradientAspect;
        } else {
          w = clientWidth;
          h = w / gradientAspect;
        }

        setCanvasSize({ width: Math.round(w), height: Math.round(h) });
      });

      observer.observe(container);
      return () => observer.disconnect();
    }, [aspectRatio]);

    // Re-render gradient whenever config or canvas size changes
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      renderGradient(canvas, config);
      drawHandles(canvas, config.points, selectedPointId);
    }, [config, canvasSize, selectedPointId]);

    function drawHandles(
      canvas: HTMLCanvasElement,
      points: ColorPoint[],
      selectedId: string | null
    ) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      for (const point of points) {
        const cx = point.x * canvas.width;
        const cy = point.y * canvas.height;
        const isSelected = point.id === selectedId;

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(cx, cy, HANDLE_RADIUS + 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fill();

        // Colour fill
        ctx.beginPath();
        ctx.arc(cx, cy, HANDLE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = point.color;
        ctx.fill();

        // Border
        ctx.beginPath();
        ctx.arc(cx, cy, HANDLE_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? "#ffffff" : "rgba(255,255,255,0.7)";
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();

        // Selection ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(cx, cy, HANDLE_RADIUS + 5, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255,0.8)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    function getCanvasCoords(e: React.MouseEvent | React.TouchEvent) {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      return {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
      };
    }

    function hitTest(nx: number, ny: number): string | null {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const hitNorm = HIT_RADIUS / canvas.width;

      // Test in reverse so top-most drawn point wins
      for (let i = config.points.length - 1; i >= 0; i--) {
        const p = config.points[i];
        const dx = nx - p.x;
        const dy = (ny - p.y) * (canvas.width / canvas.height);
        if (Math.sqrt(dx * dx + dy * dy) < hitNorm) return p.id;
      }
      return null;
    }

    const handlePointerDown = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCanvasCoords(e);
        const hit = hitTest(x, y);
        if (hit) {
          draggingRef.current = hit;
          onSelectPoint(hit);
        } else {
          onSelectPoint(null);
        }
      },
      [config.points, onSelectPoint]
    );

    const handlePointerMove = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (!draggingRef.current) return;
        const { x, y } = getCanvasCoords(e);
        onMovePoint(
          draggingRef.current,
          Math.max(0, Math.min(1, x)),
          Math.max(0, Math.min(1, y))
        );
      },
      [onMovePoint]
    );

    const handlePointerUp = useCallback(() => {
      draggingRef.current = null;
    }, []);

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        const { x, y } = getCanvasCoords(e);
        const hit = hitTest(x, y);
        if (!hit) {
          onAddPoint(x, y);
        }
      },
      [config.points, onAddPoint]
    );

    return (
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="rounded-2xl shadow-2xl cursor-crosshair touch-none"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onDoubleClick={handleDoubleClick}
        />
      </div>
    );
  }
);

export default GradientCanvas;
