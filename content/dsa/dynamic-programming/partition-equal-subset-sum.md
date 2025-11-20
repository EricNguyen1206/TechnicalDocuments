---
title: Partition Equal Subset Sum
tags: [dsa, dynamic-programming, knapsack, medium, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/partition-equal-subset-sum
---

# Partition Equal Subset Sum

## 🧩 Đề bài

Cho một mảng số nguyên không rỗng `nums`, xác định xem mảng có thể được chia thành hai tập con sao cho tổng các phần tử trong cả hai tập con bằng nhau hay không.

**Ràng buộc:**
- `1 <= nums.length <= 200`
- `1 <= nums[i] <= 100`

**Ví dụ:**
- Input: `nums = [1,5,11,5]`
- Output: `true`
- Giải thích: Mảng có thể được chia thành `[1, 5, 5]` và `[11]`.

- Input: `nums = [1,2,3,5]`
- Output: `false`
- Giải thích: Mảng không thể được chia thành hai tập con có tổng bằng nhau.

## 💡 Ý tưởng

Đây là bài toán **0/1 Knapsack** biến thể. Nếu có thể chia thành hai tập con có tổng bằng nhau, thì:
- Tổng của mỗi tập con = `sum(nums) / 2`
- Tổng của mảng phải là số chẵn (nếu không, không thể chia đều)

**Cách tiếp cận:**
1. Tính tổng của mảng
2. Nếu tổng là số lẻ → trả về `false`
3. Tìm xem có tập con nào có tổng = `target = sum(nums) / 2` không
4. Nếu có → trả về `true`, ngược lại → `false`

**DP approach:**
- `dp[i]` = `true` nếu có thể tạo ra tổng `i` bằng các phần tử trong mảng
- Với mỗi phần tử `num`, cập nhật `dp` từ phải sang trái:
  - `dp[j] = dp[j] || dp[j - num]` (chọn hoặc không chọn num)

**Tại sao duyệt từ phải sang trái?** Để tránh dùng cùng một phần tử nhiều lần (0/1 knapsack, không phải unbounded).

## ⚙️ Hướng tiếp cận

1. **Kiểm tra điều kiện:**
   - Tính tổng của mảng
   - Nếu tổng là số lẻ → trả về `false`
   - `target = sum // 2`

2. **Khởi tạo DP:**
   - `dp[0] = True` (có thể tạo ra tổng 0)
   - `dp[i] = False` cho tất cả i > 0

3. **Duyệt từng phần tử:**
   - Với mỗi `num` trong nums:
     - Duyệt từ `target` xuống `num` (từ phải sang trái):
       - `dp[j] = dp[j] || dp[j - num]`

4. **Trả về kết quả:** `dp[target]`

**Lưu ý:** Duyệt từ phải sang trái để tránh dùng cùng một phần tử nhiều lần.

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n * target) - n là số phần tử, target = sum/2 |
| Bộ nhớ | O(target) - Mảng DP có kích thước target+1 |

## 💻 Code minh họa

```python
def canPartition(nums: list[int]) -> bool:
    """
    Kiểm tra xem mảng có thể chia thành hai tập con có tổng bằng nhau không.
    Sử dụng 0/1 Knapsack DP.
    
    Args:
        nums: Mảng số nguyên
    
    Returns:
        True nếu có thể chia được, False nếu không
    """
    total_sum = sum(nums)
    
    # Nếu tổng là số lẻ, không thể chia đều
    if total_sum % 2 != 0:
        return False
    
    target = total_sum // 2
    
    # dp[i] = true nếu có thể tạo ra tổng i
    dp = [False] * (target + 1)
    dp[0] = True  # Có thể tạo ra tổng 0
    
    # Duyệt từng phần tử
    for num in nums:
        # Duyệt từ phải sang trái để tránh dùng cùng phần tử nhiều lần
        for j in range(target, num - 1, -1):
            # Chọn num hoặc không chọn num
            dp[j] = dp[j] or dp[j - num]
    
    return dp[target]
```

**Phiên bản với giải thích chi tiết:**

