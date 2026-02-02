---
title: "Understanding React Hooks & Common Interview Questions"
description: "A comprehensive guide to basic and advanced hooks in ReactJS with Frontend interview questions."
---

# Understanding React Hooks

React Hooks were introduced in React 16.8, allowing you to use state and other React features without writing a class.

## 1. Common Hooks

### 1.1 `useState`
Used to manage state in functional components.
```javascript
const [count, setCount] = useState(0);
```

### 1.2 `useEffect`
Used to perform side effects (fetch data, subscriptions, manual DOM changes).
- No dependency: runs after every render.
- Dependency is `[]`: runs only once after mount.
- Has dependency `[prop, state]`: runs when values change.

### 1.3 `useContext`
Access Context without using a Consumer layer.
```javascript
const theme = useContext(ThemeContext);
```

### 1.4 `useReducer`
Alternative to `useState` when state is complex or needs complex transition logic (similar to Redux).

### 1.5 `useMemo` & `useCallback`
- `useMemo`: Memoizes computed values to avoid unnecessary recalculations.
- `useCallback`: Memoizes functions to avoid creating new functions on every render.

### 1.6 `useRef`
- Stores mutable values without causing re-renders.
- Directly accesses DOM elements.

---

## 2. Rules of Hooks
1. **Only call Hooks at the Top Level:** Don't call in loops, conditions, or nested functions.
2. **Only call Hooks from React Functions:** Call from functional components or custom hooks.

---

## 3. Common React Hooks Interview Questions

### Question 1: What are Hooks? Why use Hooks instead of Class Components?
**Answer:** Hooks are functions that let you "hook into" React features. Advantages:
- Reusability: Easily share logic between components (Custom Hooks).
- Readability: Cleaner code compared to "wrapper hell" or "giant classes".
- No more worries about the `this` keyword.

### Question 2: What's the difference between `useMemo` and `useCallback`?
**Answer:**
- `useMemo` returns a **memoized value**.
- `useCallback` returns a **memoized function**.

### Question 3: How to simulate `componentDidMount` with `useEffect`?
**Answer:** Pass an empty array `[]` as the second argument to `useEffect`.

### Question 4: How does Hook lifecycle differ from Class Components?
**Answer:** Functional Components don't have lifecycle methods like `componentDidMount`, `componentDidUpdate`. Instead, we use `useEffect` to handle all phases based on the dependencies array.

### Question 5: Why shouldn't you call Hooks in loops?
**Answer:** React relies on the order of Hook calls to know which state corresponds to which Hook. If the order changes (due to loops or conditions), React gets confused about the data.

### Question 6: What is a Custom Hook?
**Answer:** A JavaScript function whose name starts with `use` and can call other Hooks. It helps separate logic from UI for reusability.

---

## Conclusion
Mastering React Hooks is essential for modern Frontend developers. It not only makes code cleaner but also helps optimize application performance effectively.

---

[🇻🇳 Đọc bằng Tiếng Việt](../../vi/frontend/Reactjs/react-hooks.md)
