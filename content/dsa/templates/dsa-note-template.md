---
title: {{title}}
tags: [dsa, array, hashing, "#topic/dsa"]
date: {{date}}
difficulty: {{difficulty}}
source: neetcode
link: https://neetcode.io/problems/{{slug}}
---

# {{title}}

## 🧩 Đề bài
Trình bày lại đề bài bằng lời của bạn. Bao gồm:
- Mục tiêu cần đạt được
- Ràng buộc đầu vào/đầu ra
- Dữ liệu ví dụ minh họa

## 💡 Ý tưởng
Mô tả cách bạn suy nghĩ để giải bài.  
Gợi ý các cấu trúc dữ liệu hoặc kỹ thuật áp dụng (ví dụ: Hash Map, Two Pointers, Sliding Window...).

## ⚙️ Hướng tiếp cận
Giải thích từng bước rõ ràng:
1. Cách lưu trữ dữ liệu
2. Cách duyệt hoặc xử lý
3. Các trường hợp đặc biệt (edge case)

## ⏱️ Độ phức tạp
| Loại | Giá trị |
|------|----------|
| Thời gian | O(n) |
| Bộ nhớ | O(n) |

## 💻 Code minh họa
```python
# Ví dụ: Two Sum
def twoSum(nums: list[int], target: int) -> list[int]:
    hashmap = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in hashmap:
            return [hashmap[diff], i]
        hashmap[num] = i
    return []
```

## 🧠 Ghi chú
- Giải thích các lựa chọn cấu trúc dữ liệu.  
- Nêu ưu điểm và hạn chế của phương pháp.  
- Liên kết tới các bài liên quan:
  - [[valid-anagram]]
  - [[group-anagrams]]
  - [[top-k-frequent-elements]]

## ✅ Ví dụ minh họa
**Input:**  
nums = [2,7,11,15], target = 9  
**Output:**  
[0,1]
