---
title: Longest Consecutive Sequence
tags: [dsa, array, hashing, union-find, #topic/dsa]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/longest-consecutive-sequence
---

# Longest Consecutive Sequence

## 🧩 Đề bài

Cho một mảng số nguyên chưa sắp xếp `nums`, trả về độ dài của chuỗi số liên tiếp dài nhất (theo thứ tự tăng dần).

Bạn phải viết một thuật toán chạy trong O(n) thời gian.

**Ràng buộc:**
- `0 <= nums.length <= 10^5`
- `-10^9 <= nums[i] <= 10^9`

**Ví dụ:**
- Input: `nums = [100,4,200,1,3,2]`
- Output: `4`
- Giải thích: Chuỗi số liên tiếp dài nhất là `[1, 2, 3, 4]`. Độ dài của nó là 4.

## 💡 Ý tưởng

Có nhiều cách giải bài này:

1. **Sắp xếp (O(n log n)):** Sắp xếp mảng rồi tìm chuỗi liên tiếp dài nhất. Không đạt yêu cầu O(n).

2. **Hash Set + BFS/DFS (O(n)):** 
   - Chuyển mảng thành hash set để tra cứu O(1)
   - Với mỗi phần tử, nếu nó là **điểm bắt đầu** của một chuỗi (tức là `num-1` không có trong set), thì bắt đầu mở rộng chuỗi từ điểm đó
   - Đếm độ dài chuỗi bằng cách tăng dần cho đến khi không còn phần tử liên tiếp

**Tại sao chỉ bắt đầu từ điểm bắt đầu?**
- Nếu `num-1` có trong set, thì `num` không phải điểm bắt đầu, sẽ được xử lý khi duyệt đến `num-1`
- Điều này đảm bảo mỗi chuỗi chỉ được duyệt một lần, đạt O(n) thời gian

## ⚙️ Hướng tiếp cận

1. **Chuyển mảng thành hash set:** Để tra cứu trong O(1)
2. **Duyệt từng phần tử trong set:**
   - Kiểm tra xem phần tử có phải điểm bắt đầu không (tức là `num-1` không có trong set)
   - Nếu là điểm bắt đầu:
     - Bắt đầu đếm chuỗi từ `num`
     - Tăng dần `num` và đếm độ dài cho đến khi không còn phần tử liên tiếp trong set
     - Cập nhật độ dài chuỗi dài nhất
3. **Trả về độ dài chuỗi dài nhất**

**Edge cases:**
- Mảng rỗng → trả về 0
- Mảng chỉ có 1 phần tử → trả về 1
- Tất cả phần tử giống nhau → trả về 1
- Có nhiều chuỗi liên tiếp → trả về độ dài của chuỗi dài nhất

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n) - Mỗi phần tử chỉ được duyệt tối đa 2 lần (một lần khi kiểm tra điểm bắt đầu, một lần khi mở rộng chuỗi) |
| Bộ nhớ | O(n) - Hash set lưu tất cả phần tử |

**Lưu ý:** Mặc dù có vòng lặp lồng nhau, nhưng mỗi phần tử chỉ được truy cập tối đa 2 lần trong toàn bộ quá trình, nên tổng độ phức tạp vẫn là O(n).

## 💻 Code minh họa

```python
def longestConsecutive(nums: list[int]) -> int:
    """
    Tìm độ dài của chuỗi số liên tiếp dài nhất.
    
    Args:
        nums: Mảng số nguyên chưa sắp xếp
    
    Returns:
        Độ dài của chuỗi liên tiếp dài nhất
    """
    if not nums:
        return 0
    
    # Chuyển mảng thành set để tra cứu O(1)
    num_set = set(nums)
    max_length = 0
    
    for num in num_set:
        # Chỉ xử lý nếu num là điểm bắt đầu của chuỗi
        # (tức là num-1 không có trong set)
        if num - 1 not in num_set:
            # Bắt đầu mở rộng chuỗi từ num
            current_num = num
            current_length = 1
            
            # Mở rộng chuỗi về phía phải (tăng dần)
            while current_num + 1 in num_set:
                current_num += 1
                current_length += 1
            
            # Cập nhật độ dài chuỗi dài nhất
            max_length = max(max_length, current_length)
    
    return max_length
```

