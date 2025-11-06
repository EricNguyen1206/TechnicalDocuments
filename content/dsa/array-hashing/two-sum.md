---
title: Two Sum
tags: [dsa, array, hashing, easy, "#topic/dsa"]
date: 2024-12-19
difficulty: Easy
source: neetcode
link: https://neetcode.io/problems/two-sum
---

# Two Sum

## 🧩 Đề bài

Cho một mảng số nguyên `nums` và một số nguyên `target`, bạn cần tìm hai phần tử trong mảng sao cho tổng của chúng bằng `target`. Trả về chỉ số của hai phần tử đó.

**Ràng buộc:**
- Mỗi input có đúng một nghiệm duy nhất
- Không được sử dụng cùng một phần tử hai lần
- Có thể trả về đáp án theo bất kỳ thứ tự nào

**Ví dụ:**
- Input: `nums = [2,7,11,15]`, `target = 9`
- Output: `[0,1]` (vì `nums[0] + nums[1] = 2 + 7 = 9`)

## 💡 Ý tưởng

Thay vì duyệt hai vòng lồng nhau (O(n²)), ta có thể sử dụng **Hash Map** để lưu trữ các giá trị đã duyệt qua cùng với chỉ số của chúng. Khi duyệt từng phần tử, ta kiểm tra xem phần bù (target - số hiện tại) đã xuất hiện trong hash map chưa. Nếu có, ta đã tìm thấy đáp án!

Kỹ thuật này giúp giảm độ phức tạp thời gian từ O(n²) xuống O(n) nhờ đổi không gian lấy thời gian (space-time tradeoff).

## ⚙️ Hướng tiếp cận

1. **Khởi tạo hash map rỗng:** Dùng để lưu giá trị và chỉ số của các phần tử đã duyệt
2. **Duyệt từng phần tử trong mảng:**
   - Với mỗi phần tử `num` tại vị trí `i`, tính phần bù `diff = target - num`
   - Kiểm tra xem `diff` đã có trong hash map chưa
   - Nếu có, trả về `[hashmap[diff], i]` (đã tìm thấy đáp án)
   - Nếu chưa, lưu `num` và chỉ số `i` vào hash map để dùng cho các phần tử sau
3. **Trả về kết quả:** Nếu không tìm thấy (theo đề bài không xảy ra), trả về mảng rỗng

**Edge cases cần lưu ý:**
- Mảng có ít hơn 2 phần tử
- Tất cả các phần tử đều lớn hơn target (với số dương)
- Có phần tử trùng lặp (nhưng vẫn chỉ dùng mỗi phần tử một lần)

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n) - Duyệt mảng một lần |
| Bộ nhớ | O(n) - Hash map lưu tối đa n phần tử |

## 💻 Code minh họa

```python
def twoSum(nums: list[int], target: int) -> list[int]:
    """
    Tìm hai chỉ số trong mảng nums sao cho tổng bằng target.
    
    Args:
        nums: Mảng số nguyên
        target: Tổng cần tìm
    
    Returns:
        Mảng chứa hai chỉ số [i, j] sao cho nums[i] + nums[j] == target
    """
    hashmap = {}
    
    for i, num in enumerate(nums):
        diff = target - num
        if diff in hashmap:
            return [hashmap[diff], i]
        hashmap[num] = i
    
    return []  # Không bao giờ đến đây theo đề bài
```

## 🧠 Ghi chú

- **Ưu điểm của Hash Map:** Giúp tra cứu trong O(1) thay vì O(n), giảm tổng độ phức tạp từ O(n²) xuống O(n)
- **Lưu ý:** Ta lưu giá trị và chỉ số vào hash map, không chỉ lưu giá trị. Điều này quan trọng vì đề bài yêu cầu trả về chỉ số, không phải giá trị.
- **Cách tiếp cận khác:** Có thể dùng brute force với hai vòng lồng nhau (O(n²)), nhưng không tối ưu.
- **Liên kết tới các bài liên quan:**
  - [[contains-duplicate]] - Cũng dùng hash map để kiểm tra sự tồn tại
  - [[group-anagrams]] - Ứng dụng hash map cho nhóm đối tượng
  - [[top-k-frequent-elements]] - Hash map kết hợp với sắp xếp

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
Input: nums = [2,7,11,15], target = 9

Duyệt:
- i=0, num=2: diff=7, 7 không có trong hashmap → lưu {2:0}
- i=1, num=7: diff=2, 2 có trong hashmap → return [0,1]

Output: [0,1]
```

**Ví dụ 2:**
```
Input: nums = [3,2,4], target = 6

Duyệt:
- i=0, num=3: diff=3, 3 không có trong hashmap → lưu {3:0}
- i=1, num=2: diff=4, 4 không có trong hashmap → lưu {2:1}
- i=2, num=4: diff=2, 2 có trong hashmap → return [1,2]

Output: [1,2]
```

**Ví dụ 3:**
```
Input: nums = [3,3], target = 6

Duyệt:
- i=0, num=3: diff=3, 3 không có trong hashmap → lưu {3:0}
- i=1, num=3: diff=3, 3 có trong hashmap → return [0,1]

Output: [0,1]
```
