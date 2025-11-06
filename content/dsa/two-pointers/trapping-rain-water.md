---
title: Trapping Rain Water
tags: [dsa, two-pointers, array, stack, hard, "#topic/dsa"]
date: 2024-12-19
difficulty: Hard
source: neetcode
link: https://neetcode.io/problems/trapping-rain-water
---

# Trapping Rain Water

## 🧩 Đề bài

Cho `n` số nguyên không âm đại diện cho bản đồ độ cao trong đó chiều rộng của mỗi thanh là `1`, tính lượng nước có thể giữ lại sau khi mưa.

**Ràng buộc:**
- `n == height.length`
- `1 <= n <= 2 * 10^4`
- `0 <= height[i] <= 10^5`

**Ví dụ:**
- Input: `height = [0,1,0,2,1,0,1,3,2,1,2,1]`
- Output: `6`
- Giải thích: Lượng nước có thể giữ lại là 6 đơn vị.

- Input: `height = [4,2,0,3,2,5]`
- Output: `9`

## 💡 Ý tưởng

Đây là bài toán khó với nhiều cách tiếp cận:

**Cách 1: Two Pointers (tối ưu nhất - O(n) time, O(1) space)**
- Dùng hai con trỏ từ hai đầu
- Theo dõi chiều cao tối đa ở mỗi bên
- Tính lượng nước tại mỗi vị trí dựa trên chiều cao tối đa nhỏ hơn

**Cách 2: Stack (O(n) time, O(n) space)**
- Dùng stack để lưu các chỉ số
- Tính lượng nước khi gặp thanh cao hơn

**Cách 3: DP (O(n) time, O(n) space)**
- Tính chiều cao tối đa bên trái và bên phải cho mỗi vị trí
- Lượng nước = min(left_max, right_max) - height[i]

Ở đây ta sẽ trình bày **Two Pointers** vì tối ưu nhất.

**Công thức:**
- Tại vị trí `i`, lượng nước = `min(left_max, right_max) - height[i]`
- Nếu kết quả âm → không có nước (thanh cao hơn cả hai bên)

## ⚙️ Hướng tiếp cận

**Two Pointers:**

1. **Khởi tạo:**
   - `left = 0`, `right = len(height) - 1`
   - `left_max = 0`, `right_max = 0` (chiều cao tối đa ở mỗi bên)
   - `water = 0`

2. **Duyệt trong khi `left < right`:**
   - Nếu `height[left] < height[right]`:
     - Nếu `height[left] >= left_max`: Cập nhật `left_max`
     - Ngược lại: Thêm nước `water += left_max - height[left]`
     - Tăng `left`
   - Ngược lại:
     - Nếu `height[right] >= right_max`: Cập nhật `right_max`
     - Ngược lại: Thêm nước `water += right_max - height[right]`
     - Giảm `right`

3. **Trả về kết quả:** `water`

**Tại sao cách này đúng?**
- Ta luôn xử lý bên có chiều cao nhỏ hơn trước
- Điều này đảm bảo `min(left_max, right_max)` luôn chính xác

## ⏱️ Độ phức tạp

| Cách tiếp cận | Thời gian | Bộ nhớ |
|---------------|----------|--------|
| Two Pointers | O(n) | O(1) |
| Stack | O(n) | O(n) |
| DP | O(n) | O(n) |

## 💻 Code minh họa

**Cách 1: Two Pointers (tối ưu nhất - khuyến nghị)**

'''python
def trap(height: list[int]) -> int:
    """
    Tính lượng nước có thể giữ lại.
    Sử dụng two pointers.
    
    Args:
        height: Mảng chiều cao các thanh
    
    Returns:
        Lượng nước có thể giữ lại
    """
    if not height:
        return 0
    
    left, right = 0, len(height) - 1
    left_max, right_max = 0, 0
    water = 0
    
    while left < right:
        if height[left] < height[right]:
            # Xử lý bên trái
            if height[left] >= left_max:
                left_max = height[left]
            else:
                water += left_max - height[left]
            left += 1
        else:
            # Xử lý bên phải
            if height[right] >= right_max:
                right_max = height[right]
            else:
                water += right_max - height[right]
            right -= 1
    
    return water
'''

