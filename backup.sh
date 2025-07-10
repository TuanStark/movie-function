#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Debug output (optional, can be removed for security)
echo "PROJECT_NAME: $PROJECT_NAME"
echo "DO_SPACES_ACCESS_KEY: $DO_SPACES_ACCESS_KEY"
echo "DO_SPACES_SECRET_KEY: $DO_SPACES_SECRET_KEY"
echo "DO_SPACES_REGION: $DO_SPACES_REGION"
echo "DO_SPACES_NAME: $DO_SPACES_NAME"
echo "HASURA_GRAPHQL_ADMIN_SECRET: $HASURA_GRAPHQL_ADMIN_SECRET"

# Tìm đúng container database có IP trùng khớp với DATABASE_IP
CONTAINER_ID=$(docker ps -q | xargs docker inspect --format '{{.Id}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | grep -w ${DATABASE_IP} | awk '{print $1}')

# Kiểm tra xem có tìm thấy container không
if [ -z "$CONTAINER_ID" ]; then
    echo "Error: Không tìm thấy container database."
    exit 1
elif [ $(echo "$CONTAINER_ID" | wc -l) -gt 1 ]; then
    echo "Warning: Tìm thấy nhiều container database. Bỏ qua thao tác."
    exit 1
fi

echo "Đã tìm thấy container ID: $CONTAINER_ID"

# Database credentials (replace these with your actual values or use environment variables)
POSTGRES_USER="postgres"
POSTGRES_DATABASE="postgres"

# Dump file name
# DUMP_FILE="dump.sql"
DUMP_FILE="./dump.sql.gz"


# Run pg_dump inside the container
docker exec -t $CONTAINER_ID pg_dump -U $POSTGRES_USER -d $POSTGRES_DATABASE > $DUMP_FILE

echo "Cleanup completed."
