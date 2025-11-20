---
title: Container With Most Water
tags: [dsa, two-pointers, array, greedy, medium, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/container-with-most-water
---

# Container With Most Water

## 🧩 Đề bài

Cho một mảng số nguyên `height` có độ dài `n`. Có `n` đường thẳng đứng được vẽ sao cho hai điểm cuối của đường thẳng thứ `i` là `(i, 0)` và `(i, height[i])`.

Tìm hai đường thẳng cùng với trục x tạo thành một container sao cho container chứa được nhiều nước nhất.

Trả về lượng nước tối đa mà container có thể chứa.

**Lưu ý:** Bạn không thể nghiêng container.

**Ràng buộc:**
- `n == height.length`
- `2 <= n <= 10^5`
- `0 <= height[i] <= 10^4`

**Ví dụ:**
- Input: `height = [1,8,6,2,5,4,8,3,7]`
- Output: `49`
- Giải thích: Container được tạo bởi các đường thẳng tại vị trí 1 và 8 (height[1]=8, height[8]=7). Diện tích = min(8,7) * (8-1) = 7 * 7 = 49.

## 💡 Ý tưởng

Đây là bài toán **Two Pointers** với **Greedy**. Ta cần tìm hai đường thẳng tạo thành container có diện tích lớn nhất.

**Công thức diện tích:**
```
area = min(height[left], height[right]) * (right - left)
```

**Cách tiếp cận Greedy:**
1. Bắt đầu với hai con trỏ ở hai đầu: `left = 0`, `right = n-1`
2. Tính diện tích hiện tại và cập nhật diện tích tối đa
3. Di chuyển con trỏ có chiều cao nhỏ hơn (vì diện tích phụ thuộc vào chiều cao nhỏ hơn)
4. Lặp lại cho đến khi `left >= right`

**Tại sao di chuyển con trỏ nhỏ hơn?**
- Diện tích = `min(height[left], height[right]) * width`
- Nếu di chuyển con trỏ lớn hơn, width giảm nhưng min height không tăng → diện tích chắc chắn giảm
- Nếu di chuyển con trỏ nhỏ hơn, width giảm nhưng có thể min height tăng → có cơ hội diện tích tăng

## ⚙️ Hướng tiếp cận

1. **Khởi tạo:**
   - `left = 0`, `right = len(height) - 1`
   - `max_area = 0`

2. **Duyệt trong khi `left < right`:**
   - Tính diện tích: `area = min(height[left], height[right]) * (right - left)`
   - Cập nhật `max_area = max(max_area, area)`
   - Di chuyển con trỏ có chiều cao nhỏ hơn:
     - Nếu `height[left] < height[right]`: `left += 1`
     - Ngược lại: `right -= 1`

3. **Trả về kết quả:** `max_area`

**Edge cases:**
- Mảng chỉ có 2 phần tử → tính diện tích trực tiếp
- Tất cả chiều cao bằng nhau → diện tích tối đa ở hai đầu

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n) - Duyệt mảng một lần |
| Bộ nhớ | O(1) - Chỉ dùng 2 biến |

## 💻 Code minh họa

'''python
def maxArea(height: list[int]) -> int:
    """
    Tìm diện tích container lớn nhất.
    Sử dụng two pointers + greedy.
    
    Args:
        height: Mảng chiều cao các đường thẳng
    
    Returns:
        Diện tích container lớn nhất
    """
    left, right = 0, len(height) - 1
    max_area = 0
    
    while left < right:
        # Tính diện tích hiện tại
        width = right - left
        current_area = min(height[left], height[right]) * width
        
        # Cập nhật diện tích tối đa
        max_area = max(max_area, current_area)
        
        # Di chuyển con trỏ có chiều cao nhỏ hơn
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    
    return max_area
'''

**Phiên bản với giải thích chi tiết:**

'''python
def maxArea(height: list[int]) -> int:
    """
    Ví dụ với height = [1,8,6,2,5,4,8,3,7]
    
    left=0 (h=1), right=8 (h=7):
      area = min(1,7) * 8 = 1 * 8 = 8
      max_area = 8
      Di chuyển left (vì 1 < 7)
    
    left=1 (h=8), right=8 (h=7):
      area = min(8,7) * 7 = 7 * 7 = 49
      max_area = 49
      Di chuyển right (vì 7 < 8)
    
    left=1 (h=8), right=7 (h=3):
      area = min(8,3) * 6 = 3 * 6 = 18
      max_area = 49
      Di chuyển right (vì 3 < 8)
    
    ... tiếp tục
    
    Output: 49
    """
    left, right = 0, len(height) - 1
    max_area = 0
    
    while left < right:
        width = right - left
        current_area = min(height[left], height[right]) * width
        max_area = max(max_area, current_area)
        
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    
    return max_area
'''

**Phiên bản ngắn gọn hơn:**

'''python
def maxArea(height: list[int]) -> int:
    """
    Phiên bản ngắn gọn.
    """
    left, right = 0, len(height) - 1
    max_area = 0
    
    while left < right:
        max_area = max(
            max_area,
            min(height[left], height[right]) * (right - left)
        )
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    
    return max_area
'''

## 🧠 Ghi chú

- **Greedy Algorithm:** Ta luôn chọn hành động tối ưu tại mỗi bước (di chuyển con trỏ nhỏ hơn).
- **Tại sao greedy đúng?** Vì di ch tích phụ thuộc vào chiều cao nhỏ hơn, nên việc di chuyển con trỏ lớn hơn không thể tăng diện tích.
- **Chứng minh:** Giả sử `height[left] < height[right]`. Nếu di chuyển `right`:
  - Width giảm: `(right-1) - left < right - left`
  - Min height không tăng: `min(height[left], height[right-1]) <= height[left]`
  - → Diện tích chắc chắn giảm
- **So sánh với Brute Force:** 
  - Brute Force: O(n²) - thử tất cả cặp
  - Two Pointers: O(n) - chỉ duyệt một lần
- **Pattern:** Đây là pattern "two pointers từ hai đầu" - rất phổ biến trong các bài toán tối ưu.
- **Liên kết tới các bài liên quan:**
  - [[Trapping Rain Water]] - Bài toán tương tự nhưng phức tạp hơn
  - [[3Sum]] - Cũng dùng two pointers
  - [[Valid Palindrome]] - Two pointers với chuỗi

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
height = [1,8,6,2,5,4,8,3,7]

left=0 (h=1), right=8 (h=7): area = 1*8 = 8 → move left
left=1 (h=8), right=8 (h=7): area = 7*7 = 49 → move right
left=1 (h=8), right=7 (h=3): area = 3*6 = 18 → move right
left=1 (h=8), right=6 (h=8): area = 8*5 = 40 → move left
...

max_area = 49

Output: 49
```

**Ví dụ 2:**
```
height = [1,1]

left=0 (h=1), right=1 (h=1): area = 1*1 = 1

Output: 1
```

**Ví dụ 3:**
```
height = [1,2,1]

left=0 (h=1), right=2 (h=1): area = 1*2 = 2 → move left
left=1 (h=2), right=2 (h=1): area = 1*1 = 1

max_area = 2

Output: 2
```
