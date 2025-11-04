---
title: Encode and Decode Strings
tags: [dsa, array, string, encoding, #topic/dsa]
date: 2024-12-19
difficulty: Medium
source: neetcode
link: https://neetcode.io/problems/encode-and-decode-strings
---

# Encode and Decode Strings

## 🧩 Đề bài

Thiết kế một thuật toán để mã hóa và giải mã một danh sách các chuỗi. Thuật toán mã hóa phải có khả năng mã hóa một danh sách các chuỗi thành một chuỗi duy nhất. Thuật toán giải mã phải có khả năng khôi phục danh sách gốc từ chuỗi đã mã hóa.

**Ràng buộc:**
- Các chuỗi có thể chứa bất kỳ ký tự nào (kể cả ký tự đặc biệt, dấu cách, số)
- Không được sử dụng phương thức serialize/deserialize có sẵn (như JSON)

**Ví dụ:**
- Input: `strs = ["neet","code","love","you"]`
- Encoded: `"4#neet4#code4#love3#you"`
- Decoded: `["neet","code","love","you"]`

## 💡 Ý tưởng

Vấn đề chính là làm sao phân biệt được ranh giới giữa các chuỗi trong chuỗi đã mã hóa. Có nhiều cách:

1. **Dùng độ dài + delimiter:** Mã hóa mỗi chuỗi dạng `"độ_dài#chuỗi"`. Khi giải mã, đọc số độ dài, sau đó đọc đúng số ký tự đó.
2. **Dùng escape character:** Thay thế các ký tự đặc biệt bằng escape sequence.
3. **Dùng delimiter đặc biệt:** Chọn một ký tự không xuất hiện trong chuỗi làm delimiter.

Cách tốt nhất và đơn giản nhất là **dùng độ dài + delimiter (#)**:
- Mã hóa: `"4#neet4#code4#love3#you"`
- Khi giải mã: Đọc số trước dấu `#`, đó là độ dài chuỗi tiếp theo. Đọc đúng số ký tự đó, ta được chuỗi gốc.

Ví dụ với `"4#neet"`:
- Đọc `4` → độ dài = 4
- Đọc `#` → bỏ qua delimiter
- Đọc 4 ký tự tiếp theo: `"neet"` → chuỗi gốc

## ⚙️ Hướng tiếp cận

**Hàm Encode:**
1. Duyệt từng chuỗi trong danh sách
2. Với mỗi chuỗi, tạo chuỗi mã hóa dạng `"độ_dài#chuỗi_gốc"`
3. Nối tất cả các chuỗi mã hóa lại với nhau

**Hàm Decode:**
1. Khởi tạo con trỏ `i = 0` và danh sách kết quả
2. Duyệt chuỗi đã mã hóa:
   - Tìm vị trí dấu `#` đầu tiên từ vị trí hiện tại
   - Đọc số trước dấu `#` (đó là độ dài)
   - Đọc đúng số ký tự sau dấu `#` để lấy chuỗi gốc
   - Thêm chuỗi vào danh sách kết quả
   - Di chuyển con trỏ đến sau chuỗi vừa đọc
3. Trả về danh sách kết quả

**Edge cases:**
- Danh sách rỗng → mã hóa thành chuỗi rỗng, giải mã thành danh sách rỗng
- Chuỗi rỗng trong danh sách → mã hóa thành `"0#"`, giải mã thành `""`
- Chuỗi có ký tự `#` → vẫn xử lý được vì ta dùng độ dài để xác định ranh giới

## ⏱️ Độ phức tạp

| Loại | Giá trị |
|------|---------|
| Thời gian (Encode) | O(n) - n là tổng độ dài tất cả chuỗi |
| Thời gian (Decode) | O(n) - Duyệt chuỗi mã hóa một lần |
| Bộ nhớ (Encode) | O(n) - Chuỗi mã hóa có độ dài tương đương |
| Bộ nhớ (Decode) | O(n) - Danh sách kết quả |

## 💻 Code minh họa

```python
class Solution:
    """
    Class để mã hóa và giải mã danh sách chuỗi.
    """
    
    def encode(self, strs: list[str]) -> str:
        """
        Mã hóa danh sách chuỗi thành một chuỗi duy nhất.
        Format: "độ_dài#chuỗi" cho mỗi chuỗi.
        
        Args:
            strs: Danh sách các chuỗi cần mã hóa
        
        Returns:
            Chuỗi đã mã hóa
        """
        encoded = []
        
        for s in strs:
            # Mã hóa mỗi chuỗi dạng "độ_dài#chuỗi"
            encoded.append(str(len(s)) + "#" + s)
        
        return "".join(encoded)
    
    def decode(self, s: str) -> list[str]:
        """
        Giải mã chuỗi đã mã hóa thành danh sách chuỗi gốc.
        
        Args:
            s: Chuỗi đã mã hóa
        
        Returns:
            Danh sách chuỗi gốc
        """
        decoded = []
        i = 0
        
        while i < len(s):
            # Tìm vị trí dấu # đầu tiên từ vị trí hiện tại
            j = i
            while s[j] != "#":
                j += 1
            
            # Đọc độ dài (từ i đến j)
            length = int(s[i:j])
            
            # Đọc chuỗi (từ j+1, đọc đúng 'length' ký tự)
            decoded.append(s[j+1:j+1+length])
            
            # Di chuyển con trỏ đến sau chuỗi vừa đọc
            i = j + 1 + length
        
        return decoded
```

**Phiên bản tối ưu hơn (dùng find thay vì vòng lặp):**

```python
class Solution:
    def encode(self, strs: list[str]) -> str:
        """Mã hóa danh sách chuỗi."""
        return "".join(f"{len(s)}#{s}" for s in strs)
    
    def decode(self, s: str) -> list[str]:
        """Giải mã chuỗi đã mã hóa."""
        decoded = []
        i = 0
        
        while i < len(s):
            # Tìm vị trí dấu # từ vị trí hiện tại
            delimiter_pos = s.find("#", i)
            
            # Đọc độ dài
            length = int(s[i:delimiter_pos])
            
            # Đọc chuỗi
            start = delimiter_pos + 1
            end = start + length
            decoded.append(s[start:end])
            
            # Di chuyển con trỏ
            i = end
        
        return decoded
```

**Ví dụ minh họa chi tiết:**

```python
# Ví dụ với strs = ["neet", "code", "love", "you"]

# Encode:
# "neet" → "4#neet"
# "code" → "4#code"
# "love" → "4#love"
# "you" → "3#you"
# Kết quả: "4#neet4#code4#love3#you"

# Decode "4#neet4#code4#love3#you":
# i=0: Tìm "#" tại vị trí 1
#   Đọc độ dài: "4" → length = 4
#   Đọc chuỗi: s[2:6] = "neet"
#   i = 6
# i=6: Tìm "#" tại vị trí 7
#   Đọc độ dài: "4" → length = 4
#   Đọc chuỗi: s[8:12] = "code"
#   i = 12
# ... tiếp tục
```

## 🧠 Ghi chú

- **Tại sao dùng độ dài + delimiter?** Đây là cách đơn giản và hiệu quả nhất, không cần escape character, xử lý được mọi ký tự (kể cả `#` trong chuỗi gốc)
- **Lý do chọn `#` làm delimiter:** Ký tự này thường ít xuất hiện trong chuỗi thông thường, nhưng nếu có thì vẫn xử lý được vì ta dùng độ dài để xác định ranh giới
- **Xử lý chuỗi rỗng:** Chuỗi rỗng được mã hóa thành `"0#"`, khi giải mã sẽ đọc 0 ký tự → chuỗi rỗng
- **Độ phức tạp:** Cả encode và decode đều là O(n) với n là tổng độ dài tất cả chuỗi, đây là tối ưu vì phải duyệt qua tất cả ký tự
- **Liên kết tới các bài liên quan:**
  - [[Valid Anagram]] - Cũng xử lý chuỗi và ký tự
  - [[Group Anagrams]] - Xử lý danh sách chuỗi

## ✅ Ví dụ minh họa

**Ví dụ 1:**
```
Input: strs = ["neet","code","love","you"]

Encode:
- "neet" (độ dài 4) → "4#neet"
- "code" (độ dài 4) → "4#code"
- "love" (độ dài 4) → "4#love"
- "you" (độ dài 3) → "3#you"
Kết quả: "4#neet4#code4#love3#you"

Decode "4#neet4#code4#love3#you":
- Đọc "4" → length=4, đọc 4 ký tự sau "#" → "neet"
- Đọc "4" → length=4, đọc 4 ký tự sau "#" → "code"
- Đọc "4" → length=4, đọc 4 ký tự sau "#" → "love"
- Đọc "3" → length=3, đọc 3 ký tự sau "#" → "you"

Output: ["neet","code","love","you"]
```

**Ví dụ 2:**
```
Input: strs = [""]

Encode:
- "" (độ dài 0) → "0#"
Kết quả: "0#"

Decode "0#":
- Đọc "0" → length=0, đọc 0 ký tự sau "#" → ""

Output: [""]
```

**Ví dụ 3:**
```
Input: strs = ["hello", "world", "test"]

Encode: "5#hello5#world4#test"
Decode: ["hello", "world", "test"]
```

**Ví dụ 4: (chuỗi có ký tự #)**
```
Input: strs = ["a#b", "c#d"]

Encode: "3#a#b3#c#d"
Decode: 
- Đọc "3" → length=3, đọc 3 ký tự sau "#" → "a#b"
- Đọc "3" → length=3, đọc 3 ký tự sau "#" → "c#d"

Output: ["a#b", "c#d"]
```
