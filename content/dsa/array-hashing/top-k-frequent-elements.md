---
title: Top K Frequent Elements
tags: [dsa, array, hashing, sorting, heap, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/top-k-frequent-elements
---

# Top K Frequent Elements

## 🧩 Đề bài

Cho một mảng số nguyên `nums` và một số nguyên `k`, trả về `k` phần tử xuất hiện thường xuyên nhất trong mảng. Bạn có thể trả về kết quả theo bất kỳ thứ tự nào.

**Ràng buộc:**
- `1 <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`
- `k` nằm trong khoảng `[1, số phần tử khác nhau trong mảng]`
- Đảm bảo đáp án là duy nhất (không có hai phần tử có cùng tần suất)

**Ví dụ:**
- Input: `nums = [1,1,1,2,2,3]`, `k = 2`
- Output: `[1,2]` (số 1 xuất hiện 3 lần, số 2 xuất hiện 2 lần)

## 💡 Ý tưởng

Bài toán này có thể giải bằng nhiều cách:

1. **Hash Map + Sắp xếp:** Đếm tần suất bằng hash map, sau đó sắp xếp theo tần suất và lấy k phần tử đầu. Độ phức tạp O(n log n).
2. **Hash Map + Heap:** Đếm tần suất, sau đó dùng min heap (kích thước k) để lưu k phần tử có tần suất cao nhất. Độ phức tạp O(n log k).
3. **Hash Map + Bucket Sort:** Đếm tần suất, sau đó dùng bucket sort (mỗi bucket là một tần suất). Độ phức tạp O(n) - tối ưu nhất!

Ở đây ta sẽ trình bày cách **Hash Map + Sắp xếp** vì đơn giản và dễ hiểu nhất, sau đó đề cập đến các cách khác.

## ⚙️ Hướng tiếp cận

**Cách 1: Hash Map + Sắp xếp (đơn giản nhất)**
1. Đếm tần suất: Duyệt mảng và đếm số lần xuất hiện của mỗi phần tử bằng hash map
2. Sắp xếp: Chuyển hash map thành danh sách các cặp (phần tử, tần suất) và sắp xếp theo tần suất giảm dần
3. Lấy k phần tử đầu: Trích xuất k phần tử có tần suất cao nhất

**Cách 2: Hash Map + Heap (tối ưu hơn khi k nhỏ)**
1. Đếm tần suất (giống cách 1)
2. Dùng min heap kích thước k: Duyệt qua các phần tử, nếu heap chưa đủ k phần tử hoặc phần tử hiện tại có tần suất lớn hơn phần tử nhỏ nhất trong heap, thì thay thế
3. Trả về các phần tử trong heap

**Cách 3: Hash Map + Bucket Sort (O(n) - tối ưu nhất)**
1. Đếm tần suất (giống cách 1)
2. Tạo mảng bucket: Mỗi chỉ số là tần suất, giá trị là danh sách các phần tử có tần suất đó
3. Duyệt từ bucket có tần suất cao nhất xuống thấp nhất, lấy k phần tử

**Edge cases:**
- k = 1 → trả về phần tử xuất hiện nhiều nhất
- k = số phần tử khác nhau → trả về tất cả phần tử (sắp xếp theo tần suất)
- Tất cả phần tử đều xuất hiện 1 lần → trả về k phần tử bất kỳ

## ⏱️ Độ phức tạp

| Cách tiếp cận | Thời gian | Bộ nhớ |
|---------------|-----------|--------|
| Hash Map + Sắp xếp | O(n log n) | O(n) |
| Hash Map + Heap | O(n log k) | O(n) |
| Hash Map + Bucket Sort | O(n) | O(n) |

## 💻 Code minh họa

**Cách 1: Hash Map + Sắp xếp (đơn giản nhất)**

```python
def topKFrequent(nums: list[int], k: int) -> list[int]:
    """
    Tìm k phần tử xuất hiện thường xuyên nhất.
    Sử dụng hash map và sắp xếp.
    
    Args:
        nums: Mảng số nguyên
        k: Số phần tử cần trả về
    
    Returns:
        Danh sách k phần tử có tần suất cao nhất
    """
    # Đếm tần suất
    frequency = {}
    for num in nums:
        frequency[num] = frequency.get(num, 0) + 1
    
    # Sắp xếp theo tần suất giảm dần
    sorted_items = sorted(frequency.items(), key=lambda x: x[1], reverse=True)
    
    # Lấy k phần tử đầu
    return [item[0] for item in sorted_items[:k]]
```

**Cách 2: Hash Map + Heap (tối ưu khi k nhỏ)**

```python
import heapq
from collections import Counter

def topKFrequent(nums: list[int], k: int) -> list[int]:
    """
    Sử dụng min heap để lưu k phần tử có tần suất cao nhất.
    O(n log k) thời gian.
    """
    # Đếm tần suất
    frequency = Counter(nums)
    
    # Min heap: lưu (tần suất, phần tử)
    # Heap sẽ tự động giữ k phần tử có tần suất cao nhất
    heap = []
    
    for num, freq in frequency.items():
        heapq.heappush(heap, (freq, num))
        if len(heap) > k:
            heapq.heappop(heap)  # Loại bỏ phần tử có tần suất nhỏ nhất
    
    # Trả về các phần tử (bỏ qua tần suất)
    return [num for _, num in heap]
```

**Cách 3: Hash Map + Bucket Sort (O(n) - tối ưu nhất)**

```python
from collections import Counter

def topKFrequent(nums: list[int], k: int) -> list[int]:
    """
    Sử dụng bucket sort để đạt O(n) thời gian.
    """
    # Đếm tần suất
    frequency = Counter(nums)
    
    # Tạo bucket: bucket[i] = danh sách các phần tử xuất hiện i lần
    max_freq = max(frequency.values())
    buckets = [[] for _ in range(max_freq + 1)]
    
    for num, freq in frequency.items():
        buckets[freq].append(num)
    
    # Duyệt từ tần suất cao xuống thấp, lấy k phần tử
    result = []
    for i in range(max_freq, 0, -1):
        if buckets[i]:
            result.extend(buckets[i])
            if len(result) >= k:
                return result[:k]
    
    return result
```

**Phiên bản ngắn gọn nhất (dùng Counter.most_common):**

```python
from collections import Counter

def topKFrequent(nums: list[int], k: int) -> list[int]:
    """
    Sử dụng Counter.most_common() - cách đơn giản nhất.
    """
    return [num for num, _ in Counter(nums).most_common(k)]
```

## 🧠 Ghi chú

- **Khi nào dùng cách nào?**
  - **Sắp xếp:** Đơn giản, dễ hiểu, đủ tốt cho hầu hết trường hợp
  - **Heap:** Tối ưu khi k nhỏ so với n (ví dụ: k = 5, n = 10000)
  - **Bucket Sort:** Tối ưu nhất khi tần suất tối đa không quá lớn (O(n) thời gian)
- **Tại sao dùng Hash Map?** Đếm tần suất là bước đầu tiên và quan trọng nhất, hash map cho phép làm điều này trong O(n)
- **Lưu ý về độ phức tạp:** Bucket sort có vẻ O(n) nhưng nếu tần suất tối đa rất lớn (gần bằng n), thì độ phức tạp vẫn là O(n) vì số bucket tối đa là n
- **Liên kết tới các bài liên quan:**
  - [[contains-duplicate]] - Cũng dùng hash map để đếm tần suất
  - [[valid-anagram]] - Đếm tần suất ký tự
  - [[group-anagrams]] - Nhóm dựa trên đặc điểm chung

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
Input: nums = [1,1,1,2,2,3], k = 2

Đếm tần suất:
1: 3, 2: 2, 3: 1

Sắp xếp theo tần suất giảm dần:
[(1, 3), (2, 2), (3, 1)]

Lấy k=2 phần tử đầu:
[1, 2]

Output: [1, 2]
```

**Ví dụ 2:**
```
Input: nums = [1], k = 1

Đếm tần suất:
1: 1

Output: [1]
```

**Ví dụ 3:**
```
Input: nums = [4,1,-1,2,-1,2,3], k = 2

Đếm tần suất:
-1: 2, 2: 2, 4: 1, 1: 1, 3: 1

Sắp xếp:
[(-1, 2), (2, 2), (4, 1), (1, 1), (3, 1)]

Lấy k=2 phần tử đầu:
[-1, 2]

Output: [-1, 2]
```
