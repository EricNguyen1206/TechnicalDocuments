---
title: Group Anagrams
tags: [dsa, array, hashing, string, "#topic/dsa"]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/group-anagrams
---

# Group Anagrams

## 🧩 Đề bài

Cho một mảng các chuỗi `strs`, nhóm các chuỗi là anagram của nhau lại với nhau. Bạn có thể trả về kết quả theo bất kỳ thứ tự nào.

**Anagram** là một từ hoặc cụm từ được tạo thành bằng cách sắp xếp lại các ký tự của từ/cụm từ khác, sử dụng tất cả các ký tự gốc đúng một lần.

**Ràng buộc:**
- `1 <= strs.length <= 10^4`
- `0 <= strs[i].length <= 100`
- `strs[i]` chỉ chứa các ký tự chữ cái thường (a-z)

**Ví dụ:**
- Input: `strs = ["eat","tea","tan","ate","nat","bat"]`
- Output: `[["bat"],["nat","tan"],["ate","eat","tea"]]`

## 💡 Ý tưởng

Để nhóm các anagram lại với nhau, ta cần một cách để xác định các chuỗi có cùng "chữ ký" (signature). Có hai cách chính:

1. **Sắp xếp ký tự:** Hai chuỗi là anagram nếu khi sắp xếp các ký tự, chúng giống nhau. Ví dụ: "eat" và "tea" đều trở thành "aet" khi sắp xếp.
2. **Đếm tần suất ký tự:** Tạo một chuỗi đại diện cho tần suất mỗi ký tự (ví dụ: "a2b1c3"). Các anagram sẽ có cùng chuỗi đại diện này.

Cách 1 (sắp xếp) đơn giản hơn và dễ triển khai. Ta sẽ dùng **Hash Map** với key là chuỗi đã sắp xếp, value là danh sách các chuỗi gốc có cùng chuỗi đã sắp xếp đó.

## ⚙️ Hướng tiếp cận

1. **Khởi tạo hash map:** Key là chuỗi đã sắp xếp, value là danh sách các chuỗi gốc
2. **Duyệt từng chuỗi trong mảng:**
   - Sắp xếp các ký tự của chuỗi hiện tại để tạo "chữ ký"
   - Kiểm tra xem chữ ký đã có trong hash map chưa
   - Nếu chưa có, tạo danh sách mới với chuỗi gốc
   - Nếu đã có, thêm chuỗi gốc vào danh sách hiện có
3. **Trả về kết quả:** Chuyển đổi tất cả các giá trị trong hash map thành danh sách

**Edge cases:**
- Mảng rỗng → trả về `[]`
- Tất cả chuỗi đều khác nhau → mỗi chuỗi là một nhóm riêng
- Tất cả chuỗi đều là anagram → tất cả ở cùng một nhóm

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n * k log k) - n là số chuỗi, k là độ dài trung bình của chuỗi. Sắp xếp mỗi chuỗi là O(k log k) |
| Bộ nhớ | O(n * k) - Lưu tất cả các chuỗi gốc trong hash map |

**Lưu ý:** Nếu dùng cách đếm tần suất (tạo chuỗi đại diện), độ phức tạp thời gian có thể là O(n * k) (tốt hơn nếu k lớn), nhưng cách sắp xếp đơn giản hơn và đủ tốt cho hầu hết trường hợp.

## 💻 Code minh họa

```python
def groupAnagrams(strs: list[str]) -> list[list[str]]:
    """
    Nhóm các chuỗi là anagram của nhau lại với nhau.
    
    Args:
        strs: Mảng các chuỗi
    
    Returns:
        Danh sách các nhóm anagram
    """
    # Hash map: key = chuỗi đã sắp xếp, value = danh sách chuỗi gốc
    anagram_groups = {}
    
    for s in strs:
        # Sắp xếp các ký tự để tạo "chữ ký"
        sorted_str = ''.join(sorted(s))
        
        # Thêm vào nhóm tương ứng
        if sorted_str not in anagram_groups:
            anagram_groups[sorted_str] = []
        anagram_groups[sorted_str].append(s)
    
    # Trả về danh sách các nhóm
    return list(anagram_groups.values())
```

**Phiên bản sử dụng defaultdict (ngắn gọn hơn):**

```python
from collections import defaultdict

def groupAnagrams(strs: list[str]) -> list[list[str]]:
    """
    Phiên bản dùng defaultdict - không cần kiểm tra key tồn tại.
    """
    anagram_groups = defaultdict(list)
    
    for s in strs:
        sorted_str = ''.join(sorted(s))
        anagram_groups[sorted_str].append(s)
    
    return list(anagram_groups.values())
```

**Phiên bản dùng đếm tần suất (tối ưu hơn cho chuỗi dài):**

```python
from collections import defaultdict

def groupAnagrams(strs: list[str]) -> list[list[str]]:
    """
    Dùng đếm tần suất thay vì sắp xếp.
    O(n * k) thời gian thay vì O(n * k log k).
    """
    anagram_groups = defaultdict(list)
    
    for s in strs:
        # Đếm tần suất mỗi ký tự
        count = [0] * 26  # 26 chữ cái a-z
        
        for char in s:
            count[ord(char) - ord('a')] += 1
        
        # Tạo chữ ký từ mảng đếm (chuyển thành tuple để làm key)
        signature = tuple(count)
        anagram_groups[signature].append(s)
    
    return list(anagram_groups.values())
```

## 🧠 Ghi chú

- **Tại sao sắp xếp?** Hai chuỗi là anagram nếu và chỉ nếu chuỗi đã sắp xếp của chúng giống nhau. Đây là cách đơn giản và dễ hiểu nhất.
- **So sánh với đếm tần suất:** 
  - Sắp xếp: O(k log k) nhưng đơn giản
  - Đếm tần suất: O(k) nhưng phức tạp hơn
  - Chọn cách nào tùy vào độ dài chuỗi và yêu cầu tối ưu
- **Hash Map là chìa khóa:** Cho phép nhóm các phần tử dựa trên một thuộc tính chung (chữ ký) một cách hiệu quả O(1) cho mỗi tra cứu
- **Liên kết tới các bài liên quan:**
  - [[valid-anagram]] - Kiểm tra hai chuỗi có phải anagram không (dùng cùng nguyên lý)
  - [[contains-duplicate]] - Cũng dùng hash map để nhóm/tìm phần tử
  - [[top-k-frequent-elements]] - Nhóm và đếm tần suất

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
Input: strs = ["eat","tea","tan","ate","nat","bat"]

Duyệt:
- "eat" → sorted = "aet" → nhóm {"aet": ["eat"]}
- "tea" → sorted = "aet" → nhóm {"aet": ["eat", "tea"]}
- "tan" → sorted = "ant" → nhóm {"aet": [...], "ant": ["tan"]}
- "ate" → sorted = "aet" → nhóm {"aet": ["eat", "tea", "ate"]}
- "nat" → sorted = "ant" → nhóm {"ant": ["tan", "nat"]}
- "bat" → sorted = "abt" → nhóm {"abt": ["bat"]}

Output: [["eat","tea","ate"],["tan","nat"],["bat"]]
```

**Ví dụ 2:**
```
Input: strs = [""]

Duyệt:
- "" → sorted = "" → nhóm {"": [""]}

Output: [[""]]
```

**Ví dụ 3:**
```
Input: strs = ["a"]

Duyệt:
- "a" → sorted = "a" → nhóm {"a": ["a"]}

Output: [["a"]]
```
