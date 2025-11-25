# Hướng dẫn Test Frontend với Google Drive

## 🚀 Chạy Frontend

### 1. Kiểm tra Backend
- Backend đang chạy trên port mặc định (thường là `http://localhost:5064`)
- Kiểm tra: Mở `http://localhost:5064/swagger` để xác nhận

### 2. Chạy Frontend
```bash
cd SWD-Grading-Frontend/PRN_FINAL/prn-final
npm install  # Nếu chưa install
npm run dev
```

Frontend sẽ chạy trên: `http://localhost:5173` (hoặc port khác nếu 5173 bị chiếm)

### 3. Cấu hình API URL
- Mặc định: `http://localhost:5064/api`
- Có thể set biến môi trường: `VITE_API_BASE_URL=http://localhost:5064/api`

## 📋 Test Cases

### Test 1: Upload Exam Paper (Description)
1. Login vào hệ thống
2. Vào Exam → Upload files
3. Chọn "Bước 1: Upload đề bài"
4. Upload file ảnh (jpg, png, etc.)
5. **Verify**: 
   - File được upload thành công
   - Kiểm tra Google Drive có file trong folder `Exam_{ExamCode}`

### Test 2: Upload Excel (Student List)
1. Chọn "Bước 2: Upload danh sách Excel"
2. Upload file Excel (.xlsx)
3. **Verify**:
   - File được upload thành công
   - Kiểm tra Google Drive có file trong folder `Exam_{ExamCode}`

### Test 3: Upload ZIP (Student Solutions)
1. Chọn "Bước 3: Upload file ZIP"
2. Upload file ZIP chứa Student_Solutions
3. **Verify**:
   - File được upload thành công
   - Hiển thị progress xử lý
   - Kiểm tra Google Drive:
     - Folder `{ExamCode}_{ExamZipId}_{timestamp}` được tạo
     - ZIP file có trong folder
     - Student folders được tạo với files bên trong

### Test 4: Verify trên Google Drive
1. Mở Google Drive
2. Vào Root Folder (ID từ config)
3. Kiểm tra:
   - ✅ Folder `Exam_{ExamCode}` chứa Exam Paper và Excel
   - ✅ Folder `{ExamCode}_{ExamZipId}_{timestamp}` chứa:
     - ZIP file gốc
     - Exam files (nếu có trong ZIP)
     - Student folders với files

### Test 5: Verify không có files local
1. Kiểm tra folder `temp/uploads` (nếu có) - phải rỗng
2. Kiểm tra không có files trong project folder
3. **Verify**: Tất cả files chỉ có trên Drive

## 🔍 Kiểm tra Logs

### Backend Logs
- Kiểm tra console output khi upload
- Xem có lỗi Google Drive API không
- Verify folder được tạo thành công

### Frontend Logs
- Mở Browser DevTools (F12)
- Kiểm tra Network tab:
  - Request upload có thành công không
  - Response có ExamZipId không
- Console tab:
  - Có lỗi API không
  - Có warning gì không

## ⚠️ Troubleshooting

### Lỗi: "Google credentials not found"
- Kiểm tra `appsettings.json` có đầy đủ ServiceAccount config
- Verify RootFolderId đúng

### Lỗi: "Failed to create Drive folder"
- Kiểm tra service account có quyền truy cập RootFolderId
- Verify RootFolderId là ID hợp lệ (không phải URL)

### Files không xuất hiện trên Drive
- Kiểm tra service account có quyền write
- Verify folder được tạo thành công
- Check logs để xem có lỗi upload không

### Frontend không kết nối được Backend
- Kiểm tra backend đang chạy
- Verify API URL trong `AxiosSetup.js`
- Check CORS settings

## ✅ Success Criteria

- [ ] Upload Exam Paper thành công → File trên Drive
- [ ] Upload Excel thành công → File trên Drive
- [ ] Upload ZIP thành công → Folder và files trên Drive
- [ ] Processing hoàn thành → Tất cả student files trên Drive
- [ ] Không có files trên local disk
- [ ] SQL chỉ lưu Drive URLs

