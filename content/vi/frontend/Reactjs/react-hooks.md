---
title: "Tìm hiểu về React Hooks & Câu hỏi phỏng vấn thường gặp"
description: "Hướng dẫn chi tiết về các hooks cơ bản và nâng cao trong ReactJS cùng bộ câu hỏi phỏng vấn Frontend."
---

# Tìm hiểu về React Hooks

React Hooks được giới thiệu từ phiên bản React 16.8, cho phép bạn sử dụng state và các tính năng khác của React mà không cần viết class.

## 1. Các Hooks phổ biến

### 1.1 `useState`
Dùng để quản lý state trong functional component.
```javascript
const [count, setCount] = useState(0);
```

### 1.2 `useEffect`
Dùng để thực hiện các side effects (fetch data, subscriptions, manual DOM changes).
- Không có dependency: chạy sau mỗi lần render.
- Dependency là `[]`: chỉ chạy 1 lần sau khi mount.
- Có dependency `[prop, state]`: chạy khi giá trị thay đổi.

### 1.3 `useContext`
Giúp truy cập vào Context mà không cần sử dụng Consumer layer.
```javascript
const theme = useContext(ThemeContext);
```

### 1.4 `useReducer`
Thay thế cho `useState` khi state phức tạp hoặc cần logic chuyển đổi phức tạp (tương tự Redux).

### 1.5 `useMemo` & `useCallback`
- `useMemo`: Ghi nhớ giá trị tính toán để tránh tính toán lại không cần thiết.
- `useCallback`: Ghi nhớ hàm để tránh tạo lại hàm mới sau mỗi lần render.

### 1.6 `useRef`
- Lưu trữ giá trị có thể thay đổi nhưng không làm component re-render.
- Truy cập trực tiếp vào DOM element.

---

## 2. Quy tắc sử dụng Hooks (Rules of Hooks)
1. **Chỉ gọi Hooks ở cấp cao nhất (Top Level):** Không gọi trong vòng lặp, điều kiện hoặc hàm lồng nhau.
2. **Chỉ gọi Hooks từ React Functions:** Gọi từ functional components hoặc custom hooks.

---

## 3. Câu hỏi phỏng vấn thường gặp về React Hooks

### Câu 1: Hook là gì? Tại sao nên dùng Hook thay vì Class Component?
**Trả lời:** Hook là các hàm cho phép "móc" vào các tính năng của React. Ưu điểm:
- Reusability: Dễ dàng chia sẻ logic giữa các component (Custom Hooks).
- Readability: Code gọn gàng, dễ hiểu hơn so với "wrapper hell" hay "giant classes".
- Không còn nỗi lo về từ khóa `this`.

### Câu 2: Sự khác biệt giữa `useMemo` và `useCallback` là gì?
**Trả lời:**
- `useMemo` trả về một **giá trị** được ghi nhớ.
- `useCallback` trả về một **hàm** được ghi nhớ.

### Câu 3: Làm thế nào để mô phỏng `componentDidMount` bằng `useEffect`?
**Trả lời:** Truyền một mảng rỗng `[]` làm đối số thứ hai cho `useEffect`.

### Câu 4: Lifecycle của Hook có gì khác với Class Component?
**Trả lời:** Trong Functional Component không có các phương thức lifecycle như `componentDidMount`, `componentDidUpdate`. Thay vào đó, ta sử dụng `useEffect` để xử lý tất cả các giai đoạn này dựa trên mảng dependencies.

### Câu 5: Tại sao không nên gọi Hook trong vòng lặp?
**Trả lời:** React dựa vào thứ tự gọi các Hooks để biết state nào tương ứng với Hook nào. Nếu thứ tự này bị thay đổi (do vòng lặp hoặc điều kiện), React sẽ bị nhầm lẫn dữ liệu.

### Câu 6: Custom Hook là gì?
**Trả lời:** Là một hàm JavaScript có tên bắt đầu bằng `use` và có thể gọi các Hooks khác. Nó giúp tách logic xử lý ra khỏi UI để tái sử dụng.

---

## Kết luận
Việc nắm vững React Hooks là yêu cầu bắt buộc đối với một lập trình viên Frontend hiện đại. Không chỉ giúp code sạch hơn, nó còn giúp tối ưu hiệu năng ứng dụng một cách hiệu quả.

---

[🇬🇧 Read in English](../../en/frontend/Reactjs/react-hooks.md)
