---
title: Product of Array Except Self
tags: [dsa, array, prefix-sum, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/product-of-array-except-self
---

# Product of Array Except Self

## 🧩 Đề bài

Cho một mảng số nguyên `nums`, trả về một mảng `answer` sao cho `answer[i]` bằng tích của tất cả các phần tử trong `nums` trừ phần tử tại vị trí `i`.

Tích của bất kỳ prefix hoặc suffix của `nums` đều được đảm bảo nằm trong phạm vi của số nguyên 32-bit.

**Ràng buộc quan trọng:**
- Bạn phải viết một thuật toán chạy trong O(n) thời gian và **không được dùng phép chia**
- Không được sử dụng thư viện chia (division operator)

**Ví dụ:**
- Input: `nums = [1,2,3,4]`
- Output: `[24,12,8,6]`
  - `answer[0] = 2 * 3 * 4 = 24`
  - `answer[1] = 1 * 3 * 4 = 12`
  - `answer[2] = 1 * 2 * 4 = 8`
  - `answer[3] = 1 * 2 * 3 = 6`

## 💡 Ý tưởng

Nếu được phép dùng phép chia, ta chỉ cần tính tích của tất cả phần tử rồi chia cho từng phần tử. Nhưng đề bài **cấm dùng phép chia**, và có thể có số 0 trong mảng (gây lỗi chia cho 0).

Giải pháp là dùng kỹ thuật **Prefix Product** và **Suffix Product**:
- **Prefix Product:** Tích của tất cả phần tử từ đầu đến trước vị trí i
- **Suffix Product:** Tích của tất cả phần tử từ sau vị trí i đến cuối
- **Kết quả:** `answer[i] = prefix[i] * suffix[i]`

Ví dụ với `nums = [1,2,3,4]`:
- `answer[1] = prefix[1] * suffix[1] = 1 * (3*4) = 12`

Ta có thể tối ưu bộ nhớ bằng cách tính prefix và suffix trong cùng một mảng, chỉ dùng O(1) bộ nhớ phụ (không tính mảng kết quả).

## ⚙️ Hướng tiếp cận

**Cách 1: Hai mảng riêng biệt (dễ hiểu)**
1. Tính mảng prefix: `prefix[i] = nums[0] * nums[1] * ... * nums[i-1]`
2. Tính mảng suffix: `suffix[i] = nums[i+1] * nums[i+2] * ... * nums[n-1]`
3. Tính kết quả: `answer[i] = prefix[i] * suffix[i]`

**Cách 2: Tối ưu bộ nhớ (O(1) extra space)**
1. Khởi tạo mảng kết quả với giá trị 1
2. Tính prefix trong mảng kết quả:
   - Duyệt từ trái sang phải, lưu tích prefix vào `answer[i]`
3. Tính suffix và nhân vào kết quả:
   - Duyệt từ phải sang trái, nhân tích suffix vào `answer[i]`

**Edge cases:**
- Mảng có số 0 → tích prefix/suffix vẫn tính được bình thường
- Mảng có một phần tử → trả về `[1]` (tích của phần tử rỗng = 1)
- Mảng có phần tử âm → xử lý bình thường

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n) - Duyệt mảng hai lần (prefix và suffix) |
| Bộ nhớ | O(1) - Chỉ dùng biến để lưu tích (không tính mảng kết quả) |

**Lưu ý:** Nếu tính mảng kết quả vào bộ nhớ, thì cần O(n) bộ nhớ, nhưng đây là yêu cầu của bài toán nên không tính vào độ phức tạp phụ.

## 💻 Code minh họa

**Cách 1: Hai mảng riêng biệt (dễ hiểu)**

```python
def productExceptSelf(nums: list[int]) -> list[int]:
    """
    Tính tích của tất cả phần tử trừ phần tử hiện tại.
    Sử dụng prefix và suffix arrays.
    
    Args:
        nums: Mảng số nguyên
    
    Returns:
        Mảng kết quả
    """
    n = len(nums)
    
    # Tính prefix product
    prefix = [1] * n
    for i in range(1, n):
        prefix[i] = prefix[i-1] * nums[i-1]
    
    # Tính suffix product
    suffix = [1] * n
    for i in range(n-2, -1, -1):
        suffix[i] = suffix[i+1] * nums[i+1]
    
    # Tính kết quả
    answer = [prefix[i] * suffix[i] for i in range(n)]
    
    return answer
```

**Cách 2: Tối ưu bộ nhớ (O(1) extra space - được khuyến nghị)**

