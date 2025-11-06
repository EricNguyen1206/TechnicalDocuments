---
title: Best Time to Buy and Sell Stock
tags: [dsa, dynamic-programming, array, easy, "#topic/dsa"]
date: 2024-12-19
difficulty: Easy
source: neetcode
link: https://neetcode.io/problems/best-time-to-buy-and-sell-stock
---

# Best Time to Buy and Sell Stock

## 🧩 Đề bài

Cho một mảng `prices` trong đó `prices[i]` là giá cổ phiếu vào ngày thứ `i`. Bạn muốn tối đa hóa lợi nhuận bằng cách chọn một ngày để mua và một ngày trong tương lai để bán cổ phiếu đó.

Trả về lợi nhuận tối đa bạn có thể đạt được từ giao dịch này. Nếu không thể đạt được lợi nhuận, trả về `0`.

**Ràng buộc:**
- `1 <= prices.length <= 10^5`
- `0 <= prices[i] <= 10^4`

**Ví dụ:**
- Input: `prices = [7,1,5,3,6,4]`
- Output: `5`
- Giải thích: Mua vào ngày 2 (giá = 1) và bán vào ngày 5 (giá = 6), lợi nhuận = 6-1 = 5. Lưu ý rằng việc mua vào ngày 2 và bán vào ngày 1 là không được phép vì bạn phải mua trước khi bán.

- Input: `prices = [7,6,4,3,1]`
- Output: `0`
- Giải thích: Trong trường hợp này, không có giao dịch nào mang lại lợi nhuận, vì vậy trả về 0.

## 💡 Ý tưởng

Đây là bài toán tìm chênh lệch lớn nhất giữa hai phần tử trong mảng, với điều kiện phần tử nhỏ hơn phải đứng trước phần tử lớn hơn.

**Cách tiếp cận:**
1. **Duyệt một lần:** Duyệt mảng từ trái sang phải
2. **Theo dõi giá mua nhỏ nhất:** Giữ giá mua nhỏ nhất đã gặp
3. **Tính lợi nhuận:** Với mỗi ngày, tính lợi nhuận nếu bán vào ngày đó (giá hiện tại - giá mua nhỏ nhất)
4. **Cập nhật lợi nhuận tối đa:** So sánh và lưu lợi nhuận lớn nhất

**Công thức:**
```
min_price = giá mua nhỏ nhất từ đầu đến hiện tại
max_profit = max(max_profit, prices[i] - min_price)
```

**Tại sao không cần DP?** Vì ta chỉ cần duyệt một lần và lưu 2 biến, không cần mảng DP.

## ⚙️ Hướng tiếp cận

1. **Khởi tạo:**
   - `min_price = prices[0]` (giá mua nhỏ nhất)
   - `max_profit = 0` (lợi nhuận tối đa)

2. **Duyệt từ ngày thứ 2:**
   - Với mỗi ngày i:
     - Tính lợi nhuận nếu bán vào ngày i: `profit = prices[i] - min_price`
     - Cập nhật `max_profit = max(max_profit, profit)`
     - Cập nhật `min_price = min(min_price, prices[i])`

3. **Trả về kết quả:** `max_profit`

**Edge cases:**
- Mảng chỉ có 1 phần tử → trả về 0
- Tất cả giá giảm dần → trả về 0

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n) - Duyệt mảng một lần |
| Bộ nhớ | O(1) - Chỉ dùng 2 biến |

## 💻 Code minh họa

'''python
def maxProfit(prices: list[int]) -> int:
    """
    Tìm lợi nhuận tối đa từ việc mua và bán cổ phiếu.
    
    Args:
        prices: Mảng giá cổ phiếu theo từng ngày
    
    Returns:
        Lợi nhuận tối đa
    """
    if len(prices) < 2:
        return 0
    
    # Giá mua nhỏ nhất từ đầu đến hiện tại
    min_price = prices[0]
    # Lợi nhuận tối đa
    max_profit = 0
    
    # Duyệt từ ngày thứ 2
    for i in range(1, len(prices)):
        # Tính lợi nhuận nếu bán vào ngày i
        profit = prices[i] - min_price
        
        # Cập nhật lợi nhuận tối đa
        max_profit = max(max_profit, profit)
        
        # Cập nhật giá mua nhỏ nhất
        min_price = min(min_price, prices[i])
    
    return max_profit
'''

