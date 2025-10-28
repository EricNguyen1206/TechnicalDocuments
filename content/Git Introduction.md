# Git Introduction

Git là một hệ thống quản lý phiên bản phân tán (distributed version control system) được sử dụng rộng rãi trong phát triển phần mềm.

## Khái niệm cơ bản

### Repository
Repository (hay repo) là nơi lưu trữ toàn bộ mã nguồn và lịch sử thay đổi của dự án.

### Commit
Commit là một điểm trong lịch sử thay đổi, đại diện cho một nhóm thay đổi đã được lưu lại.

### Branch
Branch là một nhánh phát triển độc lập của dự án.

## Các lệnh cơ bản

```bash
git init                    # Khởi tạo repository
git add .               # Thêm tất cả file vào staging
git commit -m "message" # Tạo commit
git status              # Kiểm tra trạng thái
```

## Best Practices

- Commit thường xuyên với message rõ ràng
- Sử dụng branches cho features mới
- Pull trước khi push
- Review code trước khi merge

## Liên kết

- Xem thêm về [[Docker Basics]]
- Đọc tiếp [[Next Steps]]
