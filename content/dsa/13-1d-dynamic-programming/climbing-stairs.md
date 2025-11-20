---
title: Climbing Stairs
tags: [dsa, dynamic-programming, easy, "#topic/dsa"]
date: 2024-12-19
difficulty: Easy
source: neetcode
link: https://neetcode.io/problems/climbing-stairs
---

# Climbing Stairs

## 🧩 Đề bài

Bạn đang leo cầu thang. Cần `n` bước để lên đến đỉnh. Mỗi lần bạn có thể leo 1 bước hoặc 2 bước. Hỏi có bao nhiêu cách khác nhau để leo lên đỉnh?

**Ràng buộc:**
- `1 <= n <= 45`

**Ví dụ:**
- Input: `n = 2`
- Output: `2`
- Giải thích: Có 2 cách để leo lên đỉnh:
  - Cách 1: 1 bước + 1 bước
  - Cách 2: 2 bước

- Input: `n = 3`
- Output: `3`
- Giải thích: Có 3 cách:
  - Cách 1: 1 + 1 + 1
  - Cách 2: 1 + 2
  - Cách 3: 2 + 1

## 💡 Ý tưởng

Đây là bài toán **Fibonacci** kinh điển! Ta có thể nhận thấy:

- Để đến bước thứ `n`, ta có thể đến từ:
  - Bước thứ `n-1` (rồi leo 1 bước)
  - Bước thứ `n-2` (rồi leo 2 bước)

- Vậy số cách đến bước `n` = số cách đến bước `n-1` + số cách đến bước `n-2`

Công thức: `dp[n] = dp[n-1] + dp[n-2]`

Đây chính là dãy Fibonacci! Với `dp[1] = 1`, `dp[2] = 2`.

**Cách tiếp cận:**
1. **Recursion + Memoization:** Dễ hiểu nhưng có thể stack overflow
2. **Bottom-up DP:** Dùng mảng lưu kết quả từ nhỏ đến lớn
3. **Space-optimized DP:** Chỉ cần lưu 2 giá trị trước đó (tối ưu nhất)

## ⚙️ Hướng tiếp cận

**Cách 1: Bottom-up DP với mảng**
1. Khởi tạo: `dp[1] = 1`, `dp[2] = 2`
2. Duyệt từ 3 đến n: `dp[i] = dp[i-1] + dp[i-2]`
3. Trả về `dp[n]`

**Cách 2: Space-optimized (khuyến nghị)**
1. Chỉ cần lưu 2 biến: `prev` và `curr`
2. Duyệt từ 3 đến n, cập nhật: `prev, curr = curr, prev + curr`
3. Trả về `curr`

**Edge cases:**
- `n = 1` → 1 cách
- `n = 2` → 2 cách

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n) - Duyệt từ 1 đến n một lần |
| Bộ nhớ | O(1) - Chỉ dùng 2 biến (với cách tối ưu) |

## 💻 Code minh họa

**Cách 1: Bottom-up DP với mảng**

```python
def climbStairs(n: int) -> int:
    if n <= 2:
        return n
    
    # Mảng lưu số cách đến từng bước
    dp = [0] * (n + 1)
    dp[1] = 1
    dp[2] = 2
    
    # Tính từng bước từ 3 đến n
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    
    return dp[n]
```

**Cách 2: Space-optimized (tối ưu nhất - khuyến nghị)**

```python
def climbStairs(n: int) -> int:
    if n <= 2:
        return n
    
    # Chỉ cần lưu 2 giá trị trước đó
    prev = 1  # dp[1]
    curr = 2  # dp[2]
    
    for i in range(3, n + 1):
        prev, curr = curr, prev + curr
    
    return curr
```

**Cách 3: Recursion + Memoization**

```python
  def climbStairs(n: int) -> int:
    """
    Sử dụng recursion với memoization.
    """
    memo = {}
    
    def dp(i):
        if i <= 2:
            return i
        if i in memo:
            return memo[i]
        memo[i] = dp(i-1) + dp(i-2)
        return memo[i]
    
    return dp(n)
```

## 🧠 Ghi chú

- **Tại sao đây là bài toán Fibonacci?** Vì công thức `f(n) = f(n-1) + f(n-2)` giống hệt dãy Fibonacci, chỉ khác điều kiện ban đầu.
- **So sánh các cách:**
  - **Recursion + Memoization:** Dễ hiểu nhưng có thể stack overflow với n lớn
  - **Bottom-up DP:** An toàn, dễ debug, nhưng tốn O(n) bộ nhớ
  - **Space-optimized:** Tối ưu nhất, chỉ cần O(1) bộ nhớ
- **Khi nào dùng cách nào?**
  - Nếu cần hiểu rõ quá trình → dùng mảng DP
  - Nếu cần tối ưu bộ nhớ → dùng space-optimized
  - Nếu chỉ cần kết quả cuối cùng → dùng space-optimized
- **Pattern quan trọng:** Đây là pattern cơ bản nhất của DP - bài toán có thể chia nhỏ thành các bài toán con, và kết quả phụ thuộc vào kết quả của các bài toán con trước đó.
- **Liên kết tới các bài liên quan:**
  - [[House Robber]] - Cũng dùng pattern tương tự (chọn hoặc không chọn)
  - [[Unique Paths]] - DP 2D với pattern tương tự
  - [[Decode Ways]] - DP với điều kiện phức tạp hơn

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
n = 4

Các cách:
1. 1 + 1 + 1 + 1
2. 1 + 1 + 2
3. 1 + 2 + 1
4. 2 + 1 + 1
5. 2 + 2

Tổng: 5 cách

Tính bằng DP:
dp[1] = 1
dp[2] = 2
dp[3] = dp[2] + dp[1] = 2 + 1 = 3
dp[4] = dp[3] + dp[2] = 3 + 2 = 5

Output: 5
```

**Ví dụ 2:**
```
n = 5

Tính bằng DP:
dp[1] = 1
dp[2] = 2
dp[3] = 3
dp[4] = 5
dp[5] = dp[4] + dp[3] = 5 + 3 = 8

Output: 8
```

**Ví dụ 3:**
```
n = 1

Output: 1
```
