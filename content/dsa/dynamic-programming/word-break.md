---
title: Word Break
tags: [dsa, dynamic-programming, string, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/word-break
---

# Word Break

## 🧩 Đề bài

Cho một chuỗi `s` và một danh sách các từ `wordDict`, xác định xem `s` có thể được tách thành một hoặc nhiều từ trong từ điển hay không.

Lưu ý: Cùng một từ trong từ điển có thể được sử dụng nhiều lần trong quá trình tách.

**Ràng buộc:**
- `1 <= s.length <= 300`
- `1 <= wordDict.length <= 1000`
- `1 <= wordDict[i].length <= 20`
- `s` và `wordDict[i]` chỉ chứa các ký tự chữ cái thường (a-z)
- Tất cả các từ trong `wordDict` đều khác nhau

**Ví dụ:**
- Input: `s = "leetcode"`, `wordDict = ["leet","code"]`
- Output: `true`
- Giải thích: `"leetcode"` có thể được tách thành `"leet code"`.

- Input: `s = "applepenapple"`, `wordDict = ["apple","pen"]`
- Output: `true`
- Giải thích: `"applepenapple"` có thể được tách thành `"apple pen apple"`.

- Input: `s = "catsandog"`, `wordDict = ["cats","dog","sand","and","cat"]`
- Output: `false`

## 💡 Ý tưởng

Đây là bài toán DP với chuỗi. Ta cần kiểm tra xem có thể tách chuỗi thành các từ trong từ điển hay không.

**Cách tiếp cận:**
- `dp[i]` = `true` nếu chuỗi `s[0:i]` có thể được tách thành các từ trong từ điển
- Với mỗi vị trí i, thử tất cả các từ trong từ điển:
  - Nếu `s[j:i]` (từ j đến i) là một từ trong từ điển và `dp[j] == true`:
    - Thì `dp[i] = true`

**Công thức:**
```
dp[i] = true nếu tồn tại j < i sao cho:
  - s[j:i] trong wordDict
  - dp[j] == true
```

**Điều kiện ban đầu:**
- `dp[0] = true` (chuỗi rỗng có thể tách được)

**Tối ưu:** Chuyển `wordDict` thành set để tra cứu O(1) thay vì O(n).

## ⚙️ Hướng tiếp cận

1. **Chuyển wordDict thành set:** Để tra cứu O(1)
2. **Khởi tạo DP:**
   - `dp[0] = true` (chuỗi rỗng)
   - `dp[i] = false` cho tất cả i > 0
3. **Duyệt từng vị trí i từ 1 đến len(s):**
   - Với mỗi vị trí j từ 0 đến i-1:
     - Nếu `dp[j] == true` và `s[j:i]` trong wordDict:
       - `dp[i] = true` và break (không cần kiểm tra tiếp)
4. **Trả về kết quả:** `dp[len(s)]`

**Lưu ý:** Ta có thể tối ưu bằng cách chỉ thử các từ trong wordDict thay vì tất cả vị trí j, nhưng cần kiểm tra điều kiện độ dài.

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n * m * k) - n là độ dài s, m là số từ trong wordDict, k là độ dài trung bình của từ |
| Bộ nhớ | O(n) - Mảng DP |

**Tối ưu:** Có thể giảm thời gian bằng cách chỉ thử các từ có độ dài phù hợp.

## 💻 Code minh họa

**Cách 1: DP với tất cả vị trí j (dễ hiểu)**

'''python
def wordBreak(s: str, wordDict: list[str]) -> bool:
    """
    Kiểm tra xem chuỗi s có thể tách thành các từ trong wordDict không.
    Sử dụng DP.
    
    Args:
        s: Chuỗi cần kiểm tra
        wordDict: Danh sách các từ trong từ điển
    
    Returns:
        True nếu có thể tách được, False nếu không
    """
    n = len(s)
    word_set = set(wordDict)  # Chuyển thành set để tra cứu O(1)
    
    # dp[i] = true nếu s[0:i] có thể tách được
    dp = [False] * (n + 1)
    dp[0] = True  # Chuỗi rỗng có thể tách được
    
    # Duyệt từng vị trí
    for i in range(1, n + 1):
        # Thử tất cả vị trí j trước đó
        for j in range(i):
            # Nếu s[j:i] là một từ trong từ điển và s[0:j] có thể tách được
            if dp[j] and s[j:i] in word_set:
                dp[i] = True
                break  # Đã tìm thấy, không cần kiểm tra tiếp
    
    return dp[n]
'''