**Cách 2: DP (dễ hiểu hơn)**

'''python
def trap(height: list[int]) -> int:
    """
    Sử dụng DP: tính left_max và right_max cho mỗi vị trí.
    """
    if not height:
        return 0
    
    n = len(height)
    
    # Tính left_max cho mỗi vị trí
    left_max = [0] * n
    left_max[0] = height[0]
    for i in range(1, n):
        left_max[i] = max(left_max[i-1], height[i])
    
    # Tính right_max cho mỗi vị trí
    right_max = [0] * n
    right_max[n-1] = height[n-1]
    for i in range(n-2, -1, -1):
        right_max[i] = max(right_max[i+1], height[i])
    
    # Tính lượng nước
    water = 0
    for i in range(n):
        water += min(left_max[i], right_max[i]) - height[i]
    
    return water
'''

**Cách 3: Stack**

'''python
def trap(height: list[int]) -> int:
    """
    Sử dụng stack để tính lượng nước.
    """
    if not height:
        return 0
    
    stack = []
    water = 0
    
    for i in range(len(height)):
        while stack and height[i] > height[stack[-1]]:
            top = stack.pop()
            
            if not stack:
                break
            
            distance = i - stack[-1] - 1
            bounded_height = min(height[i], height[stack[-1]]) - height[top]
            water += distance * bounded_height
        
        stack.append(i)
    
    return water
'''

## 🧠 Ghi chú

- **Tại sao Two Pointers đúng?** Vì ta luôn xử lý bên có chiều cao nhỏ hơn, đảm bảo `min(left_max, right_max)` luôn chính xác.
- **So sánh các cách:**
  - **Two Pointers:** Tối ưu nhất về bộ nhớ O(1)
  - **DP:** Dễ hiểu hơn, nhưng tốn O(n) bộ nhớ
  - **Stack:** Phức tạp hơn, nhưng có thể mở rộng cho các bài toán khác
- **Pattern:** Đây là pattern "two pointers từ hai đầu" kết hợp với "theo dõi giá trị tối đa".
- **Edge cases:**
  - Mảng rỗng → 0
  - Mảng tăng dần → 0 (không có chỗ giữ nước)
  - Mảng giảm dần → 0
- **Liên kết tới các bài liên quan:**
  - [[Container With Most Water]] - Bài toán tương tự nhưng đơn giản hơn
  - [[3Sum]] - Cũng dùng two pointers
  - [[Valid Palindrome]] - Two pointers với chuỗi

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
height = [0,1,0,2,1,0,1,3,2,1,2,1]

Two Pointers:
left=0 (h=0), right=11 (h=1):
  left < right → xử lý left
  left_max = 0, water += 0-0 = 0
  left = 1

left=1 (h=1), right=11 (h=1):
  left >= right → xử lý right
  right_max = 1, water += 0
  right = 10

left=1 (h=1), right=10 (h=2):
  left < right → xử lý left
  left_max = 1, water += 0
  left = 2

left=2 (h=0), right=10 (h=2):
  left < right → xử lý left
  water += 1-0 = 1
  left = 3

...

Tổng water = 6

Output: 6
```

**Ví dụ 2:**
```
height = [4,2,0,3,2,5]

DP approach:
left_max = [4,4,4,4,4,5]
right_max = [5,5,5,5,5,5]

water tại mỗi vị trí:
i=0: min(4,5)-4 = 0
i=1: min(4,5)-2 = 2
i=2: min(4,5)-0 = 4
i=3: min(4,5)-3 = 1
i=4: min(4,5)-2 = 2
i=5: min(5,5)-5 = 0

Tổng: 0+2+4+1+2+0 = 9

Output: 9
```
