---
title: "JavaScript Concurrency Fundamentals"
tags: ["javascript", "frontend", "interview", "concurrency"]
---

# JavaScript Concurrency Fundamentals

> **Role:** Senior Frontend Engineer & Technical Interviewer.
>
> **Mục tiêu:** Đi sâu vào cơ chế xử lý bất đồng bộ (concurrency) của JavaScript, chuẩn bị cho các buổi phỏng vấn Technical Senior.

## 1. JavaScript Execution Model

### Deep-dive Theory (Lý thuyết chuyên sâu)

JavaScript về cơ bản là ngôn ngữ **đơn luồng (single-threaded)**, nghĩa là nó chỉ có một **Call Stack** và chỉ có thể thực thi một tác vụ tại một thời điểm. Nó tuân theo cơ chế "Run-to-Completion" (chạy đến khi hoàn thành). Tuy nhiên, môi trường thực thi (Browser hoặc Node.js) cung cấp các cơ chế hỗ trợ đa luồng ngầm:

- **Heap:** Nơi cấp phát bộ nhớ cho các biến và object.
- **Call Stack:** Nơi các Execution Context được xếp chồng lên nhau. Hoạt động theo nguyên tắc LIFO (Vào sau ra trước).
- **Web APIs (Browser) / C++ APIs (Node):** Các luồng riêng biệt được môi trường cung cấp để xử lý các tác vụ blocking như request mạng, timer, hay DOM events. Đây là chìa khóa cho **Non-blocking I/O**.

### Interview Key Questions (Câu hỏi phỏng vấn)

- "Nếu JavaScript là đơn luồng, làm sao nó có thể xử lý Non-blocking?"
- "Giải thích mối quan hệ giữa Call Stack và Web APIs."

### Sample Answers with Keywords (Câu trả lời mẫu)

**Ứng viên:** "JavaScript bản thân nó là đơn luồng, thực thi code trên **Call Stack**. Tuy nhiên, nó dựa vào môi trường host để xử lý các tác vụ nặng hoặc tốn thời gian. Khi một tác vụ async (như `fetch` hay `setTimeout`) được gọi, nó sẽ được chuyển sang **Web APIs** để xử lý song song. Khi hoàn tất, callback của nó được đẩy vào hàng đợi. **Event Loop** sau đó sẽ điều phối việc đưa các callback này trở lại Call Stack chỉ khi stack đã rỗng. Kiến trúc này cho phép **Non-blocking I/O** dù chỉ có một luồng chính."

**Keywords:** Call Stack, Web APIs, Non-blocking I/O, Event Loop, Run-to-Completion.

---

## 2. Event Loop & Task Scheduling

### Deep-dive Theory (Lý thuyết chuyên sâu)

**Event Loop** là cơ chế liên tục giám sát Call Stack và các hàng đợi (queues).

1.  **Macrotasks (Task Queue):** `setTimeout`, `setInterval`, `setImmediate` (Node), sự kiện I/O, UI rendering.
2.  **Microtasks (Microtask Queue):** `Promise` callbacks (`.then/catch/finally`), `queueMicrotask`, `MutationObserver`.

**Quy tắc ưu tiên:** Sau mỗi Macrotask, Event Loop sẽ ghé qua Microtask Queue và thực thi _tất cả_ các tác vụ trong đó cho đến khi hàng đợi rỗng (bao gồm cả các microtask mới được thêm vào trong quá trình này) trước khi chuyển sang Macrotask tiếp theo hoặc render lại giao diện.

### Interview Key Questions (Câu hỏi phỏng vấn)

- "Sự khác biệt chính giữa Macrotask và Microtask là gì?"
- "Thứ tự thực thi giữa `setTimeout` và `Promise.resolve` như thế nào?"
- "Một vòng lặp vô hạn trong microtask có thể làm treo UI không?"

### Sample Answers with Keywords (Câu trả lời mẫu)

**Ứng viên:** "Sự khác biệt cốt lõi nằm ở **Độ ưu tiên (Priority)**. **Microtasks** có độ ưu tiên cao hơn. Sau khi một script hoặc macrotask chạy xong, **Event Loop** sẽ dọn sạch toàn bộ **Microtask Queue** trước khi chuyển sang macrotask tiếp theo hoặc cập nhật UI (Render). Điều này có nghĩa là nếu bạn spam microtask liên tục (ví dụ để quy đệ quy), nó có thể block thread vĩnh viễn (starvation), trong khi macrotask cho phép chen giữa là việc render UI."

**Keywords:** Event Loop, Task Queue, Microtask Queue, Priority, Starvation.

### Code Challenge: Execution Order

**Câu hỏi:** Thứ tự output của đoạn code sau là gì?

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

**Đáp án:**

1. `1. Script start` (Đồng bộ)
2. `5. Script end` (Đồng bộ)
3. `3. Promise 1` (Microtask - ưu tiên cao)
4. `4. Promise 2` (Microtask - được xếp lịch bởi microtask trước)
5. `2. setTimeout` (Macrotask - tick tiếp theo)

