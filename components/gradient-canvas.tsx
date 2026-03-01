'use client'

import { ColorPoint, GradientConfig } from '@/lib/types'
import { WebGLGradientRenderer } from '@/lib/webgl-renderer'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

interface GradientCanvasProps {
  config: GradientConfig
  aspectRatio: [number, number]
  selectedPointId: string | null
  onSelectPoint: (id: string | null) => void
  onMovePoint: (id: string, x: number, y: number) => void
  onAddPoint: (x: number, y: number) => void
}

export interface GradientCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null
}

const HANDLE_SIZE = 18
const HIT_RADIUS = 20

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
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const rendererRef = useRef<WebGLGradientRenderer | null>(null)
    const draggingRef = useRef<string | null>(null)
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }))

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const observer = new ResizeObserver(() => {
        const { clientWidth, clientHeight } = container
        const [aw, ah] = aspectRatio
        const containerAspect = clientWidth / clientHeight
        const gradientAspect = aw / ah

        let w: number, h: number
        if (containerAspect > gradientAspect) {
          h = clientHeight
          w = h * gradientAspect
        } else {
          w = clientWidth
          h = w / gradientAspect
        }

        setCanvasSize({ width: Math.round(w), height: Math.round(h) })
      })

      observer.observe(container)
      return () => observer.disconnect()
    }, [aspectRatio])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      canvas.width = canvasSize.width
      canvas.height = canvasSize.height

      rendererRef.current?.destroy()
      try {
        rendererRef.current = new WebGLGradientRenderer(canvas)
      } catch (err) {
        console.error('WebGL init failed:', err)
        rendererRef.current = null
      }

      return () => {
        rendererRef.current?.destroy()
        rendererRef.current = null
      }
    }, [canvasSize])

    useEffect(() => {
      rendererRef.current?.render(config)
    }, [config, canvasSize])

    function getCanvasCoords(e: React.MouseEvent | React.TouchEvent) {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const clientX =
        'touches' in e
          ? e.touches[0].clientX
          : (e as React.MouseEvent).clientX
      const clientY =
        'touches' in e
          ? e.touches[0].clientY
          : (e as React.MouseEvent).clientY
      return {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
      }
    }

    function hitTest(nx: number, ny: number): string | null {
      const canvas = canvasRef.current
      if (!canvas) return null
      const hitNorm = HIT_RADIUS / canvas.width

      for (let i = config.points.length - 1; i >= 0; i--) {
        const p = config.points[i]
        const dx = nx - p.x
        const dy = (ny - p.y) * (canvas.width / canvas.height)
        if (Math.sqrt(dx * dx + dy * dy) < hitNorm) return p.id
      }
      return null
    }

    const handlePointerDown = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCanvasCoords(e)
        const hit = hitTest(x, y)
        if (hit) {
          draggingRef.current = hit
          onSelectPoint(hit)
        } else {
          onSelectPoint(null)
        }
      },
      [config.points, onSelectPoint]
    )

    const handlePointerMove = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (!draggingRef.current) return
        const { x, y } = getCanvasCoords(e)
        onMovePoint(
          draggingRef.current,
          Math.max(0, Math.min(1, x)),
          Math.max(0, Math.min(1, y))
        )
      },
      [onMovePoint]
    )

    const handlePointerUp = useCallback(() => {
      draggingRef.current = null
    }, [])

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        const { x, y } = getCanvasCoords(e)
        const hit = hitTest(x, y)
        if (!hit) onAddPoint(x, y)
      },
      [config.points, onAddPoint]
    )

    return (
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
      >
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ width: canvasSize.width, height: canvasSize.height }}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="absolute inset-0 cursor-crosshair touch-none"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onDoubleClick={handleDoubleClick}
          />

          {config.points.map((point) => (
            <PointHandle
              key={point.id}
              point={point}
              isSelected={selectedPointId === point.id}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
            />
          ))}
        </div>
      </div>
    )
  }
)

export { GradientCanvas }

interface PointHandleProps {
  point: ColorPoint
  isSelected: boolean
  canvasWidth: number
  canvasHeight: number
}

function PointHandle({
  point,
  isSelected,
  canvasWidth,
  canvasHeight,
}: PointHandleProps) {
  const left = point.x * canvasWidth - HANDLE_SIZE / 2
  const top = point.y * canvasHeight - HANDLE_SIZE / 2

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: point.color,
          border: isSelected
            ? '2.5px solid #ffffff'
            : '1.5px solid rgba(255,255,255,0.75)',
          boxShadow: isSelected
            ? '0 0 0 3px rgba(255,255,255,0.7), 0 2px 8px rgba(0,0,0,0.35)'
            : '0 2px 6px rgba(0,0,0,0.25)',
          transition: 'box-shadow 0.1s ease',
        }}
      />
    </div>
  )
}