**Phiên bản với giải thích chi tiết:**

'''python
def maxProfit(prices: list[int]) -> int:
    """
    Ví dụ với prices = [7,1,5,3,6,4]
    
    i=0: min_price=7, max_profit=0
    i=1: min_price=1 (cập nhật), max_profit=0 (1-7=-6, không tốt hơn)
    i=2: min_price=1, max_profit=4 (5-1=4)
    i=3: min_price=1, max_profit=4 (3-1=2, không tốt hơn)
    i=4: min_price=1, max_profit=5 (6-1=5)
    i=5: min_price=1, max_profit=5 (4-1=3, không tốt hơn)
    
    Output: 5
    """
    if len(prices) < 2:
        return 0
    
    min_price = prices[0]
    max_profit = 0
    
    for i in range(1, len(prices)):
        profit = prices[i] - min_price
        max_profit = max(max_profit, profit)
        min_price = min(min_price, prices[i])
    
    return max_profit
'''

**Phiên bản dùng DP (không cần thiết, nhưng để tham khảo):**

'''python
def maxProfit(prices: list[int]) -> int:
    """
    Phiên bản dùng DP (không tối ưu, chỉ để tham khảo).
    """
    n = len(prices)
    if n < 2:
        return 0
    
    # dp[i] = lợi nhuận tối đa có thể đạt được đến ngày i
    dp = [0] * n
    min_price = prices[0]
    
    for i in range(1, n):
        dp[i] = max(dp[i-1], prices[i] - min_price)
        min_price = min(min_price, prices[i])
    
    return dp[n-1]
'''

## 🧠 Ghi chú

- **Tại sao không cần DP?** Vì ta chỉ cần kết quả cuối cùng, không cần lưu toàn bộ mảng. Chỉ cần 2 biến là đủ.
- **Greedy approach:** Đây là bài toán greedy - ta luôn chọn giá mua nhỏ nhất và tính lợi nhuận tối đa có thể.
- **So sánh với các biến thể:**
  - **Bài này:** Chỉ được mua 1 lần, bán 1 lần
  - **Best Time to Buy and Sell Stock II:** Được mua/bán nhiều lần
  - **Best Time to Buy and Sell Stock with Cooldown:** Có thời gian chờ sau khi bán
- **Pattern:** Đây là pattern "tìm chênh lệch lớn nhất" với điều kiện thứ tự - phần tử nhỏ hơn phải đứng trước.
- **Liên kết tới các bài liên quan:**
  - [[Maximum Product Subarray]] - Tìm tích lớn nhất (tương tự)
  - [[House Robber]] - DP với pattern chọn/không chọn
  - [[Longest Increasing Subsequence]] - Tìm dãy tăng dài nhất

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
prices = [7,1,5,3,6,4]

Duyệt:
- Ngày 0: min_price=7, max_profit=0
- Ngày 1: min_price=1, max_profit=0 (1-7=-6)
- Ngày 2: min_price=1, max_profit=4 (5-1=4)
- Ngày 3: min_price=1, max_profit=4 (3-1=2)
- Ngày 4: min_price=1, max_profit=5 (6-1=5)
- Ngày 5: min_price=1, max_profit=5 (4-1=3)

Output: 5
Cách: Mua ngày 1 (giá=1), bán ngày 4 (giá=6)
```

**Ví dụ 2:**
```
prices = [7,6,4,3,1]

Duyệt:
- Ngày 0: min_price=7, max_profit=0
- Ngày 1: min_price=6, max_profit=0 (6-7=-1)
- Ngày 2: min_price=4, max_profit=0 (4-6=-2)
- Ngày 3: min_price=3, max_profit=0 (3-4=-1)
- Ngày 4: min_price=1, max_profit=0 (1-3=-2)

Output: 0
Không có lợi nhuận
```

**Ví dụ 3:**
```
prices = [1,2]

Duyệt:
- Ngày 0: min_price=1, max_profit=0
- Ngày 1: min_price=1, max_profit=1 (2-1=1)

Output: 1
```
