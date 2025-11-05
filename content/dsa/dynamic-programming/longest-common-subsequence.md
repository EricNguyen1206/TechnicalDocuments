---
title: Longest Common Subsequence
tags: [dsa, dynamic-programming, string, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/longest-common-subsequence
---

# Longest Common Subsequence

## 🧩 Đề bài

Cho hai chuỗi `text1` và `text2`, trả về độ dài của dãy con chung dài nhất (LCS - Longest Common Subsequence) của chúng. Nếu không có dãy con chung, trả về 0.

**Lưu ý:** Dãy con (subsequence) không nhất thiết phải liên tiếp, nhưng phải giữ nguyên thứ tự.

**Ràng buộc:**
- `1 <= text1.length, text2.length <= 1000`
- `text1` và `text2` chỉ chứa các ký tự chữ cái thường (a-z)

**Ví dụ:**
- Input: `text1 = "abcde"`, `text2 = "ace"`
- Output: `3`
- Giải thích: Dãy con chung dài nhất là "ace" với độ dài 3.

- Input: `text1 = "abc"`, `text2 = "abc"`
- Output: `3`
- Giải thích: Dãy con chung dài nhất là "abc" với độ dài 3.

## 💡 Ý tưởng

Đây là bài toán DP 2D kinh điển. Ta cần so sánh từng ký tự của hai chuỗi.

**Công thức DP:**
- `dp[i][j]` = độ dài LCS của `text1[0:i]` và `text2[0:j]`
- Nếu `text1[i-1] == text2[j-1]`: Ký tự khớp → `dp[i][j] = dp[i-1][j-1] + 1`
- Nếu `text1[i-1] != text2[j-1]`: Ký tự không khớp → `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`
  - Bỏ qua ký tự của text1: `dp[i-1][j]`
  - Bỏ qua ký tự của text2: `dp[i][j-1]`

**Tại sao?**
- Nếu khớp: Ta có thể thêm ký tự này vào LCS, nên LCS tăng thêm 1
- Nếu không khớp: Ta chọn cách tốt hơn giữa việc bỏ qua ký tự của text1 hoặc text2

**Điều kiện ban đầu:**
- `dp[0][j] = 0` (text1 rỗng)
- `dp[i][0] = 0` (text2 rỗng)

## ⚙️ Hướng tiếp cận

1. **Khởi tạo mảng DP 2D:**
   - Kích thước: `(len(text1)+1) x (len(text2)+1)`
   - `dp[0][j] = 0` và `dp[i][0] = 0`

2. **Duyệt từng vị trí:**
   - Với mỗi `i` từ 1 đến len(text1):
     - Với mỗi `j` từ 1 đến len(text2):
       - Nếu `text1[i-1] == text2[j-1]`:
         - `dp[i][j] = dp[i-1][j-1] + 1`
       - Ngược lại:
         - `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`

3. **Trả về kết quả:** `dp[len(text1)][len(text2)]`

**Tối ưu bộ nhớ:** Có thể dùng 2 mảng 1D thay vì 2D, nhưng phức tạp hơn.

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(m * n) - m, n là độ dài của text1 và text2 |
| Bộ nhớ | O(m * n) - Mảng DP 2D |

**Tối ưu bộ nhớ:** Có thể giảm xuống O(min(m, n)) bằng cách dùng 2 mảng 1D.

## 💻 Code minh họa

**Cách 1: DP 2D (dễ hiểu nhất)**

'''python
def longestCommonSubsequence(text1: str, text2: str) -> int:
    """
    Tìm độ dài của dãy con chung dài nhất.
    Sử dụng DP 2D.
    
    Args:
        text1: Chuỗi thứ nhất
        text2: Chuỗi thứ hai
    
    Returns:
        Độ dài của LCS
    """
    m, n = len(text1), len(text2)
    
    # dp[i][j] = độ dài LCS của text1[0:i] và text2[0:j]
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    # Duyệt từng vị trí
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            # Nếu ký tự khớp
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                # Chọn cách tốt hơn: bỏ qua ký tự của text1 hoặc text2
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    
    return dp[m][n]
'''

**Cách 2: Tối ưu bộ nhớ (2 mảng 1D)**

'''python
def longestCommonSubsequence(text1: str, text2: str) -> int:
    """
    Tối ưu bộ nhớ: chỉ dùng 2 mảng 1D.
    O(min(m, n)) space.
    """
    # Đảm bảo text1 là chuỗi ngắn hơn để tối ưu
    if len(text1) > len(text2):
        text1, text2 = text2, text1
    
    m, n = len(text1), len(text2)
    
    # Chỉ cần 2 mảng: prev và curr
    prev = [0] * (m + 1)
    curr = [0] * (m + 1)
    
    for j in range(1, n + 1):
        for i in range(1, m + 1):
            if text1[i-1] == text2[j-1]:
                curr[i] = prev[i-1] + 1
            else:
                curr[i] = max(prev[i], curr[i-1])
        prev, curr = curr, prev
    
    return prev[m]
'''

**Phiên bản với giải thích chi tiết:**

'''python
def longestCommonSubsequence(text1: str, text2: str) -> int:
    """
    Ví dụ với text1 = "abcde", text2 = "ace"
    
    dp table:
          ""  a   c   e
    ""    0   0   0   0
    a     0   1   1   1
    b     0   1   1   1
    c     0   1   2   2
    d     0   1   2   2
    e     0   1   2   3
    
    Giải thích:
    - dp[1][1]: text1[0]='a', text2[0]='a' → khớp → dp[1][1] = 1
    - dp[3][2]: text1[2]='c', text2[1]='c' → khớp → dp[3][2] = dp[2][1] + 1 = 2
    - dp[5][3]: text1[4]='e', text2[2]='e' → khớp → dp[5][3] = dp[4][2] + 1 = 3
    """
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    
    return dp[m][n]
'''

## 🧠 Ghi chú

- **DP 2D Pattern:** Đây là pattern phổ biến khi làm việc với hai chuỗi/mảng. Mỗi ô trong bảng DP đại diện cho kết quả của bài toán con.
- **Tại sao `i-1` và `j-1`?** Vì ta dùng index 1-based trong DP (0 là rỗng), nhưng chuỗi dùng index 0-based.
- **Tối ưu bộ nhớ:** Có thể giảm từ O(m*n) xuống O(min(m,n)) bằng cách chỉ lưu 2 hàng/dòng, nhưng code phức tạp hơn.
- **Tìm LCS thực tế:** Để tìm chuỗi LCS thực tế (không chỉ độ dài), cần backtrack từ `dp[m][n]` về `dp[0][0]`.
- **Ứng dụng:** LCS được dùng trong nhiều bài toán như:
  - So sánh văn bản (diff algorithm)
  - DNA sequence alignment
  - Version control systems
- **Liên kết tới các bài liên quan:**
  - [[Longest Increasing Subsequence]] - DP với một mảng
  - [[Edit Distance]] - DP 2D với pattern tương tự
  - [[Word Break]] - DP với chuỗi

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
text1 = "abcde", text2 = "ace"

DP table:
          ""  a   c   e
    ""    0   0   0   0
    a     0   1   1   1
    b     0   1   1   1
    c     0   1   2   2
    d     0   1   2   2
    e     0   1   2   3

Output: 3
LCS: "ace"
```

**Ví dụ 2:**
```
text1 = "abc", text2 = "abc"

DP table:
          ""  a   b   c
    ""    0   0   0   0
    a     0   1   1   1
    b     0   1   2   2
    c     0   1   2   3

Output: 3
LCS: "abc"
```

**Ví dụ 3:**
```
text1 = "abc", text2 = "def"

DP table:
          ""  d   e   f
    ""    0   0   0   0
    a     0   0   0   0
    b     0   0   0   0
    c     0   0   0   0

Output: 0
Không có LCS
```
