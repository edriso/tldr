---
title: Canvas Basics
tldr: A canvas is a pixel surface you draw on from JavaScript. No elements, no CSS, you repaint everything yourself.
category: frontend
tech: web
order: 41
level: 3
tags: [canvas, graphics, rendering]
related: [js-event-loop, web-components, js-debounce-throttle]
quiz:
  - q: "You drew a circle on a canvas and now want to move it 10 pixels right. Can you update its position like a DOM element?"
    a: "No. The circle is just pixels, the canvas has no memory of it. You clear the canvas (or that area) and redraw the circle at the new position."
  - q: "Your canvas text looks blurry on a phone but sharp on an old monitor. What is the likely cause?"
    a: "devicePixelRatio. The canvas buffer is sized in CSS pixels, but the phone screen has 2 or 3 device pixels per CSS pixel. Scale the buffer by devicePixelRatio and scale the context to match."
  - q: "You are building a product customizer where users drag and resize text on a t-shirt image. Raw canvas or a library?"
    a: "A library like Fabric.js. It keeps an object model (hit testing, selection, drag handles) on top of the canvas, so you do not rebuild all of that yourself."
links:
  - title: Canvas API on MDN
    url: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
    note: Overview of the API and its main interfaces.
  - title: Canvas tutorial on MDN
    url: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial
    note: Step-by-step guide from shapes to animation.
---

## Analogy

The DOM is a whiteboard covered in sticky notes: each note is an element you
can move, restyle, or remove, and the browser keeps track of them all. A
canvas is a painting. Once the paint is on, there are no "things" anymore,
only pixels. To move the sun in a painting, you paint over it and paint a new
sun somewhere else.

## Pixels, not elements

`<canvas>` is one HTML element that gives you a bitmap. You draw on it from
JavaScript through a context object, usually the 2D one:

```js
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
```

Nothing you draw becomes an element. There is no CSS for a drawn shape, no
click handler on a drawn button, no accessibility tree.

The 2D context gives you rectangles (`fillRect`), paths (`beginPath`, `arc`,
`lineTo`), text (`fillText`), and images (`drawImage`).

## The render loop

Pixels have no memory, so animation means: clear, redraw everything, repeat.
`requestAnimationFrame` runs that loop once per screen refresh.

## Worked example

Draw a sharp, animated price badge for a product image.

**Step 1: size the canvas for the real screen.** CSS size and buffer size are
two different things; multiply the buffer by `devicePixelRatio` or every line
looks blurry on modern screens.

```js
const dpr = window.devicePixelRatio || 1
canvas.width = 300 * dpr
canvas.height = 150 * dpr
canvas.style.width = '300px'
ctx.scale(dpr, dpr)
```

**Step 2: draw the static parts.** Coordinates start at the top left, x goes
right, y goes down.

```js
ctx.drawImage(productImg, 0, 0, 300, 150)
ctx.fillStyle = 'crimson'
ctx.fillRect(10, 10, 90, 32)
```

**Step 3: draw text on top.** Text is painted too, so set font and color
before each draw.

```js
ctx.font = 'bold 16px sans-serif'
ctx.fillStyle = 'white'
ctx.fillText('-20%', 22, 32)
```

**Step 4: animate with clear plus redraw.** Move the badge by repainting the
whole frame each tick, never by "editing" the old pixels.

```js
function frame(t) {
  ctx.clearRect(0, 0, 300, 150)
  drawScene(10 + Math.sin(t / 300) * 4)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
```

## Try it

Write the `frame` loop yourself for any shape: clear, draw at a position based
on the timestamp, request the next frame. (You should see smooth motion, and
setting the position instead of adding to it keeps speed stable.)

## Real use case

An online store sells custom mugs. The customizer shows the mug photo on a
canvas and lets buyers add their own text and logo, drag them into place, and
preview the result live. The team uses Fabric.js: it stores each text and
image as an object with drag handles and hit testing, then paints them to the
canvas. Raw canvas would mean hand-writing selection, resizing, and z-order.

## Gotchas

- Setting `canvas.width` clears the canvas and resets all context state.
- Sizing the canvas only with CSS stretches the bitmap; blurry output. Set the width and height attributes too.
- Nothing on a canvas is accessible by default. Provide fallback content or offscreen DOM for screen readers.
- Redrawing a huge canvas at 60 frames per second burns CPU. Redraw only when something changed.

## Remember

> A canvas is paint, not sticky notes: no elements, no CSS, you clear and
> repaint, and you scale for devicePixelRatio or it looks blurry.
