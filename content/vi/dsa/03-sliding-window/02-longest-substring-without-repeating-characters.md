---
title: Longest Substring Without Repeating Characters
tags: [dsa, sliding-window, string, hashing, medium, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/longest-substring-without-repeating-characters
---

# Longest Substring Without Repeating Characters

## 🧩 Đề bài

Cho một chuỗi `s`, tìm độ dài của chuỗi con dài nhất không chứa ký tự lặp lại.

**Ràng buộc:**
- `0 <= s.length <= 5 * 10^4`
- `s` chỉ chứa các ký tự chữ cái thường, số, ký tự đặc biệt và dấu cách

**Ví dụ:**
- Input: `s = "abcabcbb"`
- Output: `3`
- Giải thích: Chuỗi con dài nhất không có ký tự lặp lại là "abc", có độ dài 3.

- Input: `s = "bbbbb"`
- Output: `1`
- Giải thích: Chuỗi con dài nhất là "b", có độ dài 1.

- Input: `s = "pwwkew"`
- Output: `3`
- Giải thích: Chuỗi con dài nhất là "wke", có độ dài 3. Lưu ý rằng đáp án phải là một chuỗi con, "pwke" là một dãy con nhưng không phải là chuỗi con.

## 💡 Ý tưởng

Đây là bài toán **Sliding Window** kinh điển. Ta cần tìm cửa sổ (window) dài nhất không chứa ký tự lặp lại.

**Cách tiếp cận:**
1. **Dùng Hash Map/Set:** Để theo dõi các ký tự đã xuất hiện trong cửa sổ hiện tại
2. **Sliding Window:** Duyy trì cửa sổ `[left, right]` không chứa ký tự lặp lại
3. **Mở rộng cửa sổ:** Tăng `right` và thêm ký tự vào set
4. **Thu hẹp cửa sổ:** Khi gặp ký tự lặp lại, tăng `left` cho đến khi loại bỏ ký tự lặp lại

**Công thức:**
- Khi `s[right]` đã có trong set:
  - Loại bỏ `s[left]` khỏi set và tăng `left` cho đến khi `s[right]` không còn trong set
- Thêm `s[right]` vào set
- Cập nhật độ dài tối đa: `max_length = max(max_length, right - left + 1)`

## ⚙️ Hướng tiếp cận

1. **Khởi tạo:**
   - `left = 0`, `max_length = 0`
   - `char_set = set()` (hoặc `char_map = {}` để lưu vị trí)

2. **Duyệt từng ký tự với `right`:**
   - Trong khi `s[right]` đã có trong set:
     - Loại bỏ `s[left]` khỏi set
     - Tăng `left`
   - Thêm `s[right]` vào set
   - Cập nhật `max_length = max(max_length, right - left + 1)`

3. **Trả về kết quả:** `max_length`

**Tối ưu với Hash Map:**
- Thay vì dùng set và tăng `left` từng bước, ta có thể lưu vị trí cuối cùng của mỗi ký tự
- Khi gặp ký tự lặp lại, nhảy `left` trực tiếp đến vị trí sau ký tự lặp lại

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n) - Mỗi ký tự được duyệt tối đa 2 lần (left và right) |
| Bộ nhớ | O(min(n, m)) - m là số ký tự khác nhau (tối đa 26 cho chữ cái) |

## 💻 Code minh họa

**Cách 1: Sliding Window với Set (dễ hiểu)**

'''python
def lengthOfLongestSubstring(s: str) -> int:
    """
    Tìm độ dài chuỗi con dài nhất không có ký tự lặp lại.
    Sử dụng sliding window với set.
    
    Args:
        s: Chuỗi cần kiểm tra
    
    Returns:
        Độ dài chuỗi con dài nhất không có ký tự lặp lại
    """
    if not s:
        return 0
    
    char_set = set()
    left = 0
    max_length = 0
    
    for right in range(len(s)):
        # Loại bỏ ký tự lặp lại
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        
        # Thêm ký tự hiện tại
        char_set.add(s[right])
        
        # Cập nhật độ dài tối đa
        max_length = max(max_length, right - left + 1)
    
    return max_length
'''

**Cách 2: Sliding Window với Hash Map (tối ưu hơn - khuyến nghị)**

