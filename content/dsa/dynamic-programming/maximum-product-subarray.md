---
title: Maximum Product Subarray
tags: [dsa, dynamic-programming, array, medium, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/maximum-product-subarray
---

# Maximum Product Subarray

## 🧩 Đề bài

Cho một mảng số nguyên `nums`, tìm tích lớn nhất của một dãy con liên tiếp (subarray) trong mảng.

**Lưu ý:** Dãy con (subarray) phải là một dãy các phần tử liên tiếp trong mảng.

**Ràng buộc:**
- `1 <= nums.length <= 2 * 10^4`
- `-10 <= nums[i] <= 10`
- Tích của bất kỳ prefix hoặc suffix của `nums` đều được đảm bảo nằm trong phạm vi của số nguyên 32-bit.

**Ví dụ:**
- Input: `nums = [2,3,-2,4]`
- Output: `6`
- Giải thích: Dãy con `[2,3]` có tích lớn nhất là 6.

- Input: `nums = [-2,0,-1]`
- Output: `0`
- Giải thích: Kết quả không thể là 2 vì `[-2,-1]` không phải là dãy con liên tiếp.

## 💡 Ý tưởng

Khác với bài "Maximum Sum Subarray" (Kadane's algorithm), bài này phức tạp hơn vì:
- Tích của hai số âm = số dương
- Tích của số dương và số âm = số âm

**Cách tiếp cận:**
Ta cần theo dõi cả **tích lớn nhất** và **tích nhỏ nhất** (số âm lớn nhất) tại mỗi vị trí:
- Nếu `nums[i] >= 0`: 
  - `max_product = max(nums[i], max_product * nums[i])`
  - `min_product = min(nums[i], min_product * nums[i])`
- Nếu `nums[i] < 0`:
  - `max_product = max(nums[i], min_product * nums[i])` (số âm * số âm = dương)
  - `min_product = min(nums[i], max_product * nums[i])`

**Tại sao cần theo dõi min_product?** Vì khi gặp số âm, tích nhỏ nhất (số âm lớn nhất) có thể trở thành tích lớn nhất sau khi nhân với số âm.

**Công thức:**
```
max_product[i] = max(nums[i], max_product[i-1] * nums[i], min_product[i-1] * nums[i])
min_product[i] = min(nums[i], max_product[i-1] * nums[i], min_product[i-1] * nums[i])
```

## ⚙️ Hướng tiếp cận

1. **Khởi tạo:**
   - `max_product = nums[0]`
   - `min_product = nums[0]`
   - `result = nums[0]`

2. **Duyệt từ phần tử thứ 2:**
   - Với mỗi phần tử `nums[i]`:
     - Nếu `nums[i] < 0`: Đổi chỗ `max_product` và `min_product` (vì số âm đảo ngược dấu)
     - Cập nhật:
       - `max_product = max(nums[i], max_product * nums[i])`
       - `min_product = min(nums[i], min_product * nums[i])`
     - Cập nhật `result = max(result, max_product)`

3. **Trả về kết quả:** `result`

**Lưu ý:** Ta có thể đổi chỗ trước hoặc tính cả ba giá trị và lấy max/min.

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n) - Duyệt mảng một lần |
| Bộ nhớ | O(1) - Chỉ dùng 3 biến |

## 💻 Code minh họa

'''python
def maxProduct(nums: list[int]) -> int:
    """
    Tìm tích lớn nhất của dãy con liên tiếp.
    Sử dụng DP với theo dõi cả max và min.
    
    Args:
        nums: Mảng số nguyên
    
    Returns:
        Tích lớn nhất của dãy con liên tiếp
    """
    if not nums:
        return 0
    
    # Theo dõi tích lớn nhất và nhỏ nhất tại vị trí hiện tại
    max_product = nums[0]
    min_product = nums[0]
    result = nums[0]
    
    # Duyệt từ phần tử thứ 2
    for i in range(1, len(nums)):
        num = nums[i]
        
        # Nếu số âm, đổi chỗ max và min (vì số âm đảo ngược dấu)
        if num < 0:
            max_product, min_product = min_product, max_product
        
        # Cập nhật max và min
        max_product = max(num, max_product * num)
        min_product = min(num, min_product * num)
        
        # Cập nhật kết quả
        result = max(result, max_product)
    
    return result
'''

**Phiên bản không đổi chỗ (tính cả 3 giá trị):**

'''python
def maxProduct(nums: list[int]) -> int:
    """
    Phiên bản tính cả 3 giá trị và lấy max/min.
    """
    if not nums:
        return 0
    
    max_product = nums[0]
    min_product = nums[0]
    result = nums[0]
    
    for i in range(1, len(nums)):
        num = nums[i]
        
        # Tính cả 3 khả năng
        candidates = [num, max_product * num, min_product * num]
        max_product = max(candidates)
        min_product = min(candidates)
        
        result = max(result, max_product)
    
    return result
'''

**Phiên bản với giải thích chi tiết:**

'''python
def maxProduct(nums: list[int]) -> int:
    """
    Ví dụ với nums = [2,3,-2,4]
    
    i=0: max_product=2, min_product=2, result=2
    i=1: num=3 (dương)
         max_product = max(3, 2*3) = 6
         min_product = min(3, 2*3) = 3
         result = max(2, 6) = 6
    i=2: num=-2 (âm) → đổi chỗ
         max_product, min_product = 3, 6
         max_product = max(-2, 3*-2) = max(-2, -6) = -2
         min_product = min(-2, 6*-2) = min(-2, -12) = -12
         result = max(6, -2) = 6
    i=3: num=4 (dương)
         max_product = max(4, -2*4) = max(4, -8) = 4
         min_product = min(4, -12*4) = min(4, -48) = -48
         result = max(6, 4) = 6
    
    Output: 6
    """
    if not nums:
        return 0
    
    max_product = nums[0]
    min_product = nums[0]
    result = nums[0]
    
    for i in range(1, len(nums)):
        num = nums[i]
        
        if num < 0:
            max_product, min_product = min_product, max_product
        
        max_product = max(num, max_product * num)
        min_product = min(num, min_product * num)
        
        result = max(result, max_product)
    
    return result
'''

## 🧠 Ghi chú

- **Tại sao cần theo dõi min_product?** Vì tích của hai số âm = số dương. Khi gặp số âm, tích nhỏ nhất (số âm lớn nhất) có thể trở thành tích lớn nhất.
- **Ví dụ:** `nums = [-2, 3, -4]`
  - Tại vị trí -2: max=3, min=-2
  - Tại vị trí 3: max=3, min=-6
  - Tại vị trí -4: max=24 (vì -6 * -4 = 24), min=-12
- **So sánh với Maximum Sum Subarray:**
  - Maximum Sum: Chỉ cần theo dõi tổng lớn nhất
  - Maximum Product: Cần theo dõi cả max và min (vì số âm)
- **Edge cases:**
  - Mảng chỉ có số âm → tích lớn nhất là tích của tất cả (nếu số phần tử chẵn) hoặc tích của tất cả trừ số nhỏ nhất (nếu số phần tử lẻ)
  - Có số 0 → reset max và min về 0 (hoặc phần tử tiếp theo)
- **Liên kết tới các bài liên quan:**
  - [[Best Time to Buy and Sell Stock]] - Tìm chênh lệch lớn nhất
  - [[House Robber]] - DP với pattern chọn/không chọn
  - [[Coin Change]] - DP với điều kiện phức tạp

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
nums = [2,3,-2,4]

i=0: max=2, min=2, result=2
i=1: max=6, min=3, result=6
i=2: num=-2 (âm) → đổi chỗ
     max=-2, min=-12, result=6
i=3: max=4, min=-48, result=6

Output: 6
Dãy con: [2,3]
```

**Ví dụ 2:**
```
nums = [-2,0,-1]

i=0: max=-2, min=-2, result=-2
i=1: num=0
     max=0, min=0, result=0
i=2: num=-1 (âm) → đổi chỗ
     max=0, min=0, result=0

Output: 0
```

**Ví dụ 3:**
```
nums = [-2,3,-4]

i=0: max=-2, min=-2, result=-2
i=1: max=3, min=-6, result=3
i=2: num=-4 (âm) → đổi chỗ
     max=24, min=-12, result=24

Output: 24
Dãy con: [-2,3,-4] hoặc [3,-4]
```