---

## 3. Async/Await & Promise

### Deep-dive Theory (Lý thuyết chuyên sâu)

`Async/Await` là cú pháp (syntactic sugar) bọc ngoài Promises, giúp code bất đồng bộ nhìn giống đồng bộ hơn.

- **Error Propagation:** Trong hàm `async`, lỗi được bắt bằng `try...catch`. Với Promise thuần, dùng `.catch()`.
- **Parallelism:** Sử dụng `Promise.all` hoặc `Promise.allSettled` để chạy các tác vụ độc lập song song.

### Technical Analysis: Race Conditions

Trong Frontend, **Race Condition** thường xảy ra khi nhiều request bất đồng bộ được gửi đi (ví dụ: gõ phím tìm kiếm - typeahead), và phản hồi trả về không theo thứ tự gửi. Nếu request cũ hoàn thành _sau_ request mới, nó có thể ghi đè dữ liệu sai lệch lên UI.

### Interview Key Questions (Câu hỏi phỏng vấn)

- "Làm sao để handle lỗi trong một async function được gọi lồng trong một non-async function?"
- "Giải thích một tình huống Race Condition thực tế trong UI component."

### Sample Answers with Keywords (Câu trả lời mẫu)

**Ứng viên:** "Trong ô input tìm kiếm, nếu tôi request keyword 'React' rồi sửa thành 'ReactJS', response của 'React' có thể về sau do mạng lag. Nếu cập nhật state một cách mù quáng, UI sẽ hiển thị kết quả của 'React' trong khi ô input là 'ReactJS'. Để fix lỗi **Race Condition** này, cần hủy promise cũ hoặc bỏ qua kết quả của nó bằng cách dùng **AbortController** hoặc so sánh ID/timestamp của request."

**Keywords:** Race Condition, Stale Data, Promise.all, Error Propagation, AbortController.

### Code Challenge: Fixing Race Conditions

**Bài toán:** Fix lỗi race condition trong hàm search sau.

```javascript
// Bad Implementation
let results
async function search(query) {
  // Giả sử request này mất 5s
  results = await fetchResults(query)
  render(results)
}
// Gọi search('A') rồi ngay lập tức gọi search('B'), 'A' có thể ghi đè 'B'.

// Improved Implementation (Closures/ID)
let lastRequestId = 0
async function searchSafe(query) {
  const currentId = ++lastRequestId
  const data = await fetchResults(query)

  // Chỉ update nếu đây vẫn là request mới nhất
  if (currentId === lastRequestId) {
    render(data)
  }
}
```

---

## 4. Browser APIs & Main Thread

### Deep-dive Theory (Lý thuyết chuyên sâu)

**Main Thread** chịu trách nhiệm thực thi JS, tính toán style, layout, và vẽ (paint) lên màn hình. Blocking main thread sẽ gây ra **UI Lag** (rớt frame).

- **requestAnimationFrame (rAF):** Lên lịch chạy code ngay trước lần vẽ lại tiếp theo (đồng bộ với tần số quét màn hình ~60fps).
- **requestIdleCallback (rIC):** Lên lịch chạy code khi trình duyệt rảnh rỗi (độ ưu tiên thấp).
- **Web Workers:** Đẩy các tính toán nặng (parse JSON lớn, xử lý ảnh) sang một luồng nền riêng biệt. Worker không thể truy cập DOM.

### Technical Analysis: AbortController

API `AbortController` là tiêu chuẩn hiện đại để hủy các tác vụ bất đồng bộ, đặc biệt là `fetch` request và event listeners.

### Interview Key Questions (Câu hỏi phỏng vấn)

- "Bạn xử lý thế nào nếu cần parse một file JSON cực lớn mà không làm đơ UI?"
- "Khi nào dùng `requestAnimationFrame` thay vì `setTimeout`?"

### Sample Answers with Keywords (Câu trả lời mẫu)

**Ứng viên:** "Với các tác vụ tính toán nặng, tôi sẽ dùng **Web Worker** để đưa việc xử lý ra khỏi **Main Thread**, kết quả trả về qua message. Nếu bắt buộc phải chạy trên main thread (cần DOM), tôi dùng **requestIdleCallback** để chia nhỏ tác vụ. Với animation, **requestAnimationFrame** tối ưu hơn `setTimeout` vì nó đồng bộ với refresh rate của màn hình, tránh hiện tượng giật cục (layout thrashing)."

**Keywords:** Main Thread, UI Lag, Web Workers, requestAnimationFrame, Off-main-thread architecture.

### Code Challenge: AbortController with Fetch

```javascript
const controller = new AbortController()
const signal = controller.signal

// Bắt đầu request
fetch("/api/heavy-data", { signal })
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((err) => {
    if (err.name === "AbortError") {
      console.log("Fetch đã bị hủy")
    } else {
      console.error("Lỗi fetch:", err)
    }
  })

// Hủy request (ví dụ: user chuyển trang hoặc bấm cancel)
controller.abort()
```
