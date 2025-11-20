---
title: House Robber
tags: [dsa, dynamic-programming, medium, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/house-robber
---

# House Robber

## 🧩 Đề bài

Bạn là một tên trộm chuyên nghiệp và đang lên kế hoạch để cướp nhà dọc theo một con phố. Mỗi ngôi nhà có một số tiền nhất định, nhưng bạn không thể cướp hai ngôi nhà liền kề trong cùng một đêm vì hệ thống báo động sẽ phát hiện.

Cho một mảng số nguyên `nums` đại diện cho số tiền ở mỗi ngôi nhà, trả về số tiền tối đa bạn có thể cướp được trong đêm này mà không bị cảnh sát phát hiện.

**Ràng buộc:**
- `1 <= nums.length <= 100`
- `0 <= nums[i] <= 400`

**Ví dụ:**
- Input: `nums = [1,2,3,1]`
- Output: `4`
- Giải thích: Cướp nhà 1 (tiền = 1) rồi cướp nhà 3 (tiền = 3). Tổng = 1 + 3 = 4.

- Input: `nums = [2,7,9,3,1]`
- Output: `12`
- Giải thích: Cướp nhà 1 (tiền = 2), nhà 3 (tiền = 9), nhà 5 (tiền = 1). Tổng = 2 + 9 + 1 = 12.

## 💡 Ý tưởng

Đây là bài toán DP kinh điển với pattern "chọn hoặc không chọn". Với mỗi ngôi nhà, ta có hai lựa chọn:
1. **Cướp nhà hiện tại:** Lấy tiền nhà này + tiền tối đa từ các nhà trước đó (không được cướp nhà liền kề trước)
2. **Không cướp nhà hiện tại:** Lấy tiền tối đa từ các nhà trước đó (bao gồm nhà liền kề trước)

Công thức DP:
- `dp[i]` = số tiền tối đa có thể cướp được từ nhà 0 đến nhà i
- `dp[i] = max(dp[i-1], dp[i-2] + nums[i])`
  - `dp[i-1]`: Không cướp nhà i (lấy kết quả tốt nhất đến nhà i-1)
  - `dp[i-2] + nums[i]`: Cướp nhà i (lấy kết quả tốt nhất đến nhà i-2 + tiền nhà i)

**Điều kiện ban đầu:**
- `dp[0] = nums[0]` (chỉ có 1 nhà)
- `dp[1] = max(nums[0], nums[1])` (chọn nhà nào có nhiều tiền hơn)

## ⚙️ Hướng tiếp cận

1. **Xử lý edge cases:**
   - Nếu chỉ có 1 nhà → trả về `nums[0]`
   - Nếu có 2 nhà → trả về `max(nums[0], nums[1])`

2. **Khởi tạo DP:**
   - `dp[0] = nums[0]`
   - `dp[1] = max(nums[0], nums[1])`

3. **Duyệt từ nhà thứ 3:**
   - Với mỗi nhà i: `dp[i] = max(dp[i-1], dp[i-2] + nums[i])`
   - `dp[i-1]`: Không cướp nhà i
   - `dp[i-2] + nums[i]`: Cướp nhà i

4. **Trả về kết quả:** `dp[n-1]` (n là số nhà)

**Tối ưu bộ nhớ:** Chỉ cần lưu 2 giá trị trước đó, không cần mảng đầy đủ.

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n) - Duyệt mảng một lần |
| Bộ nhớ | O(1) - Chỉ dùng 2 biến (với cách tối ưu) |

## 💻 Code minh họa

**Cách 1: Bottom-up DP với mảng**

```python
def rob(nums: list[int]) -> int:
    """
    Tính số tiền tối đa có thể cướp được.
    Sử dụng bottom-up DP.
    """
    n = len(nums)
    
    # Edge cases
    if n == 1:
        return nums[0]
    if n == 2:
        return max(nums[0], nums[1])
    
    # DP array
    dp = [0] * n
    dp[0] = nums[0]
    dp[1] = max(nums[0], nums[1])
    
    # Tính từ nhà thứ 3
    for i in range(2, n):
        # Chọn: cướp nhà i hoặc không cướp
        dp[i] = max(dp[i-1], dp[i-2] + nums[i])
    
    return dp[n-1]
```

