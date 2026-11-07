# Siri / App Intents — ghi giao dịch & khoản nợ bằng giọng nói

Cho phép người dùng nói với Siri (iOS 16+, tiếng Việt hỗ trợ đầy đủ trên bản Siri
mới) để tạo **giao dịch chi/thu**, **khoản đi vay** và **khoản cho vay** mà không
cần mở app.

Ví dụ:

- "Thêm giao dịch *ăn bánh mì 20 nghìn sáng nay* vào Smart Expense"
- "Ghi khoản vay của *Nam* trong Smart Expense" → Siri hỏi số tiền
- "Ghi cho *Lan* vay trong Smart Expense" → Siri hỏi số tiền

## Cách hoạt động

1. App Intent chạy **trong tiến trình của app** (biên dịch vào target chính), có thể
   chạy nền khi Siri gọi.
2. Phiên đăng nhập (access token + base URL API) được app JS ghi vào **App Group**
   `group.vn.vdcd.smartexpense` qua `lib/siri-bridge.ts` mỗi khi đăng nhập / khởi
   động. App Intent đọc lại từ đó.
3. Với giao dịch chi/thu: intent gọi `POST /transactions/parse` để server bóc tách
   (loại, số tiền, danh mục, ví, thời gian) từ câu nói — đúng luồng của màn hình
   nhập bằng giọng nói trong app — rồi `POST /transactions` để lưu.
4. Với khoản nợ: không có endpoint parse riêng nên intent chỉ tái dùng `/transactions/parse`
   để lấy **số tiền**, còn tên người lấy từ tham số Siri, rồi `POST /debts`
   (`type` 0 = đi vay, 1 = cho vay). Khoản nợ tạo qua Siri **không gắn ví** (để tránh
   yêu cầu danh mục "vay mượn/cho vay" phía server); người dùng có thể gắn ví sau
   trong app.

## Các file liên quan

| File | Vai trò |
|---|---|
| `lib/siri-bridge.ts` | Ghi/xoá token + base URL vào App Group |
| `lib/secure-storage.ts` | Gọi `publishSiriAuth`/`clearSiriAuth` khi login/bootstrap/logout |
| `plugins/ios/ExpenseSiriIntents.swift` | Toàn bộ App Intents + AppShortcutsProvider |
| `plugins/withSiriAppIntents.js` | Config plugin: nhét file Swift vào target chính khi prebuild |
| `app.json` | Đăng ký plugin `./plugins/withSiriAppIntents` |

## Build (chạy trên máy Mac có Xcode)

> App Intents **không chạy trên Expo Go** — bắt buộc development/production build.

```bash
# 1. Cài deps (nếu chưa)
npm install

# 2. Sinh project iOS native (plugin sẽ nhét Swift vào target chính)
npx expo prebuild -p ios --clean

# 3. Build & chạy lên thiết bị thật (App Intents cần máy thật, không chạy Simulator tốt)
npx expo run:ios --device
```

Hoặc build qua EAS:

```bash
eas build -p ios --profile development
```

### Kiểm tra sau prebuild

Mở `ios/<AppName>.xcodeproj`, xác nhận:

- File `ExpenseSiriIntents.swift` nằm trong target chính (tab **Build Phases →
  Compile Sources**).
- Không cần thêm capability nào: App Shortcuts không yêu cầu entitlement Siri.
  App Group `group.vn.vdcd.smartexpense` đã có sẵn trong `app.json`.

## Cách test

1. Đăng nhập trong app (để token được ghi vào App Group).
2. Mở app **Shortcuts** của iOS → tìm "Smart Expense" → sẽ thấy các shortcut
   "Thêm giao dịch", "Ghi khoản đi vay", "Ghi khoản cho vay".
3. Gọi Siri và nói một trong các câu ví dụ ở trên.
4. Lần đầu dùng, iOS có thể hỏi cho phép — chọn Allow.

## Lưu ý / giới hạn

- **Token hết hạn / server restart**: endpoint dùng cache in-memory phía server
  (`AuthorizeByToken`). Nếu server restart, token cũ có thể bị 401 → intent sẽ báo
  "Phiên đăng nhập đã hết hạn", người dùng mở app đăng nhập lại.
- **Widget chưa tự refresh** sau khi Siri tạo giao dịch (widget đọc số liệu do app
  JS đẩy). Mở app một lần sẽ đồng bộ lại. Có thể bổ sung sau nếu cần.
- **Thu/chi**: nếu server không chắc số tiền hoặc danh mục, intent báo người dùng
  mở app kiểm tra thay vì tạo sai.
- **iOS 16+** cho App Shortcuts cơ bản; trải nghiệm hội thoại tự nhiên tiếng Việt
  cần bản iOS/Siri có hỗ trợ tiếng Việt trên thiết bị tương thích.
- Mở rộng thêm (tiết kiệm, ngân sách, ví…) theo cùng khuôn: thêm `AppIntent` +
  method trong `ExpenseAPI` + phrase trong `ExpenseAppShortcuts`.
```
