---
title: "JavaScript Concurrency Fundamentals"
tags: ["javascript", "frontend", "interview", "concurrency"]
---

# JavaScript Concurrency Fundamentals

> **Role:** Senior Frontend Engineer & Technical Interviewer.
>
> **Goal:** deep-dive into how JavaScript handles concurrency, preparing you for senior-level technical interviews.

## 1. JavaScript Execution Model

### Deep-dive Theory

JavaScript is primarily a **single-threaded** language, meaning it has one **Call Stack** and can perform only one operation at a time. It executes code in a "Run-to-Completion" manner. However, the runtime environment (Browser or Node.js) provides mechanisms to handle concurrency:

- **Heap:** Memory allocation happens here.
- **Call Stack:** Where execution contexts are stacked. LIFO (Last In, First Out).
- **Web APIs (Browser) / C++ APIs (Node):** Threads provided by the environment to handle blocking operations like network requests, timers, or DOM events. This allows for **Non-blocking I/O**.

### Interview Key Questions

- "If JavaScript is single-threaded, how can it be non-blocking?"
- "Explain the relationship between the Call Stack and Web APIs."

### Sample Answers with Keywords

**Candidate:** "JavaScript itself is single-threaded, executing code on the **Call Stack**. However, it relies on the host environment to handle potentially blocking operations. When an async operation (like `fetch` or `setTimeout`) is invoked, it is offloaded to the **Web APIs**. Once complete, the callback is pushed to a queue. The **Event Loop** then orchestrates moving these callbacks back to the Call Stack only when the stack is empty. This architecture allows **Non-blocking I/O** despite the single thread."

**Keywords:** Call Stack, Web APIs, Non-blocking I/O, Event Loop, Run-to-Completion.

---

## 2. Event Loop & Task Scheduling

### Deep-dive Theory

The **Event Loop** is the mechanism that constantly monitors the Call Stack and the queues.

1.  **Macrotasks (Task Queue):** `setTimeout`, `setInterval`, `setImmediate` (Node), I/O events, UI rendering.
2.  **Microtasks (Microtask Queue):** `Promise` callbacks (`.then/catch/finally`), `queueMicrotask`, `MutationObserver`.

**Priority Rule:** After every Macrotask, the Event Loop visits the Microtask Queue and executes _all_ items there until it is empty (including new microtasks scheduled during execution) before moving to the next Macrotask or rendering.

### Interview Key Questions

- "What is the difference between a Macrotask and a Microtask?"
- "In what order do `setTimeout` and `Promise.resolve` execute?"
- "Can a microtask loop block the UI?"

### Sample Answers with Keywords

**Candidate:** "The key difference is **Priority**. **Microtasks** have higher priority. After the execution of a script or a macrotask, the **Event Loop** clears the entire **Microtask Queue** before moving to the next macrotask or performing a UI render. This means a recursive microtask loop can block the thread indefinitely, whereas macrotasks allow for checking the **Task Queue** and rendering in between."

**Keywords:** Event Loop, Task Queue, Microtask Queue, Priority, Starvation.

### Code Challenge: Execution Order

**Question:** What is the output order?

```javascript
console.log("1. Script start")

setTimeout(() => {
  console.log("2. setTimeout")
}, 0)

Promise.resolve()
  .then(() => {
    console.log("3. Promise 1")
  })
  .then(() => {
    console.log("4. Promise 2")
  })

console.log("5. Script end")
```

**Answer:**

1. `1. Script start` (Sync)
2. `5. Script end` (Sync)
3. `3. Promise 1` (Microtask - high priority)
4. `4. Promise 2` (Microtask - scheduled by previous microtask)
5. `2. setTimeout` (Macrotask - next loop tick)

---

## 3. Async/Await & Promise

### Deep-dive Theory

`Async/Await` is syntactic sugar over Promises, making asynchronous code look synchronous.

- **Error Propagation:** In `async` functions, errors are handled via `try...catch`. In raw Promises, via `.catch()`.
- **Parallelism:** Use `Promise.all` or `Promise.allSettled` to run independent tasks concurrently.

### Technical Analysis: Race Conditions

In Frontend, a common Race Condition occurs when multiple asynchronous requests are sent (e.g., search typeahead), and responses arrive out of order. If the older request finishes _after_ the newer one, it might overwrite the correct state.

### Interview Key Questions

- "How do you handle error propagation in an async function nested within a non-async function?"
- "Explain a scenario where a Race Condition happens in a UI component."

### Sample Answers with Keywords

**Candidate:** "In a search input, if I fire a network request for 'React' and then 'ReactJS', the 'React' response might arrive last due to network latency. If I blindly set the state, the UI will show results for 'React' while the input says 'ReactJS'. To fix this **Race Condition**, we need to cancel the stale promise or ignore its result using mechanisms like **AbortController** or tracking a boolean `active` flag."

**Keywords:** Race Condition, Stale Data, Promise.all, Error Propagation, AbortController.

### Code Challenge: Fixing Race Conditions

**Problem:** Fix the race condition in this search function.

```javascript
// Bad Implementation
let results
async function search(query) {
  // If this takes 5s...
  results = await fetchResults(query)
  render(results)
}
// Calling search('A') then search('B') immediately might result in 'A' overwriting 'B'.

// Improved Implementation (Closures/ID)
let lastRequestId = 0
async function searchSafe(query) {
  const currentId = ++lastRequestId
  const data = await fetchResults(query)

  // Only update if this is still the latest request
  if (currentId === lastRequestId) {
    render(data)
  }
}
```

---

## 4. Browser APIs & Main Thread

### Deep-dive Theory

The Main Thread handles JS execution, style calculation, layout, and painting. Blocking it causes **UI Lag** (dropped frames).

- **requestAnimationFrame (rAF):** Schedules code before the next repaint (sync with refresh rate ~60fps).
- **requestIdleCallback (rIC):** Schedules code during browser idle periods (low priority).
- **Web Workers:** Offload heavy computation (parsing, image processing) to a background thread. Workers do not have DOM access.

### Technical Analysis: AbortController

The `AbortController` API is the modern standard to cancel asynchronous tasks, specifically `fetch` requests and event listeners.

### Interview Key Questions

- "How would you handle a heavy JSON parsing task without freezing the UI?"
- "When would you use `requestAnimationFrame` vs `setTimeout`?"

### Sample Answers with Keywords

**Candidate:** "For heavy computations, I would use a **Web Worker** to move the task off the **Main Thread**, communicating results back via messages. If the task involves DOM manipulation and must be on the main thread, I might use **requestIdleCallback** to process it in chunks. For animations, **requestAnimationFrame** is superior to `setTimeout` as it aligns with the browser's refresh rate, preventing layout thrashing."

**Keywords:** Main Thread, UI Lag, Web Workers, requestAnimationFrame, Off-main-thread architecture.

### Code Challenge: AbortController with Fetch

```javascript
const controller = new AbortController()
const signal = controller.signal

// Start request
fetch("/api/heavy-data", { signal })
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((err) => {
    if (err.name === "AbortError") {
      console.log("Fetch aborted")
    } else {
      console.error("Fetch error:", err)
    }
  })

// Cancel request (e.g., user navigated away or clicked cancel)
controller.abort()
```