```python
def canPartition(nums: list[int]) -> bool:
    """
    Ví dụ với nums = [1,5,11,5]
    total_sum = 22, target = 11
    
    dp ban đầu: [True, False, False, ..., False] (12 phần tử)
    
    num = 1:
      j=11: dp[11] = dp[11] or dp[10] = False or False = False
      j=10: dp[10] = dp[10] or dp[9] = False or False = False
      ...
      j=1: dp[1] = dp[1] or dp[0] = False or True = True
      dp = [True, True, False, ..., False]
    
    num = 5:
      j=11: dp[11] = dp[11] or dp[6] = False or False = False
      j=10: dp[10] = dp[10] or dp[5] = False or False = False
      j=5: dp[5] = dp[5] or dp[0] = False or True = True
      dp = [True, True, False, False, False, True, False, ..., False]
    
    num = 11:
      j=11: dp[11] = dp[11] or dp[0] = False or True = True
      dp[11] = True
    
    num = 5:
      j=11: dp[11] = dp[11] or dp[6] = True or False = True
      j=10: dp[10] = dp[10] or dp[5] = False or True = True
      ...
    
    Output: True
    """
    total_sum = sum(nums)
    
    if total_sum % 2 != 0:
        return False
    
    target = total_sum // 2
    dp = [False] * (target + 1)
    dp[0] = True
    
    for num in nums:
        for j in range(target, num - 1, -1):
            dp[j] = dp[j] or dp[j - num]
    
    return dp[target]
```

**Phiên bản với set (alternative approach):**

```python
def canPartition(nums: list[int]) -> bool:
    """
    Phiên bản dùng set thay vì mảng DP.
    """
    total_sum = sum(nums)
    
    if total_sum % 2 != 0:
        return False
    
    target = total_sum // 2
    possible_sums = {0}
    
    for num in nums:
        # Tạo set mới để tránh modify trong khi iterate
        new_sums = set()
        for s in possible_sums:
            new_sum = s + num
            if new_sum == target:
                return True
            if new_sum < target:
                new_sums.add(new_sum)
        possible_sums.update(new_sums)
    
    return False
```

## 🧠 Ghi chú

- **0/1 Knapsack:** Đây là bài toán 0/1 knapsack - mỗi phần tử chỉ được dùng một lần. Khác với unbounded knapsack (Coin Change) có thể dùng nhiều lần.
- **Tại sao duyệt từ phải sang trái?** Để tránh dùng cùng một phần tử nhiều lần. Nếu duyệt từ trái sang phải, ta có thể dùng cùng một phần tử nhiều lần (unbounded).
- **Tối ưu:** Có thể dừng sớm nếu `dp[target] == True` trước khi duyệt hết.
- **So sánh với Coin Change:**
  - Coin Change: Unbounded (dùng nhiều lần) → duyệt từ trái sang phải
  - Partition: 0/1 (dùng một lần) → duyệt từ phải sang trái
- **Edge cases:**
  - Tổng là số lẻ → `false`
  - Tổng = 0 → `true` (cả hai tập rỗng)
  - Một phần tử lớn hơn target → `false`
- **Liên kết tới các bài liên quan:**
  - [[Coin Change]] - Unbounded knapsack (dùng nhiều lần)
  - [[Target Sum]] - Biến thể với dấu +/-
  - [[House Robber]] - DP với pattern chọn/không chọn

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
nums = [1,5,11,5]
total_sum = 22, target = 11

DP process:
- num = 1: dp[1] = True
- num = 5: dp[5] = True, dp[6] = True (1+5)
- num = 11: dp[11] = True (11)
- num = 5: dp[10] = True (5+5), dp[11] = True (đã có)

Output: True
Cách chia: [1,5,5] và [11]
```

**Ví dụ 2:**
```
nums = [1,2,3,5]
total_sum = 11, target = 5.5 (không phải số nguyên)

Output: False (tổng lẻ)
```

**Ví dụ 3:**
```
nums = [1,2,5]
total_sum = 8, target = 4

DP process:
- num = 1: dp[1] = True
- num = 2: dp[2] = True, dp[3] = True
- num = 5: Không thể tạo ra 4 (vì 5 > 4)

Output: False
```