**Cách 2: Tối ưu - chỉ thử các từ trong wordDict**

'''python
def wordBreak(s: str, wordDict: list[str]) -> bool:
    """
    Tối ưu: chỉ thử các từ trong wordDict thay vì tất cả vị trí.
    """
    n = len(s)
    word_set = set(wordDict)
    
    dp = [False] * (n + 1)
    dp[0] = True
    
    for i in range(1, n + 1):
        # Chỉ thử các từ trong wordDict
        for word in wordDict:
            # Kiểm tra độ dài và điều kiện
            if i >= len(word) and dp[i - len(word)]:
                if s[i - len(word):i] == word:
                    dp[i] = True
                    break
    
    return dp[n]
'''

**Cách 3: Recursion + Memoization**

'''python
def wordBreak(s: str, wordDict: list[str]) -> bool:
    """
    Sử dụng recursion với memoization (top-down).
    """
    word_set = set(wordDict)
    memo = {}
    
    def dp(i):
        # Base case: đã duyệt hết chuỗi
        if i == len(s):
            return True
        
        if i in memo:
            return memo[i]
        
        # Thử tất cả các từ trong từ điển
        for word in wordDict:
            if s[i:].startswith(word):
                if dp(i + len(word)):
                    memo[i] = True
                    return True
        
        memo[i] = False
        return False
    
    return dp(0)
'''

## 🧠 Ghi chú

- **DP với chuỗi:** Đây là pattern phổ biến khi làm việc với chuỗi - kiểm tra các prefix/substring có thể tách được không.
- **Tại sao dùng set?** Chuyển wordDict thành set giúp tra cứu O(1) thay vì O(m), giảm độ phức tạp tổng thể.
- **Tối ưu:** Cách 2 tốt hơn khi wordDict nhỏ so với độ dài chuỗi, vì chỉ thử các từ có độ dài phù hợp.
- **Edge cases:**
  - Chuỗi rỗng → `true` (theo định nghĩa)
  - Không có từ nào khớp → `false`
- **Ứng dụng:** Spell checker, text segmentation, natural language processing.
- **Liên kết tới các bài liên quan:**
  - [[Longest Common Subsequence]] - DP với chuỗi
  - [[Coin Change]] - DP với pattern tương tự (chọn phần tử)
  - [[Decode Ways]] - DP với chuỗi và điều kiện phức tạp

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
s = "leetcode", wordDict = ["leet","code"]

dp[0] = True (chuỗi rỗng)
dp[1] = False
dp[2] = False
dp[3] = False
dp[4] = True (s[0:4] = "leet" trong wordDict và dp[0] = True)
dp[5] = False
dp[6] = False
dp[7] = False
dp[8] = True (s[4:8] = "code" trong wordDict và dp[4] = True)

Output: True
Cách tách: "leet" + "code"
```

**Ví dụ 2:**
```
s = "applepenapple", wordDict = ["apple","pen"]

dp[0] = True
dp[5] = True (s[0:5] = "apple" trong wordDict)
dp[8] = True (s[5:8] = "pen" trong wordDict và dp[5] = True)
dp[13] = True (s[8:13] = "apple" trong wordDict và dp[8] = True)

Output: True
Cách tách: "apple" + "pen" + "apple"
```

**Ví dụ 3:**
```
s = "catsandog", wordDict = ["cats","dog","sand","and","cat"]

dp[0] = True
dp[3] = True (s[0:3] = "cat" trong wordDict)
dp[4] = True (s[0:4] = "cats" trong wordDict)
dp[7] = True (s[4:7] = "and" trong wordDict và dp[4] = True)
dp[9] = False (s[7:9] = "og" không trong wordDict)

Output: False
Không thể tách được
```
