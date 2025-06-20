# Blog Setup Guide

## Cài đặt và chạy dự án

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Tạo tài khoản Admin

### Bước 1: Đăng ký tài khoản thường
1. Truy cập `/register` và tạo tài khoản
2. Đăng nhập và lấy UID từ Firebase Console

### Bước 2: Promote thành Admin
1. Mở file `backend/promoteUser.js`
2. Thay `YOUR_USER_UID_HERE` bằng UID thực tế
3. Chạy lệnh:
```bash
cd backend
node promoteUser.js
```

### Bước 3: Kiểm tra
- Đăng xuất và đăng nhập lại
- Menu "Admin Panel" sẽ xuất hiện trong dropdown

## Tính năng đã hoàn thành

✅ **Auth Store với Pinia**
- Tự động xử lý token với Axios interceptor
- Quản lý trạng thái đăng nhập toàn cục

✅ **Router Protection**
- `/bookmarks`, `/post-manager` yêu cầu đăng nhập
- `/admin` chỉ dành cho admin

✅ **Dynamic Navbar**
- Hiển thị Login/Register khi chưa đăng nhập
- Hiển thị avatar, username, menu khi đã đăng nhập
- Menu Admin cho admin

✅ **UI Improvements**
- Bootstrap 5 + Bootstrap Icons
- Giao diện hiện đại, responsive

## Cấu trúc Store

### Auth Store (`/store/auth.js`)
- `user`: Firebase user object
- `profile`: User profile từ backend
- `isAuthenticated`: Getter kiểm tra đăng nhập
- `isAdmin`: Getter kiểm tra quyền admin
- `login()`: Đăng nhập
- `logout()`: Đăng xuất
- `fetchProfile()`: Lấy thông tin user

### Main Store (`/store/index.js`)
- `posts`: Danh sách bài viết
- `bookmarks`: Danh sách bookmark
- Các action để fetch data

## API Endpoints

Tất cả request tự động có Authorization header nhờ Axios interceptor:

- `GET /api/auth/profile` - Lấy profile user
- `POST /api/bookmarks` - Tạo bookmark
- `DELETE /api/bookmarks/:id` - Xóa bookmark
- Các endpoint khác...