# Next Steps

Bạn đã làm quen với Dev Docs! Bây giờ hãy khám phá thêm.

## Customize Your Site

### Thay đổi config
Chỉnh sửa `quartz.config.ts` để customize:
- Theme colors
- Typography
- Plugins
- Analytics

### Thêm nội dung
Tạo file markdown mới trong thư mục `content/` để publish content.

### Custom components
Tạo custom components trong `quartz/components/` để extend functionality.

## Build & Deploy

### Local development
```bash
npx quartz build --serve
```

### Production build
```bash
npx quartz build
```

### Sử dụng Docker
```bash
# Build
podman build -t quartz .

# Run
podman run --rm -p 8080:8080 quartz
```

## Resources

- Built with [Quartz](https://quartz.jzhao.xyz)
- [Quartz GitHub](https://github.com/jackyzha0/quartz)

## Khám phá

- [[Git Introduction|Học về Git]]
- [[Docker Basics|Tìm hiểu Docker]]

---

Happy building! 🚀