'''python
def lengthOfLongestSubstring(s: str) -> int:
    """
    Tối ưu: dùng hash map để lưu vị trí cuối cùng của mỗi ký tự.
    Giúp nhảy left trực tiếp thay vì tăng từng bước.
    """
    if not s:
        return 0
    
    char_map = {}  # Lưu vị trí cuối cùng của mỗi ký tự
    left = 0
    max_length = 0
    
    for right in range(len(s)):
        # Nếu ký tự đã xuất hiện và nằm trong cửa sổ hiện tại
        if s[right] in char_map and char_map[s[right]] >= left:
            # Nhảy left đến vị trí sau ký tự lặp lại
            left = char_map[s[right]] + 1
        
        # Cập nhật vị trí cuối cùng của ký tự
        char_map[s[right]] = right
        
        # Cập nhật độ dài tối đa
        max_length = max(max_length, right - left + 1)
    
    return max_length
'''

**Phiên bản với giải thích chi tiết:**

'''python
def lengthOfLongestSubstring(s: str) -> int:
    """
    Ví dụ với s = "abcabcbb"
    
    right=0, s[0]='a':
      char_map = {'a': 0}
      max_length = 1
    
    right=1, s[1]='b':
      char_map = {'a': 0, 'b': 1}
      max_length = 2
    
    right=2, s[2]='c':
      char_map = {'a': 0, 'b': 1, 'c': 2}
      max_length = 3
    
    right=3, s[3]='a':
      'a' đã có, vị trí 0 >= left=0 → nhảy left=1
      char_map = {'a': 3, 'b': 1, 'c': 2}
      max_length = max(3, 3-1+1) = 3
    
    right=4, s[4]='b':
      'b' đã có, vị trí 1 >= left=1 → nhảy left=2
      char_map = {'a': 3, 'b': 4, 'c': 2}
      max_length = 3
    
    ...
    
    Output: 3
    """
    char_map = {}
    left = 0
    max_length = 0
    
    for right in range(len(s)):
        if s[right] in char_map and char_map[s[right]] >= left:
            left = char_map[s[right]] + 1
        
        char_map[s[right]] = right
        max_length = max(max_length, right - left + 1)
    
    return max_length
'''

## 🧠 Ghi chú

- **Sliding Window Pattern:** Đây là pattern phổ biến khi làm việc với chuỗi/mảng - duy trì một cửa sổ và di chuyển nó.
- **Tại sao dùng Hash Map?** Giúp nhảy `left` trực tiếp thay vì tăng từng bước, giảm độ phức tạp từ O(2n) xuống O(n).
- **Điều kiện `char_map[s[right]] >= left`:** Đảm bảo ký tự lặp lại nằm trong cửa sổ hiện tại, không phải ở ngoài.
- **So sánh với Brute Force:**
  - Brute Force: O(n³) - thử tất cả chuỗi con
  - Sliding Window: O(n) - chỉ duyệt một lần
- **Edge cases:**
  - Chuỗi rỗng → 0
  - Tất cả ký tự giống nhau → 1
  - Không có ký tự lặp lại → độ dài chuỗi
- **Liên kết tới các bài liên quan:**
  - [[Longest Repeating Character Replacement]] - Sliding window với điều kiện phức tạp hơn
  - [[Minimum Window Substring]] - Sliding window với hai chuỗi
  - [[Valid Anagram]] - Kiểm tra ký tự trong chuỗi

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
s = "abcabcbb"

right=0: char_set={'a'}, left=0, length=1
right=1: char_set={'a','b'}, left=0, length=2
right=2: char_set={'a','b','c'}, left=0, length=3
right=3: 'a' lặp lại → remove 'a', left=1, char_set={'b','c','a'}, length=3
right=4: 'b' lặp lại → remove 'b', left=2, char_set={'c','a','b'}, length=3
right=5: 'c' lặp lại → remove 'c', left=3, char_set={'a','b','c'}, length=3
right=6: 'b' lặp lại → remove 'a', left=4, char_set={'b','c'}, length=3
right=7: 'b' lặp lại → remove 'b', left=5, char_set={'c'}, length=3

Output: 3
```

**Ví dụ 2:**
```
s = "bbbbb"

right=0: char_set={'b'}, left=0, length=1
right=1: 'b' lặp lại → remove 'b', left=1, char_set={'b'}, length=1
right=2: 'b' lặp lại → remove 'b', left=2, char_set={'b'}, length=1
...

Output: 1
```

**Ví dụ 3:**
```
s = "pwwkew"

right=0: char_set={'p'}, left=0, length=1
right=1: char_set={'p','w'}, left=0, length=2
right=2: 'w' lặp lại → remove 'p', left=1, char_set={'w'}, length=2
right=3: char_set={'w','k'}, left=1, length=2
right=4: char_set={'w','k','e'}, left=1, length=3
right=5: 'w' lặp lại → remove 'w', left=2, char_set={'k','e','w'}, length=3

Output: 3
```
