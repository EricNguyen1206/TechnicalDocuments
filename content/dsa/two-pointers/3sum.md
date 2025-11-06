---
title: 3Sum
tags: [dsa, two-pointers, array, sorting, medium, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/3sum
---

# 3Sum

## 🧩 Đề bài

Cho một mảng số nguyên `nums`, trả về tất cả các bộ ba `[nums[i], nums[j], nums[k]]` sao cho `i != j`, `i != k`, `j != k` và `nums[i] + nums[j] + nums[k] == 0`.

Lưu ý: Tập hợp các bộ ba không được chứa các bộ ba trùng lặp.

**Ràng buộc:**
- `3 <= nums.length <= 3000`
- `-10^5 <= nums[i] <= 10^5`

**Ví dụ:**
- Input: `nums = [-1,0,1,2,-1,-4]`
- Output: `[[-1,-1,2],[-1,0,1]]`

- Input: `nums = [0,1,1]`
- Output: `[]`
- Giải thích: Không có bộ ba nào có tổng bằng 0.

## 💡 Ý tưởng

Đây là bài toán mở rộng của **Two Sum**. Ta cần tìm ba số có tổng bằng 0.

**Cách tiếp cận:**
1. **Sắp xếp mảng:** Để dễ xử lý trùng lặp và dùng two pointers
2. **Duyệt từng phần tử:** Với mỗi `nums[i]`, tìm hai số còn lại có tổng = `-nums[i]`
3. **Dùng Two Pointers:** Tương tự Two Sum, nhưng trên mảng đã sắp xếp
4. **Xử lý trùng lặp:** Bỏ qua các phần tử trùng lặp để tránh kết quả trùng

**Tại sao sắp xếp?**
- Giúp dùng two pointers hiệu quả
- Dễ xử lý trùng lặp (các phần tử giống nhau sẽ nằm cạnh nhau)
- Có thể bỏ qua các trường hợp không cần thiết sớm

**Công thức:**
- Với mỗi `i`, tìm `j` và `k` sao cho `nums[j] + nums[k] = -nums[i]`
- Dùng two pointers: `left = i+1`, `right = len(nums)-1`

## ⚙️ Hướng tiếp cận

1. **Sắp xếp mảng:** `nums.sort()`

2. **Duyệt từng phần tử i:**
   - Nếu `nums[i] > 0`: Dừng (vì mảng đã sắp xếp, không thể có tổng = 0)
   - Nếu `i > 0` và `nums[i] == nums[i-1]`: Bỏ qua (tránh trùng lặp)
   - Khởi tạo two pointers: `left = i+1`, `right = len(nums)-1`

3. **Dùng Two Pointers để tìm hai số còn lại:**
   - Trong khi `left < right`:
     - Tính tổng: `sum = nums[i] + nums[left] + nums[right]`
     - Nếu `sum == 0`: Thêm vào kết quả, tăng `left`, giảm `right`, bỏ qua trùng lặp
     - Nếu `sum < 0`: Tăng `left` (cần số lớn hơn)
     - Nếu `sum > 0`: Giảm `right` (cần số nhỏ hơn)

4. **Xử lý trùng lặp:**
   - Sau khi tìm thấy một bộ ba, bỏ qua các `nums[left]` và `nums[right]` trùng lặp

**Edge cases:**
- Mảng có ít hơn 3 phần tử → trả về `[]`
- Tất cả phần tử dương → không có kết quả
- Tất cả phần tử âm → không có kết quả

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n²) - Duyệt n phần tử, mỗi lần dùng two pointers O(n) |
| Bộ nhớ | O(1) - Không tính mảng kết quả (hoặc O(k) nếu tính, với k là số bộ ba) |

**Lưu ý:** Sắp xếp mất O(n log n), nhưng tổng thể vẫn là O(n²) vì n² > n log n.

## 💻 Code minh họa

'''python
def threeSum(nums: list[int]) -> list[list[int]]:
    """
    Tìm tất cả các bộ ba có tổng bằng 0.
    Sử dụng sắp xếp + two pointers.
    
    Args:
        nums: Mảng số nguyên
    
    Returns:
        Danh sách các bộ ba có tổng bằng 0
    """
    n = len(nums)
    if n < 3:
        return []
    
    # Sắp xếp mảng
    nums.sort()
    result = []
    
    # Duyệt từng phần tử
    for i in range(n - 2):
        # Bỏ qua nếu phần tử đầu tiên đã dương (mảng đã sắp xếp)
        if nums[i] > 0:
            break
        
        # Bỏ qua trùng lặp
        if i > 0 and nums[i] == nums[i-1]:
            continue
        
        # Two pointers
        left, right = i + 1, n - 1
        
        while left < right:
            current_sum = nums[i] + nums[left] + nums[right]
            
            if current_sum == 0:
                # Tìm thấy bộ ba
                result.append([nums[i], nums[left], nums[right]])
                
                # Bỏ qua trùng lặp ở left
                while left < right and nums[left] == nums[left + 1]:
                    left += 1
                
                # Bỏ qua trùng lặp ở right
                while left < right and nums[right] == nums[right - 1]:
                    right -= 1
                
                left += 1
                right -= 1
            
            elif current_sum < 0:
                # Cần số lớn hơn
                left += 1
            else:
                # Cần số nhỏ hơn
                right -= 1
    
    return result
'''

