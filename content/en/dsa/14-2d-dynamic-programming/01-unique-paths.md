---
title: Unique Paths
tags: [dsa, dynamic-programming, math, medium, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/unique-paths
---

# Unique Paths

## 🧩 Đề bài

Một robot đang ở góc trên bên trái của một lưới `m x n` (được đánh dấu là 'Start' trong hình ảnh dưới đây). Robot chỉ có thể di chuyển xuống dưới hoặc sang phải tại bất kỳ thời điểm nào. Robot muốn đến góc dưới bên phải của lưới (được đánh dấu là 'Finish' trong hình ảnh dưới đây).

Hỏi có bao nhiêu đường đi duy nhất có thể?

**Ràng buộc:**
- `1 <= m, n <= 100`

**Ví dụ:**
- Input: `m = 3`, `n = 7`
- Output: `28`

- Input: `m = 3`, `n = 2`
- Output: `3`
- Giải thích: Từ góc trên trái đến góc dưới phải có 3 đường:
  1. Right -> Down
  2. Down -> Right
  3. Right -> Down -> Right (không đúng, vì chỉ có 2 cột)

## 💡 Ý tưởng

Đây là bài toán DP 2D kinh điển. Ta có thể nghĩ:

- Để đến ô `(i, j)`, robot có thể đến từ:
  - Ô `(i-1, j)` (từ trên xuống) - nếu i > 0
  - Ô `(i, j-1)` (từ trái sang) - nếu j > 0

**Công thức DP:**
```
dp[i][j] = số đường đi đến ô (i, j)
dp[i][j] = dp[i-1][j] + dp[i][j-1]
```

**Điều kiện ban đầu:**
- `dp[0][0] = 1` (ô bắt đầu)
- `dp[0][j] = 1` (hàng đầu tiên - chỉ có thể đến từ trái)
- `dp[i][0] = 1` (cột đầu tiên - chỉ có thể đến từ trên)

**Tối ưu bộ nhớ:** Chỉ cần lưu một hàng (hoặc một cột) thay vì toàn bộ lưới, giảm từ O(m*n) xuống O(min(m,n)).

**Cách khác:** Có thể dùng công thức toán học (tổ hợp) để tính trực tiếp: `C(m+n-2, m-1)` hoặc `C(m+n-2, n-1)`.

## ⚙️ Hướng tiếp cận

**Cách 1: DP 2D (dễ hiểu)**

1. Khởi tạo mảng DP: `dp[i][j] = 0`
2. Điền hàng đầu và cột đầu: `dp[0][j] = 1`, `dp[i][0] = 1`
3. Duyệt từng ô còn lại:
   - `dp[i][j] = dp[i-1][j] + dp[i][j-1]`
4. Trả về `dp[m-1][n-1]`

**Cách 2: Tối ưu bộ nhớ (khuyến nghị)**

1. Chỉ cần lưu một hàng: `prev = [1] * n`
2. Duyệt từng hàng từ trên xuống:
   - Hàng đầu: `curr = [1] * n`
   - Các hàng sau: `curr[j] = prev[j] + curr[j-1]`
3. Trả về `curr[n-1]`

## ⏱️ Độ phức tạp

| Cách tiếp cận | Thời gian | Bộ nhớ |
|---------------|-----------|--------|
| DP 2D | O(m * n) | O(m * n) |
| Tối ưu bộ nhớ | O(m * n) | O(min(m, n)) |
| Math (tổ hợp) | O(min(m, n)) | O(1) |

## 💻 Code minh họa

**Cách 1: DP 2D (dễ hiểu)**

```python
def uniquePaths(m: int, n: int) -> int:
    """
    Tính số đường đi duy nhất từ góc trên trái đến góc dưới phải.
    Sử dụng DP 2D.
    
    Args:
        m: Số hàng
        n: Số cột
    
    Returns:
        Số đường đi duy nhất
    """
    # dp[i][j] = số đường đi đến ô (i, j)
    dp = [[0] * n for _ in range(m)]
    
    # Hàng đầu tiên: chỉ có thể đến từ trái
    for j in range(n):
        dp[0][j] = 1
    
    # Cột đầu tiên: chỉ có thể đến từ trên
    for i in range(m):
        dp[i][0] = 1
    
    # Tính các ô còn lại
    for i in range(1, m):
        for j in range(1, n):
            dp[i][j] = dp[i-1][j] + dp[i][j-1]
    
    return dp[m-1][n-1]
```

**Cách 2: Tối ưu bộ nhớ (khuyến nghị)**

```python
def uniquePaths(m: int, n: int) -> int:
    """
    Tối ưu bộ nhớ: chỉ dùng O(n) space.
    """
    # Chỉ cần lưu một hàng
    prev = [1] * n
    
    # Duyệt từng hàng từ trên xuống
    for i in range(1, m):
        curr = [1] * n  # Cột đầu tiên luôn là 1
        for j in range(1, n):
            # Từ trên xuống + từ trái sang
            curr[j] = prev[j] + curr[j-1]
        prev = curr
    
    return prev[n-1]
```

**Cách 3: Dùng công thức toán học (tổ hợp)**

```python
import math

def uniquePaths(m: int, n: int) -> int:
    """
    Dùng công thức tổ hợp: C(m+n-2, m-1) = C(m+n-2, n-1)
    Số cách chọn m-1 bước "xuống" trong tổng số m+n-2 bước.
    """
    return math.comb(m + n - 2, m - 1)
```

**Giải thích công thức toán học:**
- Để đi từ (0,0) đến (m-1, n-1), cần:
  - (m-1) bước xuống
  - (n-1) bước sang phải
  - Tổng: (m-1) + (n-1) = m+n-2 bước
- Số cách sắp xếp: chọn (m-1) vị trí cho bước xuống trong tổng số (m+n-2) bước
- Công thức: `C(m+n-2, m-1)`

## 🧠 Ghi chú

- **DP 2D Pattern:** Đây là pattern phổ biến khi làm việc với lưới/grid. Mỗi ô phụ thuộc vào các ô ở trên và bên trái.
- **Tại sao tối ưu bộ nhớ được?** Vì khi tính hàng i, ta chỉ cần hàng i-1, không cần các hàng trước đó. Tương tự, trong mỗi hàng, ta chỉ cần giá trị trước đó.
- **Công thức toán học:** Nhanh hơn nhưng có thể overflow với số lớn. DP an toàn hơn.
- **So sánh với Unique Paths II:** Bài này không có chướng ngại vật, bài II có chướng ngại vật (ô bị chặn).
- **Ứng dụng:** 
  - Robot navigation
  - Path finding algorithms
  - Game development
- **Liên kết tới các bài liên quan:**
  - [[Unique Paths II]] - Có chướng ngại vật
  - [[Climbing Stairs]] - DP 1D với pattern tương tự
  - [[Longest Common Subsequence]] - DP 2D với hai chuỗi

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
m = 3, n = 7

DP table:
    0  1  2  3  4  5  6
0   1  1  1  1  1  1  1
1   1  2  3  4  5  6  7
2   1  3  6 10 15 21 28

Output: 28
```

**Ví dụ 2:**
```
m = 3, n = 2

DP table:
    0  1
0   1  1
1   1  2
2   1  3

Output: 3
Các đường:
1. Right -> Down -> Down
2. Down -> Right -> Down
3. Down -> Down -> Right
```

**Ví dụ 3:**
```
m = 1, n = 1

Output: 1
(Đã ở đích)
```