**Cách 2: Space-optimized (tối ưu nhất - khuyến nghị)**

```python
def rob(nums: list[int]) -> int:
    """
    Phiên bản tối ưu bộ nhớ: chỉ dùng O(1) space.
    """
    n = len(nums)
    
    if n == 1:
        return nums[0]
    
    # Chỉ cần lưu 2 giá trị trước đó
    prev2 = nums[0]  # dp[i-2]
    prev1 = max(nums[0], nums[1])  # dp[i-1]
    
    for i in range(2, n):
        # Tính dp[i] = max(dp[i-1], dp[i-2] + nums[i])
        curr = max(prev1, prev2 + nums[i])
        prev2, prev1 = prev1, curr
    
    return prev1 if n > 1 else prev2
```

**Cách 3: Recursion + Memoization**

```python
def rob(nums: list[int]) -> int:
    """
    Sử dụng recursion với memoization.
    """
    memo = {}
    
    def dp(i):
        if i < 0:
            return 0
        if i in memo:
            return memo[i]
        # Chọn: cướp nhà i hoặc không cướp
        memo[i] = max(dp(i-1), dp(i-2) + nums[i])
        return memo[i]
    
    return dp(len(nums) - 1)
```

## 🧠 Ghi chú

- **Pattern "chọn hoặc không chọn":** Đây là pattern quan trọng trong DP. Với mỗi phần tử, ta quyết định có chọn nó hay không dựa trên kết quả tối ưu của các phần tử trước đó.
- **Tại sao `dp[i-2] + nums[i]`?** Vì nếu cướp nhà i, ta không thể cướp nhà i-1 (liền kề), nên phải lấy kết quả từ nhà i-2.
- **So sánh với Climbing Stairs:** Cả hai đều dùng pattern tương tự, nhưng House Robber có thêm giá trị (tiền) ở mỗi nhà, nên cần hàm `max()` để chọn lựa tối ưu.
- **Tối ưu bộ nhớ:** Ta chỉ cần 2 giá trị trước đó, không cần lưu toàn bộ mảng, giúp giảm từ O(n) xuống O(1).
- **Liên kết tới các bài liên quan:**
  - [[Climbing Stairs]] - Pattern tương tự (chọn 1 hoặc 2 bước)
  - [[House Robber II]] - Biến thể với mảng vòng tròn
  - [[Coin Change]] - DP với pattern chọn phần tử
  - [[Partition Equal Subset Sum]] - DP với điều kiện ràng buộc

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
nums = [1,2,3,1]

dp[0] = 1 (chỉ có nhà 0)
dp[1] = max(1, 2) = 2 (chọn nhà 1)
dp[2] = max(dp[1], dp[0] + 3) = max(2, 1+3) = max(2, 4) = 4 (chọn nhà 2)
dp[3] = max(dp[2], dp[1] + 1) = max(4, 2+1) = max(4, 3) = 4 (không chọn nhà 3)

Output: 4
Cách cướp: Nhà 0 (1) + Nhà 2 (3) = 4
```

**Ví dụ 2:**
```
nums = [2,7,9,3,1]

dp[0] = 2
dp[1] = max(2, 7) = 7
dp[2] = max(7, 2+9) = max(7, 11) = 11 (chọn nhà 2)
dp[3] = max(11, 7+3) = max(11, 10) = 11 (không chọn nhà 3)
dp[4] = max(11, 11+1) = max(11, 12) = 12 (chọn nhà 4)

Output: 12
Cách cướp: Nhà 0 (2) + Nhà 2 (9) + Nhà 4 (1) = 12
```

**Ví dụ 3:**
```
nums = [2,1,1,2]

dp[0] = 2
dp[1] = max(2, 1) = 2
dp[2] = max(2, 2+1) = max(2, 3) = 3 (chọn nhà 2)
dp[3] = max(3, 2+2) = max(3, 4) = 4 (chọn nhà 3)

Output: 4
Cách cướp: Nhà 0 (2) + Nhà 3 (2) = 4
```
