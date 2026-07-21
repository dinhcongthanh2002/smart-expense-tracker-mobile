# Build IPA qua GitHub Actions (theo tag)

Mỗi khi push một **tag phiên bản** dạng `v*` (vd `v1.0.1`), GitHub Actions tự
build **IPA chưa ký** trên macOS runner, upload artifact và **đính vào GitHub
Release** của tag đó (tải không cần đăng nhập).

Workflow: [`.github/workflows/ios-ipa.yml`](../.github/workflows/ios-ipa.yml)

---

## Các bước

### 1. Commit + push code lên `dev`
Mọi thay đổi (kể cả JS) phải nằm trong commit thì mới vào bản build.

```bash
git add -A
git commit -m "feat: ..."   # nội dung thay đổi
git push origin dev
```

### 2. Đảm bảo `app.json` "version" khớp tag
Ví dụ muốn build `v1.0.1` thì `app.json` → `"version": "1.0.1"`.
(Nếu vừa sửa, nhớ commit + push như bước 1.)

### 3. Tạo tag ở commit mới nhất rồi push tag
```bash
git tag v1.0.1
git push origin v1.0.1
```

> Tag trỏ vào commit **tại thời điểm tạo tag**. Muốn build code mới nhất thì
> tạo tag **sau khi** đã push code ở bước 1.

### 4. Xem build + tải IPA
- Vào tab **Actions** → chọn run "Build unsigned iOS IPA" (chạy ~15–25 phút).
- Tải IPA:
  - **Releases** → tag `v1.0.1` → file `SmartExpense-unsigned.ipa`, hoặc
  - **Actions** → run đó → artifact `SmartExpense-unsigned-ipa`.
- Cài bằng **Sideloadly** (tự ký lại bằng Apple ID), **AltStore**, hoặc **TrollStore**.

---

## Làm nhanh (copy–paste)

```bash
# đứng ở nhánh dev, đã commit hết
git push origin dev
git tag v1.0.1
git push origin v1.0.1
```

---

## Xử lý lỗi thường gặp

**`fatal: tag 'v1.0.1' already exists`** — tag đã tồn tại. Dùng số version mới
(khuyến nghị):
```bash
git tag v1.0.2
git push origin v1.0.2
```
Hoặc xoá tag cũ rồi tạo lại (ít khuyến nghị):
```bash
git tag -d v1.0.1                     # xoá local
git push origin :refs/tags/v1.0.1     # xoá trên remote
git tag v1.0.1
git push origin v1.0.1
```

**Kiểm tra tag đang trỏ commit nào:**
```bash
git show v1.0.1 --stat | head
```

**Liệt kê tag:**
```bash
git tag --sort=-creatordate | head
```

**Build tay không cần tag:** Actions → "Build unsigned iOS IPA" → **Run workflow**
(chỉ ra artifact, không tạo Release).

---

## Build lại CÙNG một version (retag `v1.0.1`)

Tag đã push thì **cố định vào commit cũ** — sửa code xong mà muốn giữ nguyên số
`v1.0.1` thì phải **xoá tag rồi tạo lại ở commit mới**.

```bash
# 1. Commit + push code mới lên dev
git add -A
git commit -m "fix: ..."
git push origin dev

# 2. Xoá tag v1.0.1 (local + remote)
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1

# 3. Tạo lại tag ở commit mới nhất + push
git tag v1.0.1
git push origin v1.0.1
```

Sau khi push, Actions build lại; **Release `v1.0.1` được cập nhật**, file
`SmartExpense-unsigned.ipa` bị **ghi đè bằng bản mới** (action tự thay asset cùng tên).

> **Khuyến nghị:** thay vì retag, cứ **tăng version** (`v1.0.2`, `v1.0.3`…) cho
> gọn — không phải xoá, mỗi bản có Release riêng, dễ theo dõi bản nào là bản nào.
> Nhớ sửa `app.json` → `"version"` cho khớp.

**Một dòng (khi đã commit + push code):**
```bash
git tag -d v1.0.1 && git push origin :refs/tags/v1.0.1 && git tag v1.0.1 && git push origin v1.0.1
```

---

## Lưu ý

- **Sửa JS cũng phải build lại IPA** — JS được đóng gói (bundle) lúc build. IPA
  standalone không tự cập nhật khi bạn sửa code; phải build tag mới. (Chỉ khi
  chạy dev-client nối Metro thì reload JS mới ăn ngay.)
- Runner **macOS tính phút x10**. Repo private có hạn mức; build theo tag giúp
  chỉ tốn khi thật sự phát hành.
- IPA **chưa ký** → phải sideload (Sideloadly/AltStore/TrollStore), không cài
  thẳng được.
