import { useEffect, useRef } from 'react';

export function PhysicsMotion() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, frame = 0, last = 0;
    const pointer = { x: .5, y: .5 };
    const colors = getComputedStyle(element);
    const wire = colors.getPropertyValue('--motion-wire').trim();
    const signal = colors.getPropertyValue('--motion-signal').trim();
    const warm = colors.getPropertyValue('--motion-warm').trim();
    function resize() {
      const rect = element?.getBoundingClientRect();
      if (!rect || !element) return;
      width = rect.width; height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      element.width = width * ratio; element.height = height * ratio;
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    function draw(now: number) {
      if (!context) return;
      frame = requestAnimationFrame(draw);
      if (document.hidden || now - last < 32) return;
      last = now;
      const t = reduced.matches ? 0 : now / 1000;
      context.clearRect(0, 0, width, height);
      context.lineWidth = 1;
      // Traveling electromagnetic waves along the page edges.
      for (let side = 0; side < 2; side++) {
        context.strokeStyle = side ? warm : wire;
        context.beginPath();
        for (let y = 0; y < height; y += 5) {
          const x = (side ? width - 35 : 35) + Math.sin(y / 52 - t * 1.5) * 22;
          if (y === 0) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.stroke();
      }
      // A large, slowly revolving atomic model, with actual orbital electrons.
      const cx = width * .77 + (pointer.x - .5) * 14;
      const cy = height * .32 + (pointer.y - .5) * 14;
      const radius = Math.min(width * .23, 230);
      for (let orbit = 0; orbit < 3; orbit++) {
        const tilt = orbit * Math.PI / 3 + t * .06;
        context.save(); context.translate(cx, cy); context.rotate(tilt);
        context.strokeStyle = wire;
        context.beginPath(); context.ellipse(0, 0, radius, radius * .32, 0, 0, Math.PI * 2); context.stroke();
        const angle = t * .9 + orbit * 2;
        context.fillStyle = orbit === 1 ? warm : signal;
        context.beginPath(); context.arc(Math.cos(angle) * radius, Math.sin(angle) * radius * .32, 3.5, 0, Math.PI * 2); context.fill();
        context.restore();
      }
      // Moving signal through a printed circuit, not decorative particles.
      context.strokeStyle = wire;
      const x = width * .12, y = height * .72;
      context.beginPath(); context.moveTo(x, y - 95); context.lineTo(x, y); context.lineTo(x + 110, y); context.lineTo(x + 150, y + 40); context.lineTo(x + 280, y + 40); context.stroke();
      const distance = (t * 55) % 230;
      context.fillStyle = signal;
      context.beginPath(); context.arc(x + distance, y + Math.max(0, Math.min(40, distance - 110)), 3, 0, Math.PI * 2); context.fill();
    }
    function move(event: PointerEvent) { pointer.x = event.clientX / window.innerWidth; pointer.y = event.clientY / window.innerHeight; }
    const observer = new ResizeObserver(resize);
    observer.observe(element); resize(); frame = requestAnimationFrame(draw);
    window.addEventListener('pointermove', move, { passive: true });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('pointermove', move); };
  }, []);
  return <canvas ref={canvas} className="physics-motion" aria-hidden="true"/>;
}