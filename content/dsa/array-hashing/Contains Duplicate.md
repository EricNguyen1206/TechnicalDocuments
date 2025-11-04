---
title: Contains Duplicate
tags: [dsa, array, hashing, #topic/dsa]
date: 2024-12-19
difficulty: Easy
source: neetcode
link: https://neetcode.io/problems/contains-duplicate
---

# Contains Duplicate

## 🧩 Đề bài

Cho một mảng số nguyên `nums`, kiểm tra xem mảng có chứa bất kỳ phần tử trùng lặp nào không. Nếu có phần tử xuất hiện ít nhất hai lần trong mảng, trả về `true`. Nếu tất cả các phần tử đều khác nhau, trả về `false`.

**Ràng buộc:**
- `1 <= nums.length <= 10^5`
- `-10^9 <= nums[i] <= 10^9`

**Ví dụ:**
- Input: `nums = [1,2,3,1]` → Output: `true` (vì số 1 xuất hiện 2 lần)
- Input: `nums = [1,2,3,4]` → Output: `false` (tất cả đều khác nhau)
- Input: `nums = [1,1,1,3,3,4,3,2,4,2]` → Output: `true`

## 💡 Ý tưởng

Bài toán này có thể giải bằng nhiều cách:

1. **Hash Set (tối ưu nhất):** Duyệt mảng và kiểm tra xem phần tử đã xuất hiện chưa. Nếu đã xuất hiện → trả về `true` ngay. Độ phức tạp O(n).
2. **Sắp xếp:** Sắp xếp mảng rồi kiểm tra các phần tử liền kề. Độ phức tạp O(n log n).
3. **Brute Force:** Duyệt hai vòng lồng nhau. Độ phức tạp O(n²) - không tối ưu.

Cách tốt nhất là dùng **Hash Set** vì:
- Thời gian O(n) - chỉ cần duyệt một lần
- Không cần sắp xếp (không làm thay đổi mảng gốc)
- Dễ hiểu và triển khai

## ⚙️ Hướng tiếp cận

**Sử dụng Hash Set:**
1. Khởi tạo một hash set rỗng để lưu các phần tử đã gặp
2. Duyệt từng phần tử trong mảng `nums`:
   - Nếu phần tử đã có trong set → trả về `true` ngay (tìm thấy duplicate)
   - Nếu chưa có, thêm phần tử vào set
3. Sau khi duyệt hết, nếu không tìm thấy duplicate → trả về `false`

**Lưu ý:** Ta có thể dừng ngay khi tìm thấy duplicate đầu tiên, không cần duyệt hết mảng.

**Edge cases:**
- Mảng chỉ có 1 phần tử → `false` (không có duplicate)
- Mảng rỗng → `false` (theo đề bài không xảy ra vì `nums.length >= 1`)
- Tất cả phần tử giống nhau → `true`

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n) - Duyệt mảng một lần, mỗi lần kiểm tra/insert vào set là O(1) |
| Bộ nhớ | O(n) - Hash set lưu tối đa n phần tử trong trường hợp xấu nhất (không có duplicate) |

**Lưu ý:** Trong trường hợp tốt nhất (duplicate ở vị trí đầu), độ phức tạp thời gian là O(1).

## 💻 Code minh họa

```python
def containsDuplicate(nums: list[int]) -> bool:
    """
    Kiểm tra xem mảng có chứa phần tử trùng lặp không.
    
    Args:
        nums: Mảng số nguyên
    
    Returns:
        True nếu có duplicate, False nếu không
    """
    seen = set()
    
    for num in nums:
        if num in seen:
            return True  # Tìm thấy duplicate
        seen.add(num)
    
    return False  # Không có duplicate
```

**Phiên bản ngắn gọn hơn (dùng len):**

```python
def containsDuplicate(nums: list[int]) -> bool:
    """
    So sánh độ dài của set và mảng gốc.
    Nếu khác nhau → có duplicate.
    """
    return len(set(nums)) != len(nums)
```

**Phiên bản sắp xếp (O(n log n)):**

```python
def containsDuplicate(nums: list[int]) -> bool:
    """
    Sắp xếp rồi kiểm tra các phần tử liền kề.
    Chậm hơn nhưng tiết kiệm bộ nhớ hơn.
    """
    nums.sort()
    for i in range(1, len(nums)):
        if nums[i] == nums[i-1]:
            return True
    return False
```

## 🧠 Ghi chú

- **Tại sao dùng Hash Set?** Tra cứu và thêm phần tử vào set đều là O(1) trung bình, giúp đạt O(n) thời gian
- **So sánh với sắp xếp:** Hash set nhanh hơn (O(n) vs O(n log n)) nhưng tốn bộ nhớ hơn (O(n) vs O(1) nếu không tính bộ nhớ của mảng đã sắp xếp)
- **Khi nào dùng sắp xếp?** Khi bộ nhớ hạn chế và chấp nhận chậm hơn một chút
- **Khi nào dùng hash set?** Khi cần tối ưu thời gian và có đủ bộ nhớ (đây là cách được khuyến nghị)
- **Liên kết tới các bài liên quan:**
  - [[Two Sum]] - Cũng dùng hash map/set để kiểm tra sự tồn tại
  - [[Valid Anagram]] - Kiểm tra tần suất xuất hiện
  - [[Group Anagrams]] - Nhóm các phần tử dựa trên đặc điểm chung

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
Input: nums = [1,2,3,1]

Duyệt:
- num=1: không có trong seen → thêm {1}
- num=2: không có trong seen → thêm {1,2}
- num=3: không có trong seen → thêm {1,2,3}
- num=1: đã có trong seen → return True

Output: True
```

**Ví dụ 2:**
```
Input: nums = [1,2,3,4]

Duyệt:
- num=1: không có trong seen → thêm {1}
- num=2: không có trong seen → thêm {1,2}
- num=3: không có trong seen → thêm {1,2,3}
- num=4: không có trong seen → thêm {1,2,3,4}
- Duyệt xong, không có duplicate → return False

Output: False
```

**Ví dụ 3:**
```
Input: nums = [1,1,1,3,3,4,3,2,4,2]

Duyệt:
- num=1: không có trong seen → thêm {1}
- num=1: đã có trong seen → return True (dừng ngay)

Output: True
```
