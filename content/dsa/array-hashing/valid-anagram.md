---
title: Valid Anagram
tags: [dsa, array, hashing, string, "#topic/dsa"]
date: 2024-12-19
difficulty: Easy
source: neetcode
link: https://neetcode.io/problems/valid-anagram
---

# Valid Anagram

## 🧩 Đề bài

Cho hai chuỗi `s` và `t`, kiểm tra xem `t` có phải là anagram của `s` hay không.

**Anagram** là một từ hoặc cụm từ được tạo thành bằng cách sắp xếp lại các ký tự của từ/cụm từ khác, sử dụng tất cả các ký tự gốc đúng một lần.

**Ràng buộc:**
- `s` và `t` chỉ chứa các ký tự chữ cái thường (a-z)
- Độ dài của `s` và `t` có thể khác nhau

**Ví dụ:**
- Input: `s = "anagram"`, `t = "nagaram"` → Output: `true`
- Input: `s = "rat"`, `t = "car"` → Output: `false`

## 💡 Ý tưởng

Để kiểm tra hai chuỗi có phải anagram, ta cần đảm bảo:
1. Chúng có cùng độ dài (nếu không, chắc chắn không phải anagram)
2. Tần suất xuất hiện của mỗi ký tự trong hai chuỗi phải giống nhau

Có hai cách tiếp cận chính:
- **Hash Map:** Đếm tần suất từng ký tự trong cả hai chuỗi rồi so sánh
- **Sắp xếp:** Sắp xếp cả hai chuỗi rồi so sánh từng ký tự (đơn giản hơn nhưng O(n log n))

Ở đây ta sẽ dùng Hash Map để đạt O(n) thời gian.

## ⚙️ Hướng tiếp cận

**Cách 1: Hash Map với hai lần duyệt**
1. Kiểm tra độ dài: Nếu `len(s) != len(t)`, trả về `false`
2. Đếm tần suất ký tự trong `s`: Duyệt `s` và tăng counter cho mỗi ký tự
3. Đếm tần suất ký tự trong `t`: Duyệt `t` và giảm counter cho mỗi ký tự
4. Kiểm tra kết quả: Nếu tất cả giá trị trong hash map đều bằng 0, thì là anagram

**Cách 2: Hash Map với một lần duyệt (tối ưu hơn)**
1. Kiểm tra độ dài
2. Duyệt đồng thời cả hai chuỗi, tăng counter cho `s`, giảm counter cho `t`
3. Kiểm tra tất cả giá trị trong hash map có bằng 0 không

**Edge cases:**
- Hai chuỗi rỗng → `true` (anagram của nhau)
- Độ dài khác nhau → `false`
- Chuỗi có ký tự đặc biệt (theo đề bài chỉ có chữ cái thường)

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian | O(n) - Duyệt cả hai chuỗi một lần |
| Bộ nhớ | O(1) - Hash map chỉ lưu tối đa 26 ký tự (a-z), coi như O(1) |

## 💻 Code minh họa

```python
def isAnagram(s: str, t: str) -> bool:
    """
    Kiểm tra xem t có phải là anagram của s không.
    
    Args:
        s: Chuỗi gốc
        t: Chuỗi cần kiểm tra
    
    Returns:
        True nếu t là anagram của s, False nếu không
    """
    # Kiểm tra độ dài
    if len(s) != len(t):
        return False
    
    # Hash map để đếm tần suất ký tự
    char_count = {}
    
    # Đếm tần suất trong s (tăng)
    for char in s:
        char_count[char] = char_count.get(char, 0) + 1
    
    # Đếm tần suất trong t (giảm)
    for char in t:
        if char not in char_count:
            return False  # Ký tự trong t không có trong s
        char_count[char] -= 1
        if char_count[char] < 0:
            return False  # Tần suất âm → không khớp
    
    # Kiểm tra tất cả giá trị đều bằng 0
    return all(count == 0 for count in char_count.values())
```

**Phiên bản tối ưu hơn (dùng Counter từ collections):**

```python
from collections import Counter

def isAnagram(s: str, t: str) -> bool:
    """
    Phiên bản sử dụng Counter - ngắn gọn và dễ đọc hơn.
    """
    return Counter(s) == Counter(t)
```

**Phiên bản sắp xếp (O(n log n) nhưng đơn giản):**

```python
def isAnagram(s: str, t: str) -> bool:
    """
    Phiên bản sắp xếp - đơn giản nhưng chậm hơn.
    """
    return sorted(s) == sorted(t)
```

## 🧠 Ghi chú

- **Lý do dùng Hash Map:** Hiệu quả hơn sắp xếp vì O(n) thay vì O(n log n), đặc biệt khi chuỗi dài
- **Tối ưu bộ nhớ:** Hash map chỉ cần lưu tối đa 26 ký tự (a-z), nên độ phức tạp bộ nhớ là O(1) thay vì O(n)
- **Cách tiếp cận khác:** Có thể dùng mảng cố định 26 phần tử thay vì hash map (tối ưu hơn một chút về bộ nhớ)
- **Liên kết tới các bài liên quan:**
  - [[group-anagrams]] - Ứng dụng kiểm tra anagram để nhóm các từ
  - [[contains-duplicate]] - Cũng dùng hash map để đếm tần suất
  - [[top-k-frequent-elements]] - Đếm tần suất và sắp xếp

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
Input: s = "anagram", t = "nagaram"

Đếm tần suất trong s:
a: 3, n: 1, g: 1, r: 1, m: 1

Đếm tần suất trong t (giảm):
n: 1-1=0, a: 3-3=0, g: 1-1=0, a: 0-1=-1? Không, vì đã kiểm tra từng ký tự

Kết quả: Tất cả giá trị = 0 → True
```

**Ví dụ 2:**
```
Input: s = "rat", t = "car"

Đếm tần suất trong s:
r: 1, a: 1, t: 1

Đếm tần suất trong t:
c: không có trong s → return False ngay lập tức

Output: False
```

**Ví dụ 3:**
```
Input: s = "", t = ""

Độ dài bằng nhau (0)
Hash map rỗng → all() trả về True

Output: True
```
