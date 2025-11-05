---
title: Longest Increasing Subsequence
tags: [dsa, dynamic-programming, binary-search, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/longest-increasing-subsequence
---

# Longest Increasing Subsequence

## 🧩 Đề bài

Cho một mảng số nguyên `nums`, trả về độ dài của dãy con tăng dài nhất (LIS - Longest Increasing Subsequence).

**Lưu ý:** Dãy con (subsequence) không nhất thiết phải liên tiếp, nhưng phải giữ nguyên thứ tự.

**Ràng buộc:**
- `1 <= nums.length <= 2500`
- `-10^4 <= nums[i] <= 10^4`

**Ví dụ:**
- Input: `nums = [10,9,2,5,3,7,101,18]`
- Output: `4`
- Giải thích: Dãy con tăng dài nhất là `[2,3,7,18]` hoặc `[2,3,7,101]`, độ dài là 4.

- Input: `nums = [0,1,0,3,2,3]`
- Output: `4`
- Giải thích: Dãy con tăng dài nhất là `[0,1,2,3]`, độ dài là 4.

## 💡 Ý tưởng

Có hai cách tiếp cận chính:

**Cách 1: DP O(n²) - Dễ hiểu**
- `dp[i]` = độ dài LIS kết thúc tại vị trí i
- Với mỗi vị trí i, duyệt tất cả vị trí j < i:
  - Nếu `nums[j] < nums[i]`: có thể thêm nums[i] vào dãy kết thúc tại j
  - `dp[i] = max(dp[i], dp[j] + 1)`

**Cách 2: Binary Search O(n log n) - Tối ưu**
- Duyy trì một mảng `tails` trong đó `tails[i]` = phần tử nhỏ nhất kết thúc dãy có độ dài i+1
- Duyệt từng phần tử, dùng binary search để tìm vị trí chèn phù hợp

**So sánh:**
- Cách 1: Dễ hiểu, dễ triển khai, nhưng O(n²)
- Cách 2: Phức tạp hơn nhưng O(n log n) - tối ưu hơn

Ở đây ta sẽ trình bày cả hai cách.

## ⚙️ Hướng tiếp cận

**Cách 1: DP O(n²)**

1. Khởi tạo: `dp[i] = 1` cho tất cả i (mỗi phần tử là một dãy độ dài 1)
2. Duyệt từ trái sang phải:
   - Với mỗi vị trí i, duyệt tất cả vị trí j < i
   - Nếu `nums[j] < nums[i]`: `dp[i] = max(dp[i], dp[j] + 1)`
3. Trả về `max(dp)`

**Cách 2: Binary Search O(n log n)**

1. Khởi tạo mảng `tails` rỗng
2. Duyệt từng phần tử trong nums:
   - Dùng binary search để tìm vị trí `left` trong `tails` sao cho `tails[left] >= nums[i]`
   - Nếu `left == len(tails)`: thêm `nums[i]` vào cuối
   - Ngược lại: thay thế `tails[left] = nums[i]`
3. Trả về độ dài của `tails`

**Tại sao cách 2 đúng?** Ta luôn giữ phần tử nhỏ nhất để kết thúc mỗi độ dài, giúp có thể mở rộng dãy dài hơn trong tương lai.

## ⏱️ Độ phức tạp

| Cách tiếp cận | Thời gian | Bộ nhớ |
|---------------|-----------|--------|
| DP O(n²) | O(n²) | O(n) |
| Binary Search | O(n log n) | O(n) |

## 💻 Code minh họa

**Cách 1: DP O(n²) - Dễ hiểu**

'''python
def lengthOfLIS(nums: list[int]) -> int:
    """
    Tìm độ dài của dãy con tăng dài nhất.
    Sử dụng DP O(n²).
    
    Args:
        nums: Mảng số nguyên
    
    Returns:
        Độ dài của LIS
    """
    n = len(nums)
    if n == 0:
        return 0
    
    # dp[i] = độ dài LIS kết thúc tại vị trí i
    dp = [1] * n
    
    # Duyệt từng vị trí
    for i in range(1, n):
        # Duyệt tất cả vị trí trước đó
        for j in range(i):
            # Nếu có thể thêm nums[i] vào dãy kết thúc tại j
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    
    return max(dp)
'''

**Cách 2: Binary Search O(n log n) - Tối ưu (khuyến nghị)**

'''python
import bisect

def lengthOfLIS(nums: list[int]) -> int:
    """
    Tìm độ dài của dãy con tăng dài nhất.
    Sử dụng Binary Search O(n log n).
    
    Args:
        nums: Mảng số nguyên
    
    Returns:
        Độ dài của LIS
    """
    # tails[i] = phần tử nhỏ nhất kết thúc dãy có độ dài i+1
    tails = []
    
    for num in nums:
        # Tìm vị trí chèn phù hợp
        left = bisect.bisect_left(tails, num)
        
        # Nếu num lớn hơn tất cả phần tử trong tails
        if left == len(tails):
            tails.append(num)
        else:
            # Thay thế phần tử tại vị trí left bằng num (nhỏ hơn)
            tails[left] = num
    
    return len(tails)
'''

**Phiên bản tự implement binary search:**

'''python
def lengthOfLIS(nums: list[int]) -> int:
    """
    Tự implement binary search.
    """
    tails = []
    
    for num in nums:
        # Binary search để tìm vị trí chèn
        left, right = 0, len(tails)
        
        while left < right:
            mid = (left + right) // 2
            if tails[mid] < num:
                left = mid + 1
            else:
                right = mid
        
        # Chèn hoặc thay thế
        if left == len(tails):
            tails.append(num)
        else:
            tails[left] = num
    
    return len(tails)
'''

## 🧠 Ghi chú

- **Subsequence vs Subarray:** 
  - Subarray: phải liên tiếp (ví dụ: [1,2,3] từ [1,2,3,4])
  - Subsequence: không cần liên tiếp, chỉ cần giữ thứ tự (ví dụ: [1,3,4] từ [1,2,3,4])
- **Tại sao cách Binary Search đúng?** 
  - Ta luôn giữ phần tử nhỏ nhất để kết thúc mỗi độ dài
  - Điều này giúp có thể mở rộng dãy dài hơn trong tương lai
  - Ví dụ: Nếu có dãy độ dài 3 kết thúc bằng 5, và dãy độ dài 3 kết thúc bằng 3, ta chỉ cần giữ dãy kết thúc bằng 3
- **Khi nào dùng cách nào?**
  - Nếu n nhỏ (< 1000): dùng DP O(n²) - đơn giản hơn
  - Nếu n lớn: dùng Binary Search O(n log n) - tối ưu hơn
- **Lưu ý:** Mảng `tails` không phải là LIS thực tế, chỉ là độ dài của LIS. Để tìm LIS thực tế, cần thêm bước backtrack.
- **Liên kết tới các bài liên quan:**
  - [[Longest Common Subsequence]] - DP với hai mảng
  - [[Coin Change]] - DP với pattern tương tự
  - [[Unique Paths]] - DP 2D

## ✅ Ví dụ minh họa

**Ví dụ 1: DP O(n²)**
```
nums = [10,9,2,5,3,7,101,18]

dp[0] = 1 (chỉ có 10)
dp[1] = 1 (chỉ có 9, không thể thêm vào dp[0])
dp[2] = 1 (chỉ có 2)
dp[3] = max(1, dp[2] + 1) = 2 (2,5)
dp[4] = max(1, dp[2] + 1) = 2 (2,3)
dp[5] = max(1, dp[2] + 1, dp[3] + 1, dp[4] + 1) = 3 (2,3,7 hoặc 2,5,7)
dp[6] = max(1, ..., dp[5] + 1) = 4 (2,3,7,101)
dp[7] = max(1, ..., dp[5] + 1) = 4 (2,3,7,18)

Output: 4
```

**Ví dụ 2: Binary Search**
```
nums = [10,9,2,5,3,7,101,18]

num = 10: tails = [10]
num = 9: tails = [9] (thay 10 bằng 9)
num = 2: tails = [2] (thay 9 bằng 2)
num = 5: tails = [2, 5] (thêm 5)
num = 3: tails = [2, 3] (thay 5 bằng 3)
num = 7: tails = [2, 3, 7] (thêm 7)
num = 101: tails = [2, 3, 7, 101] (thêm 101)
num = 18: tails = [2, 3, 7, 18] (thay 101 bằng 18)

Output: 4
```

**Ví dụ 3:**
```
nums = [0,1,0,3,2,3]

DP:
dp[0] = 1
dp[1] = 2 (0,1)
dp[2] = 1 (0)
dp[3] = 3 (0,1,3)
dp[4] = 3 (0,1,2)
dp[5] = 4 (0,1,2,3)

Output: 4
```
