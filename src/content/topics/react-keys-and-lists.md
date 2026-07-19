---
title: Keys & Lists
tldr: Keys tell React which item is which across renders; index keys lie the moment the list reorders.
category: frontend
tech: react
order: 22
tags: [keys, lists, state]
links:
  - title: Rendering Lists
    url: https://react.dev/learn/rendering-lists
    note: The official guide to mapping data to JSX and choosing good keys.
  - title: Preserving and Resetting State
    url: https://react.dev/learn/preserving-and-resetting-state
    note: Explains why state follows identity, which is the whole reason keys exist.
---

## Analogy

Keys are like name tags at a conference. Between sessions, people swap seats.
With name tags, you still know Sara is Sara wherever she sits. Without tags,
you track people by seat number: "seat 3" is now a different person, but you
keep handing them seat 3's notes. Index keys are seat numbers. Stable IDs
(identifiers) are name tags.

## Why keys exist

- Between renders, React must match each new list item to an old one to know what to keep, move, or destroy.
- The key is that identity. Same key means same component instance, so its state and DOM survive.
- Keys only need to be unique among siblings, and they must not change between renders.
- A changed key means a new identity: React unmounts the old instance and mounts a fresh one.

## Why index keys break

- With index keys, identity is the position, not the item.
- Delete the first item and every item shifts up. React sees "same keys, new props" and reuses the wrong instances.
- Any state living inside the rows sticks to the position: input text, checkboxes, focus, animations all attach to the wrong item.
- Index keys are only safe when the list never reorders, inserts, or deletes, and rows hold no state.
- Never generate keys at render time (`Math.random()`, `crypto.randomUUID()` inline). That remounts every row on every render.

## Example

```tsx
type CartItem = { id: string; name: string };

export function Cart({ items, onRemove }: {
  items: CartItem[];
  onRemove: (id: string) => void;
}) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}> {/* stable id, not the array index */}
          {item.name}
          <input placeholder="Gift note" />
          <button onClick={() => onRemove(item.id)}>Remove</button>
        </li>
      ))}
    </ul>
  );
}
```

## Real use case

A cart lists three items, each with a "gift note" text field. A shopper types
a note on item two, then removes item one. With index keys, item two slides
into index 0 and inherits item one's component instance, so the note appears
under the wrong product. With `key={item.id}`, the instance follows the
product and the note stays put. The same rule saves quiz lists in a learning
app: shuffle the questions, and answers typed so far must follow their
question, not their old position.

## Gotchas

- Using the array index because "it makes the warning go away". The warning is about correctness, not noise.
- Generating a new random key each render, which silently remounts every item and kills input state.
- Reusing an id that is not unique among siblings, causing React to mix up or drop items.
- Forgetting that keys are also a tool: change a key on purpose to reset a form or component.

## Remember

> Key the item, not the seat.
