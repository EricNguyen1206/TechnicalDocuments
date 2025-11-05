---
title: Coin Change
tags: [dsa, dynamic-programming, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/coin-change
---

# Coin Change

## 🧩 Đề bài

Cho một mảng các loại tiền xu `coins` và một số nguyên `amount` đại diện cho tổng số tiền cần đổi. Trả về số lượng xu nhỏ nhất để tạo ra `amount`. Nếu không thể tạo ra `amount` bằng bất kỳ tổ hợp nào của các loại tiền xu, trả về `-1`.

Giả định bạn có số lượng xu mỗi loại là vô hạn.

**Ràng buộc:**
- `1 <= coins.length <= 12`
- `1 <= coins[i] <= 2^31 - 1`
- `0 <= amount <= 10^4`

**Ví dụ:**
- Input: `coins = [1,2,5]`, `amount = 11`
- Output: `3`
- Giải thích: `11 = 5 + 5 + 1`

- Input: `coins = [2]`, `amount = 3`
- Output: `-1`
- Giải thích: Không thể tạo ra 3 bằng các xu mệnh giá 2

## 💡 Ý tưởng

Đây là bài toán DP kinh điển dạng "unbounded knapsack" - ta có thể dùng mỗi loại xu nhiều lần.

**Cách tiếp cận:**
- `dp[i]` = số xu nhỏ nhất để tạo ra số tiền `i`
- Với mỗi số tiền `i`, ta thử từng loại xu `coin`:
  - Nếu `i >= coin` và `dp[i-coin]` có thể tạo được (không phải -1)
  - Thì `dp[i] = min(dp[i], dp[i-coin] + 1)`

**Công thức:**
```
dp[i] = min(dp[i], dp[i-coin] + 1) for each coin in coins
```

**Điều kiện ban đầu:**
- `dp[0] = 0` (cần 0 xu để tạo ra 0)
- `dp[i] = float('inf')` hoặc `amount + 1` cho các giá trị khác (đánh dấu chưa tính được)

**Tại sao dùng `amount + 1`?** Vì số xu tối đa để tạo ra `amount` là `amount` (nếu dùng toàn xu 1), nên `amount + 1` là giá trị "vô cùng" để so sánh.

## ⚙️ Hướng tiếp cận

1. **Khởi tạo mảng DP:**
   - `dp[0] = 0`
   - `dp[i] = amount + 1` cho tất cả i từ 1 đến amount (đánh dấu chưa tính được)

2. **Duyệt từng số tiền từ 1 đến amount:**
   - Với mỗi số tiền `i`, thử từng loại xu `coin`
   - Nếu `i >= coin` và `dp[i-coin] != amount + 1`:
     - `dp[i] = min(dp[i], dp[i-coin] + 1)`

3. **Trả về kết quả:**
   - Nếu `dp[amount] == amount + 1` → không thể tạo được → trả về `-1`
   - Ngược lại → trả về `dp[amount]`

**Lưu ý:** Ta duyệt từng số tiền từ nhỏ đến lớn để đảm bảo khi tính `dp[i]`, ta đã có kết quả của `dp[i-coin]`.

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(amount * len(coins)) - Duyệt từng số tiền và từng loại xu |
| Bộ nhớ | O(amount) - Mảng DP có kích thước amount+1 |

## 💻 Code minh họa

'''python
def coinChange(coins: list[int], amount: int) -> int:
    """
    Tìm số xu nhỏ nhất để tạo ra amount.
    Sử dụng bottom-up DP.
    
    Args:
        coins: Mảng các loại tiền xu
        amount: Số tiền cần đổi
    
    Returns:
        Số xu nhỏ nhất, hoặc -1 nếu không thể tạo được
    """
    # Khởi tạo DP: dp[i] = số xu nhỏ nhất để tạo ra i
    # Dùng amount + 1 làm giá trị "vô cùng"
    dp = [amount + 1] * (amount + 1)
    dp[0] = 0  # Cần 0 xu để tạo ra 0
    
    # Duyệt từng số tiền từ 1 đến amount
    for i in range(1, amount + 1):
        # Thử từng loại xu
        for coin in coins:
            # Nếu số tiền hiện tại >= mệnh giá xu
            if i >= coin:
                # Cập nhật: dùng xu này + số xu để tạo ra (i-coin)
                dp[i] = min(dp[i], dp[i - coin] + 1)
    
    # Nếu không thể tạo được amount
    if dp[amount] == amount + 1:
        return -1
    
    return dp[amount]
'''

**Phiên bản với giải thích chi tiết:**

'''python
def coinChange(coins: list[int], amount: int) -> int:
    """
    Ví dụ với coins = [1,2,5], amount = 11
    """
    dp = [12] * 12  # amount + 1 = 12
    dp[0] = 0
    
    # i = 1: Thử coin 1 → dp[1] = min(12, dp[0] + 1) = 1
    # i = 2: Thử coin 1,2
    #   - coin 1: dp[2] = min(12, dp[1] + 1) = 2
    #   - coin 2: dp[2] = min(2, dp[0] + 1) = 1
    # i = 3: Thử coin 1,2
    #   - coin 1: dp[3] = min(12, dp[2] + 1) = 2
    #   - coin 2: dp[3] = min(2, dp[1] + 1) = 2
    # ...
    # i = 11: Thử coin 1,2,5
    #   - coin 1: dp[11] = min(12, dp[10] + 1)
    #   - coin 2: dp[11] = min(..., dp[9] + 1)
    #   - coin 5: dp[11] = min(..., dp[6] + 1) = 3
    
    dp = [amount + 1] * (amount + 1)
    dp[0] = 0
    
    for i in range(1, amount + 1):
        for coin in coins:
            if i >= coin:
                dp[i] = min(dp[i], dp[i - coin] + 1)
    
    return dp[amount] if dp[amount] != amount + 1 else -1
'''

**Phiên bản với recursion + memoization:**

'''python
def coinChange(coins: list[int], amount: int) -> int:
    """
    Sử dụng recursion với memoization (top-down).
    """
    memo = {}
    
    def dp(remaining):
        if remaining < 0:
            return float('inf')
        if remaining == 0:
            return 0
        if remaining in memo:
            return memo[remaining]
        
        min_coins = float('inf')
        for coin in coins:
            result = dp(remaining - coin)
            if result != float('inf'):
                min_coins = min(min_coins, result + 1)
        
        memo[remaining] = min_coins
        return min_coins
    
    result = dp(amount)
    return result if result != float('inf') else -1
'''

## 🧠 Ghi chú

- **Unbounded Knapsack:** Đây là dạng bài toán knapsack "không giới hạn" - ta có thể dùng mỗi item (xu) nhiều lần.
- **Tại sao duyệt từ nhỏ đến lớn?** Để đảm bảo khi tính `dp[i]`, ta đã có kết quả của `dp[i-coin]` (tính từ trước).
- **So sánh với bài toán có giới hạn:** Nếu mỗi loại xu chỉ dùng được 1 lần, đây là "0/1 knapsack" và cần duyệt ngược lại.
- **Tối ưu:** Có thể sắp xếp coins theo thứ tự giảm dần để tối ưu một chút, nhưng không thay đổi độ phức tạp.
- **Edge case:** Nếu `amount = 0`, trả về 0 (không cần xu nào).
- **Liên kết tới các bài liên quan:**
  - [[Partition Equal Subset Sum]] - DP với điều kiện ràng buộc
  - [[House Robber]] - DP với pattern chọn/không chọn
  - [[Longest Increasing Subsequence]] - DP với điều kiện phức tạp

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
coins = [1,2,5], amount = 11

dp[0] = 0
dp[1] = min(dp[0] + 1) = 1 (dùng 1 xu 1)
dp[2] = min(dp[1] + 1, dp[0] + 1) = min(2, 1) = 1 (dùng 1 xu 2)
dp[3] = min(dp[2] + 1, dp[1] + 1) = min(2, 2) = 2 (dùng 1 xu 2 + 1 xu 1)
dp[4] = min(dp[3] + 1, dp[2] + 1) = min(3, 2) = 2 (dùng 2 xu 2)
dp[5] = min(dp[4] + 1, dp[3] + 1, dp[0] + 1) = min(3, 3, 1) = 1 (dùng 1 xu 5)
...
dp[11] = min(dp[10] + 1, dp[9] + 1, dp[6] + 1) = min(3, 4, 3) = 3

Output: 3
Cách: 5 + 5 + 1 = 11
```

**Ví dụ 2:**
```
coins = [2], amount = 3

dp[0] = 0
dp[1] = 12 (không thể tạo được)
dp[2] = min(dp[0] + 1) = 1
dp[3] = min(dp[1] + 1) = 12 (không thể tạo được)

Output: -1
```

**Ví dụ 3:**
```
coins = [1], amount = 0

dp[0] = 0

Output: 0
```