**Phiên bản tối ưu hơn (tránh duyệt lại các phần tử đã xử lý):**

```python
def longestConsecutive(nums: list[int]) -> int:
    """
    Phiên bản tối ưu: chỉ duyệt mỗi phần tử một lần.
    """
    if not nums:
        return 0
    
    num_set = set(nums)
    max_length = 0
    
    # Duyệt từng phần tử trong set
    for num in num_set:
        # Chỉ xử lý nếu là điểm bắt đầu
        if num - 1 not in num_set:
            current_length = 1
            next_num = num + 1
            
            # Mở rộng chuỗi
            while next_num in num_set:
                current_length += 1
                next_num += 1
            
            max_length = max(max_length, current_length)
    
    return max_length
```

**Giải thích chi tiết với ví dụ:**

```python
# Ví dụ: nums = [100, 4, 200, 1, 3, 2]
# num_set = {100, 4, 200, 1, 3, 2}

# Duyệt num = 100:
#   100 - 1 = 99 không có trong set → là điểm bắt đầu
#   Chuỗi: [100] → độ dài = 1
#   max_length = 1

# Duyệt num = 4:
#   4 - 1 = 3 có trong set → không phải điểm bắt đầu, bỏ qua

# Duyệt num = 200:
#   200 - 1 = 199 không có trong set → là điểm bắt đầu
#   Chuỗi: [200] → độ dài = 1
#   max_length = 1

# Duyệt num = 1:
#   1 - 1 = 0 không có trong set → là điểm bắt đầu
#   Chuỗi: [1, 2, 3, 4] → độ dài = 4
#   max_length = 4

# Duyệt num = 3:
#   3 - 1 = 2 có trong set → không phải điểm bắt đầu, bỏ qua

# Duyệt num = 2:
#   2 - 1 = 1 có trong set → không phải điểm bắt đầu, bỏ qua

# Kết quả: max_length = 4
```

## 🧠 Ghi chú

- **Tại sao chỉ xử lý điểm bắt đầu?** Để đảm bảo mỗi chuỗi chỉ được duyệt một lần. Nếu không, ta sẽ duyệt lại các phần tử đã xử lý, làm tăng độ phức tạp.
- **Chứng minh O(n):** Mỗi phần tử chỉ được truy cập tối đa 2 lần:
  - Một lần khi kiểm tra `num-1` có trong set không
  - Một lần khi mở rộng chuỗi (nếu là điểm bắt đầu)
  - Tổng: O(2n) = O(n)
- **So sánh với sắp xếp:** Sắp xếp mất O(n log n), nhưng cách này chỉ cần O(n) nhờ hash set.
- **Hash Set là chìa khóa:** Cho phép tra cứu `num-1` và `num+1` trong O(1), giúp đạt O(n) tổng thể.
- **Liên kết tới các bài liên quan:**
  - [[Contains Duplicate]] - Cũng dùng hash set để kiểm tra sự tồn tại
  - [[Two Sum]] - Dùng hash map để tra cứu nhanh
  - [[Group Anagrams]] - Nhóm các phần tử dựa trên đặc điểm chung

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
Input: nums = [100,4,200,1,3,2]

num_set = {100, 4, 200, 1, 3, 2}

Duyệt:
- num = 100: 99 không có → chuỗi [100], độ dài = 1
- num = 4: 3 có → bỏ qua
- num = 200: 199 không có → chuỗi [200], độ dài = 1
- num = 1: 0 không có → chuỗi [1,2,3,4], độ dài = 4
- num = 3: 2 có → bỏ qua
- num = 2: 1 có → bỏ qua

max_length = 4

Output: 4
```

**Ví dụ 2:**
```
Input: nums = [0,3,7,2,5,8,4,6,0,1]

num_set = {0, 3, 7, 2, 5, 8, 4, 6, 1}

Duyệt:
- num = 0: -1 không có → chuỗi [0,1,2,3,4,5,6,7,8], độ dài = 9
- Các số khác đều có số trước đó trong set → bỏ qua

Output: 9
```

**Ví dụ 3:**
```
Input: nums = []

Output: 0
```

**Ví dụ 4:**
```
Input: nums = [1]

num_set = {1}

Duyệt:
- num = 1: 0 không có → chuỗi [1], độ dài = 1

Output: 1
```
