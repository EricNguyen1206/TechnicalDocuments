---
title: Valid Palindrome
tags: [dsa, two-pointers, string, easy, "#topic/dsa"]
date: 2024-12-19
difficulty: Easy
source: neetcode
link: https://neetcode.io/problems/valid-palindrome
---

# Valid Palindrome

## 🧩 Đề bài

Cho một chuỗi `s`, xác định xem nó có phải là palindrome hay không sau khi chuyển tất cả chữ hoa thành chữ thường và loại bỏ tất cả các ký tự không phải chữ cái và số.

**Ràng buộc:**
- `1 <= s.length <= 2 * 10^5`
- `s` chỉ chứa các ký tự ASCII có thể in được

**Ví dụ:**
- Input: `s = "A man, a plan, a canal: Panama"`
- Output: `true`
- Giải thích: `"amanaplanacanalpanama"` là một palindrome.

- Input: `s = "race a car"`
- Output: `false`
- Giải thích: `"raceacar"` không phải là palindrome.

## 💡 Ý tưởng

Đây là bài toán **Two Pointers** kinh điển. Ta cần:
1. Làm sạch chuỗi: chỉ giữ lại chữ cái và số, chuyển thành chữ thường
2. Kiểm tra palindrome: dùng hai con trỏ từ hai đầu, so sánh từng ký tự

**Cách tiếp cận:**
- **Cách 1:** Tạo chuỗi mới đã làm sạch, sau đó kiểm tra palindrome (O(n) bộ nhớ)
- **Cách 2:** Dùng two pointers trực tiếp trên chuỗi gốc, bỏ qua các ký tự không hợp lệ (O(1) bộ nhớ - tối ưu hơn)

Cách 2 tối ưu hơn vì không cần tạo chuỗi mới.

## ⚙️ Hướng tiếp cận

**Cách 1: Tạo chuỗi mới (dễ hiểu)**

1. Làm sạch chuỗi: duyệt và chỉ giữ lại chữ cái/số, chuyển thành chữ thường
2. Dùng two pointers: `left = 0`, `right = len(cleaned) - 1`
3. So sánh từng cặp ký tự cho đến khi `left >= right`
4. Nếu tất cả đều khớp → `true`, ngược lại → `false`

**Cách 2: Two pointers trực tiếp (tối ưu - khuyến nghị)**

1. Khởi tạo: `left = 0`, `right = len(s) - 1`
2. Duyệt trong khi `left < right`:
   - Bỏ qua các ký tự không hợp lệ ở `left` (tăng `left`)
   - Bỏ qua các ký tự không hợp lệ ở `right` (giảm `right`)
   - So sánh `s[left].lower()` và `s[right].lower()`
   - Nếu khác nhau → trả về `false`
   - Tăng `left`, giảm `right`
3. Nếu duyệt hết → trả về `true`

**Edge cases:**
- Chuỗi rỗng → `true` (palindrome)
- Chỉ có ký tự đặc biệt → `true` (sau khi làm sạch là rỗng)
- Một ký tự → `true`

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n) - Duyệt chuỗi một lần |
| Bộ nhớ | O(1) - Chỉ dùng 2 biến (với cách 2) |

## 💻 Code minh họa

**Cách 1: Tạo chuỗi mới (dễ hiểu)**

'''python
def isPalindrome(s: str) -> bool:
    """
    Kiểm tra xem chuỗi có phải palindrome không.
    Tạo chuỗi mới đã làm sạch.
    
    Args:
        s: Chuỗi cần kiểm tra
    
    Returns:
        True nếu là palindrome, False nếu không
    """
    # Làm sạch chuỗi: chỉ giữ chữ cái và số, chuyển thành chữ thường
    cleaned = ''.join(char.lower() for char in s if char.isalnum())
    
    # Kiểm tra palindrome bằng two pointers
    left, right = 0, len(cleaned) - 1
    
    while left < right:
        if cleaned[left] != cleaned[right]:
            return False
        left += 1
        right -= 1
    
    return True
'''

**Cách 2: Two pointers trực tiếp (tối ưu - khuyến nghị)**

'''python
def isPalindrome(s: str) -> bool:
    """
    Phiên bản tối ưu: không tạo chuỗi mới, dùng two pointers trực tiếp.
    """
    left, right = 0, len(s) - 1
    
    while left < right:
        # Bỏ qua các ký tự không hợp lệ ở bên trái
        while left < right and not s[left].isalnum():
            left += 1
        
        # Bỏ qua các ký tự không hợp lệ ở bên phải
        while left < right and not s[right].isalnum():
            right -= 1
        
        # So sánh (chuyển thành chữ thường)
        if s[left].lower() != s[right].lower():
            return False
        
        left += 1
        right -= 1
    
    return True
'''

**Phiên bản ngắn gọn hơn:**

'''python
def isPalindrome(s: str) -> bool:
    """
    Phiên bản ngắn gọn sử dụng list comprehension.
    """
    cleaned = [char.lower() for char in s if char.isalnum()]
    return cleaned == cleaned[::-1]
'''

## 🧠 Ghi chú

- **Two Pointers Pattern:** Đây là pattern phổ biến khi làm việc với chuỗi/mảng - dùng hai con trỏ từ hai đầu để so sánh.
- **Tại sao cách 2 tối ưu hơn?** Không cần tạo chuỗi mới, tiết kiệm bộ nhớ O(1) thay vì O(n).
- **Hàm `isalnum()`:** Kiểm tra xem ký tự có phải là chữ cái hoặc số không (alphanumeric).
- **Lưu ý:** Cần chuyển thành chữ thường trước khi so sánh để xử lý trường hợp "A" và "a".
- **Edge case:** Chuỗi chỉ có ký tự đặc biệt → sau khi làm sạch là rỗng → palindrome (theo định nghĩa).
- **Liên kết tới các bài liên quan:**
  - [[Longest Palindromic Substring]] - Tìm chuỗi con palindrome dài nhất
  - [[Palindromic Substrings]] - Đếm số chuỗi con palindrome
  - [[3Sum]] - Cũng dùng two pointers

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
s = "A man, a plan, a canal: Panama"

Làm sạch: "amanaplanacanalpanama"

Two pointers:
- left=0 ('a'), right=20 ('a') → khớp
- left=1 ('m'), right=19 ('m') → khớp
- left=2 ('a'), right=18 ('a') → khớp
...
- left=10 ('c'), right=10 ('c') → khớp

Output: True
```

**Ví dụ 2:**
```
s = "race a car"

Làm sạch: "raceacar"

Two pointers:
- left=0 ('r'), right=7 ('r') → khớp
- left=1 ('a'), right=6 ('a') → khớp
- left=2 ('c'), right=5 ('c') → khớp
- left=3 ('e'), right=4 ('a') → không khớp

Output: False
```

**Ví dụ 3:**
```
s = " "

Làm sạch: "" (rỗng)

Output: True (chuỗi rỗng là palindrome)
```
