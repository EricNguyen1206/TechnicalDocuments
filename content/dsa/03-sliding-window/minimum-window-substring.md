---
title: Minimum Window Substring
tags: [dsa, sliding-window, string, hashing, hard, "#topic/dsa"]
date: 2024-12-19
difficulty: Hard
source: neetcode
link: https://neetcode.io/problems/minimum-window-substring
---

# Minimum Window Substring

## 🧩 Đề bài

Cho hai chuỗi `s` và `t`, trả về chuỗi con nhỏ nhất của `s` sao cho mọi ký tự trong `t` (bao gồm cả trùng lặp) đều được bao gồm trong cửa sổ đó. Nếu không có chuỗi con như vậy, trả về chuỗi rỗng `""`.

**Ràng buộc:**
- `m == s.length`
- `n == t.length`
- `1 <= m, n <= 10^5`
- `s` và `t` chỉ chứa các ký tự chữ cái thường và hoa

**Ví dụ:**
- Input: `s = "ADOBECODEBANC"`, `t = "ABC"`
- Output: `"BANC"`
- Giải thích: Chuỗi con nhỏ nhất chứa tất cả ký tự trong t là "BANC".

## 💡 Ý tưởng

Đây là bài toán **Sliding Window** phức tạp. Ta cần tìm cửa sổ nhỏ nhất chứa tất cả ký tự trong `t`.

**Cách tiếp cận:**
1. Đếm tần suất ký tự trong `t` (cần tìm)
2. Dùng sliding window trên `s`:
   - Mở rộng: Tăng `right` cho đến khi cửa sổ chứa đủ tất cả ký tự trong `t`
   - Thu hẹp: Tăng `left` để tìm cửa sổ nhỏ nhất
3. Theo dõi số ký tự đã khớp với `t`

## ⚙️ Hướng tiếp cận

1. **Đếm tần suất `t`:**
   - `need = Counter(t)`
   - `need_count = len(need)`

2. **Sliding Window:**
   - `window = {}` (tần suất trong cửa sổ)
   - `have = 0` (số ký tự đã khớp)
   - `left = 0`, `min_len = float('inf')`, `min_start = 0`

3. **Duyệt với `right`:**
   - Tăng `window[s[right]]`
   - Nếu `window[s[right]] == need[s[right]]`: `have += 1`
   - Trong khi `have == need_count`:
     - Cập nhật `min_len` và `min_start`
     - Giảm `window[s[left]]`
     - Nếu `window[s[left]] < need[s[left]]`: `have -= 1`
     - Tăng `left`

4. **Trả về:** `s[min_start:min_start+min_len]` nếu tìm thấy

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(m + n) - m, n là độ dài s và t |
| Bộ nhớ | O(m + n) - Hash maps |

## 💻 Code minh họa

'''python
from collections import Counter

def minWindow(s: str, t: str) -> str:
    """
    Tìm chuỗi con nhỏ nhất chứa tất cả ký tự trong t.
    Sử dụng sliding window.
    
    Args:
        s: Chuỗi gốc
        t: Chuỗi cần tìm
    
    Returns:
        Chuỗi con nhỏ nhất, hoặc "" nếu không tìm thấy
    """
    if not s or not t or len(s) < len(t):
        return ""
    
    # Đếm tần suất ký tự trong t
    need = Counter(t)
    need_count = len(need)
    
    # Sliding window
    window = {}
    have = 0
    left = 0
    min_len = float('inf')
    min_start = 0
    
    for right in range(len(s)):
        # Thêm ký tự vào cửa sổ
        char = s[right]
        window[char] = window.get(char, 0) + 1
        
        # Kiểm tra xem đã khớp chưa
        if char in need and window[char] == need[char]:
            have += 1
        
        # Thu hẹp cửa sổ khi đã khớp đủ
        while have == need_count:
            # Cập nhật kết quả
            current_len = right - left + 1
            if current_len < min_len:
                min_len = current_len
                min_start = left
            
            # Loại bỏ ký tự ở left
            left_char = s[left]
            window[left_char] -= 1
            if left_char in need and window[left_char] < need[left_char]:
                have -= 1
            
            left += 1
    
    return s[min_start:min_start+min_len] if min_len != float('inf') else ""
'''

## 🧠 Ghi chú

- **Sliding Window với điều kiện phức tạp:** Cần đếm tần suất và theo dõi số ký tự đã khớp.
- **Liên kết:** [[Longest Substring Without Repeating Characters]], [[Longest Repeating Character Replacement]]

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
s = "ADOBECODEBANC", t = "ABC"

need = {'A':1, 'B':1, 'C':1}, need_count=3

right=0-4: window chứa A,D,O,B,E,C → have=3
  Thu hẹp: left=0-4 → "ADOBEC" (len=6)
right=5-9: window chứa O,D,E,B,A,N,C → have=3
  Thu hẹp: left=5-9 → "CODEBA" (len=6)
right=10-12: window chứa B,A,N,C → have=3
  Thu hẹp: left=10-12 → "BANC" (len=4)

Output: "BANC"
```