```python
def productExceptSelf(nums: list[int]) -> list[int]:
    """
    Tối ưu bộ nhớ: chỉ dùng O(1) extra space.
    Tính prefix và suffix trong cùng một mảng kết quả.
    """
    n = len(nums)
    answer = [1] * n
    
    # Bước 1: Tính prefix product và lưu vào answer
    prefix = 1
    for i in range(n):
        answer[i] = prefix
        prefix *= nums[i]
    
    # Bước 2: Tính suffix product và nhân vào answer
    suffix = 1
    for i in range(n-1, -1, -1):
        answer[i] *= suffix
        suffix *= nums[i]
    
    return answer
```

**Giải thích chi tiết cách 2:**

```python
def productExceptSelf(nums: list[int]) -> list[int]:
    """
    Ví dụ với nums = [1, 2, 3, 4]
    """
    n = len(nums)
    answer = [1] * n  # [1, 1, 1, 1]
    
    # Bước 1: Tính prefix (từ trái sang phải)
    prefix = 1
    for i in range(n):
        answer[i] = prefix  # Lưu prefix vào answer[i]
        prefix *= nums[i]   # Cập nhật prefix cho lần lặp tiếp theo
    
    # Sau bước 1: answer = [1, 1, 2, 6]
    # answer[0] = 1 (prefix của vị trí 0, không có phần tử trước)
    # answer[1] = 1 (prefix = 1 * nums[0] = 1)
    # answer[2] = 2 (prefix = 1 * nums[0] * nums[1] = 2)
    # answer[3] = 6 (prefix = 1 * nums[0] * nums[1] * nums[2] = 6)
    
    # Bước 2: Tính suffix (từ phải sang trái) và nhân vào answer
    suffix = 1
    for i in range(n-1, -1, -1):
        answer[i] *= suffix  # Nhân suffix vào answer hiện tại
        suffix *= nums[i]    # Cập nhật suffix cho lần lặp tiếp theo
    
    # Sau bước 2: answer = [24, 12, 8, 6]
    # answer[3] *= 1 → 6 * 1 = 6 (suffix = 1, không có phần tử sau)
    # answer[2] *= 4 → 2 * 4 = 8 (suffix = 1 * nums[3] = 4)
    # answer[1] *= 12 → 1 * 12 = 12 (suffix = 4 * nums[2] = 12)
    # answer[0] *= 24 → 1 * 24 = 24 (suffix = 12 * nums[1] = 24)
    
    return answer
```

## 🧠 Ghi chú

- **Tại sao không dùng phép chia?** Đề bài yêu cầu, và có thể có số 0 trong mảng (gây lỗi chia cho 0)
- **Kỹ thuật Prefix/Suffix:** Đây là kỹ thuật quan trọng trong nhiều bài toán array, giúp tránh tính lại các giá trị đã tính
- **Tối ưu bộ nhớ:** Cách 2 chỉ dùng O(1) bộ nhớ phụ bằng cách tính prefix và suffix trong cùng mảng kết quả, đây là cách được khuyến nghị
- **Tại sao O(1) extra space?** Ta chỉ dùng biến `prefix` và `suffix`, không tạo thêm mảng nào. Mảng `answer` là yêu cầu của bài toán nên không tính vào.
- **Liên kết tới các bài liên quan:**
  - [[two-sum]] - Cũng dùng kỹ thuật duyệt mảng một lần
  - [[longest-consecutive-sequence]] - Kỹ thuật xử lý mảng hiệu quả

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
Input: nums = [1,2,3,4]

Prefix: [1, 1, 2, 6]
  - prefix[0] = 1 (không có phần tử trước)
  - prefix[1] = 1
  - prefix[2] = 1*2 = 2
  - prefix[3] = 1*2*3 = 6

Suffix: [24, 12, 4, 1]
  - suffix[0] = 2*3*4 = 24
  - suffix[1] = 3*4 = 12
  - suffix[2] = 4
  - suffix[3] = 1 (không có phần tử sau)

Answer: [1*24, 1*12, 2*4, 6*1] = [24, 12, 8, 6]

Output: [24, 12, 8, 6]
```

**Ví dụ 2:**
```
Input: nums = [-1,1,0,-3,3]

Prefix: [1, -1, -1, 0, 0]
Suffix: [0, 0, -9, 3, 1]

Answer: [0, 0, 9, 0, 0]

Output: [0, 0, 9, 0, 0]
```

**Ví dụ 3:**
```
Input: nums = [2,3,4,5]

Prefix: [1, 2, 6, 24]
Suffix: [60, 20, 5, 1]

Answer: [60, 40, 30, 24]

Output: [60, 40, 30, 24]
```
