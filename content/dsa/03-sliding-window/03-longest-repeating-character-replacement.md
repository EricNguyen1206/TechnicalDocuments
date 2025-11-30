---
title: Longest Repeating Character Replacement
tags: [dsa, sliding-window, string, hashing, medium, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/longest-repeating-character-replacement
---

# Longest Repeating Character Replacement

## 🧩 Đề bài

Cho một chuỗi `s` và một số nguyên `k`. Bạn có thể chọn bất kỳ ký tự nào trong chuỗi và thay thế nó bằng bất kỳ ký tự chữ cái hoa nào khác tối đa `k` lần.

Trả về độ dài của chuỗi con dài nhất chứa cùng một ký tự sau khi thực hiện các thay thế trên.

**Ràng buộc:**
- `1 <= s.length <= 10^5`
- `s` chỉ chứa các ký tự chữ cái hoa
- `0 <= k <= s.length`

**Ví dụ:**
- Input: `s = "ABAB"`, `k = 2`
- Output: `4`
- Giải thích: Thay thế hai ký tự 'A' thành 'B' hoặc ngược lại.

- Input: `s = "AABABBA"`, `k = 1`
- Output: `4`
- Giải thích: Thay thế một ký tự ở giữa 'B' thành 'A' để có "AAAA".

## 💡 Ý tưởng

Đây là bài toán **Sliding Window** với điều kiện đặc biệt. Ta cần tìm cửa sổ dài nhất sao cho số ký tự cần thay thế <= k.

**Công thức:**
- Trong cửa sổ `[left, right]`:
  - Số ký tự cần thay thế = `window_size - max_frequency`
  - Nếu `window_size - max_frequency <= k`: Cửa sổ hợp lệ
  - Ngược lại: Thu hẹp cửa sổ (tăng `left`)

**Cách tiếp cận:**
1. Dùng Hash Map để đếm tần suất ký tự trong cửa sổ
2. Theo dõi `max_frequency` (tần suất ký tự xuất hiện nhiều nhất)
3. Mở rộng cửa sổ: Tăng `right`
4. Thu hẹp cửa sổ: Khi `window_size - max_frequency > k`, tăng `left`

## ⚙️ Hướng tiếp cận

1. **Khởi tạo:**
   - `char_count = {}` (đếm tần suất)
   - `left = 0`, `max_length = 0`, `max_frequency = 0`

2. **Duyệt với `right`:**
   - Tăng tần suất `s[right]`
   - Cập nhật `max_frequency = max(max_frequency, char_count[s[right]])`
   - Nếu `(right - left + 1) - max_frequency > k`:
     - Giảm tần suất `s[left]`
     - Tăng `left`
   - Cập nhật `max_length = max(max_length, right - left + 1)`

3. **Trả về kết quả:** `max_length`

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n) - Duyệt chuỗi một lần |
| Bộ nhớ | O(1) - Hash map chỉ lưu tối đa 26 ký tự |

## 💻 Code minh họa

'''python
def characterReplacement(s: str, k: int) -> int:
    """
    Tìm độ dài chuỗi con dài nhất sau khi thay thế k ký tự.
    Sử dụng sliding window.
    
    Args:
        s: Chuỗi chữ cái hoa
        k: Số lần thay thế được phép
    
    Returns:
        Độ dài chuỗi con dài nhất
    """
    char_count = {}
    left = 0
    max_length = 0
    max_frequency = 0
    
    for right in range(len(s)):
        # Tăng tần suất ký tự hiện tại
        char_count[s[right]] = char_count.get(s[right], 0) + 1
        
        # Cập nhật tần suất tối đa
        max_frequency = max(max_frequency, char_count[s[right]])
        
        # Nếu cửa sổ không hợp lệ, thu hẹp
        window_size = right - left + 1
        if window_size - max_frequency > k:
            char_count[s[left]] -= 1
            left += 1
        
        # Cập nhật độ dài tối đa
        max_length = max(max_length, right - left + 1)
    
    return max_length
'''

## 🧠 Ghi chú

- **Sliding Window với điều kiện:** Cửa sổ hợp lệ khi `window_size - max_frequency <= k`
- **Tại sao không cần cập nhật max_frequency khi thu hẹp?** Vì ta chỉ quan tâm đến max_frequency lớn nhất từ trước đến nay, không cần chính xác tại thời điểm hiện tại.
- **Liên kết:** [[Longest Substring Without Repeating Characters]], [[Minimum Window Substring]]

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
s = "ABAB", k = 2

right=0: count={'A':1}, max_freq=1, window=1, valid → max_len=1
right=1: count={'A':1,'B':1}, max_freq=1, window=2, valid → max_len=2
right=2: count={'A':2,'B':1}, max_freq=2, window=3, 3-2=1<=2 → max_len=3
right=3: count={'A':2,'B':2}, max_freq=2, window=4, 4-2=2<=2 → max_len=4

Output: 4
```
