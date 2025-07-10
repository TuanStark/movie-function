#!/bin/bash

# Hàm xác nhận từ người dùng
confirm() {
    read -r -p "$1 (Y/N): " response
    case "$response" in
        [yY])
            true
            ;;
        *)
            false
            ;;
    esac
}

# Yêu cầu người dùng chọn phương thức khôi phục
echo "Chọn phương thức khôi phục:"
echo "1. Khôi phục từ file dump.sql có sẵn"
echo "2. Nhập URL để tải file dump"
read -p "Nhập lựa chọn (1 hoặc 2): " choice

if [ "$choice" = "1" ]; then
    DUMP_FILE="dump.sql"
    if [ ! -f "$DUMP_FILE" ]; then
        echo "Error: Không tìm thấy file dump.sql!"
        exit 1
    fi
elif [ "$choice" = "2" ]; then
    read -p "Nhập URL để tải file dump: " DUMP_URL
    curl -f -o dump.sql "$DUMP_URL" || {
        echo "Error: Không thể tải file dump.sql từ URL!"
        exit 1
    }
    DUMP_FILE="dump.sql"
else
    echo "Error: Lựa chọn không hợp lệ!"
    exit 1
fi

# Yêu cầu xác nhận trước khi tiếp tục
if confirm "Bạn có chắc chắn muốn khôi phục database từ file $DUMP_FILE?"; then
    echo "Xác nhận thành công."
else
    echo "Khôi phục database đã bị hủy."
    exit 1
fi

# Đọc PROJECT_NAME và DATABASE_IP từ file .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "Error: Không tìm thấy file .env!"
    exit 1
fi

# Kiểm tra biến môi trường
if [ -z "$PROJECT_NAME" ] || [ -z "$DATABASE_IP" ]; then
    echo "Error: PROJECT_NAME hoặc DATABASE_IP không được định nghĩa trong file .env!"
    exit 1
fi

# Tìm kiếm container database dựa trên DATABASE_IP
CONTAINER_ID=$(docker ps -q | xargs docker inspect --format '{{.Id}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | grep "$DATABASE_IP" | awk '{print $1}')

if [ -z "$CONTAINER_ID" ]; then
    echo "Error: Không tìm thấy container database cho project ${PROJECT_NAME} với IP ${DATABASE_IP}."
    exit 1
elif [ $(echo "$CONTAINER_ID" | wc -l) -gt 1 ]; then
    echo "Warning: Tìm thấy nhiều container database cho project ${PROJECT_NAME} với IP ${DATABASE_IP}. Bỏ qua thao tác."
    exit 1
fi

echo "Đã tìm thấy container ID: $CONTAINER_ID"

# Thông tin đăng nhập database
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DATABASE="${POSTGRES_DATABASE:-postgres}"

# Sao chép file dump.sql vào trong container
docker cp "$DUMP_FILE" "$CONTAINER_ID:/tmp/$DUMP_FILE" || {
    echo "Error: Không thể sao chép file dump.sql vào container!"
    exit 1
}

# Xóa database hiện tại và tạo lại
docker exec -t "$CONTAINER_ID" psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DATABASE;"
docker exec -t "$CONTAINER_ID" psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DATABASE;"

# Khôi phục database từ file dump
docker exec -t "$CONTAINER_ID" psql -U "$POSTGRES_USER" -d "$POSTGRES_DATABASE" -f "/tmp/$DUMP_FILE" || {
    echo "Error: Không thể khôi phục database từ file dump.sql!"
    exit 1
}

# Xóa file dump trong container sau khi khôi phục xong
docker exec -t "$CONTAINER_ID" rm "/tmp/$DUMP_FILE"

echo "Khôi phục database hoàn tất, dữ liệu cũ đã bị ghi đè."