**Phiên bản với giải thích chi tiết:**

'''python
def threeSum(nums: list[int]) -> list[list[int]]:
    """
    Ví dụ với nums = [-1,0,1,2,-1,-4]
    Sau khi sắp xếp: [-4,-1,-1,0,1,2]
    
    i=0, nums[i]=-4:
      left=1, right=5: sum = -4 + -1 + 2 = -3 < 0 → left++
      left=2, right=5: sum = -4 + -1 + 2 = -3 < 0 → left++
      left=3, right=5: sum = -4 + 0 + 2 = -2 < 0 → left++
      left=4, right=5: sum = -4 + 1 + 2 = -1 < 0 → left++
      left=5, right=5 → break
    
    i=1, nums[i]=-1:
      left=2, right=5: sum = -1 + -1 + 2 = 0 → thêm [-1,-1,2]
      left=3, right=4: sum = -1 + 0 + 1 = 0 → thêm [-1,0,1]
      left=4, right=3 → break
    
    i=2, nums[i]=-1:
      Bỏ qua vì nums[2] == nums[1] (trùng lặp)
    
    Output: [[-1,-1,2],[-1,0,1]]
    """
    nums.sort()
    result = []
    n = len(nums)
    
    for i in range(n - 2):
        if nums[i] > 0:
            break
        if i > 0 and nums[i] == nums[i-1]:
            continue
        
        left, right = i + 1, n - 1
        
        while left < right:
            current_sum = nums[i] + nums[left] + nums[right]
            
            if current_sum == 0:
                result.append([nums[i], nums[left], nums[right]])
                while left < right and nums[left] == nums[left + 1]:
                    left += 1
                while left < right and nums[right] == nums[right - 1]:
                    right -= 1
                left += 1
                right -= 1
            elif current_sum < 0:
                left += 1
            else:
                right -= 1
    
    return result
'''

## 🧠 Ghi chú

- **Tại sao sắp xếp?** Giúp dùng two pointers hiệu quả và dễ xử lý trùng lặp.
- **Xử lý trùng lặp:** Rất quan trọng! Cần bỏ qua các phần tử trùng lặp ở cả ba vị trí (i, left, right).
- **Tối ưu:** Nếu `nums[i] > 0`, có thể dừng sớm vì mảng đã sắp xếp.
- **So sánh với Two Sum:** 
  - Two Sum: O(n) với hash map
  - 3Sum: O(n²) với two pointers (vì cần duyệt n phần tử, mỗi lần O(n))
- **Mở rộng:** Có thể giải 4Sum, 5Sum... bằng cách giảm dần số phần tử cần tìm.
- **Liên kết tới các bài liên quan:**
  - [[Two Sum]] - Bài toán cơ bản
  - [[Container With Most Water]] - Cũng dùng two pointers
  - [[Valid Palindrome]] - Two pointers với chuỗi

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
nums = [-1,0,1,2,-1,-4]
Sắp xếp: [-4,-1,-1,0,1,2]

i=0, nums[i]=-4:
  left=1, right=5: -4 + -1 + 2 = -3 < 0 → left++
  ... không tìm thấy

i=1, nums[i]=-1:
  left=2, right=5: -1 + -1 + 2 = 0 → thêm [-1,-1,2]
  left=3, right=4: -1 + 0 + 1 = 0 → thêm [-1,0,1]

i=2, nums[i]=-1:
  Bỏ qua (trùng với i=1)

Output: [[-1,-1,2],[-1,0,1]]
```

**Ví dụ 2:**
```
nums = [0,1,1]
Sắp xếp: [0,1,1]

i=0, nums[i]=0:
  left=1, right=2: 0 + 1 + 1 = 2 > 0 → right--
  left=1, right=1 → break

Output: []
```

**Ví dụ 3:**
```
nums = [0,0,0]
Sắp xếp: [0,0,0]

i=0, nums[i]=0:
  left=1, right=2: 0 + 0 + 0 = 0 → thêm [0,0,0]

Output: [[0,0,0]]
```
