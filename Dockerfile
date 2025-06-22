FROM node:18

WORKDIR /app

# Cài đặt phụ thuộc
COPY package.json package-lock.json ./
RUN npm install

# Copy file Prisma
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy toàn bộ mã nguồn (sau generate để tránh bị volume ghi đè)
COPY . .

# Cổng NestJS
EXPOSE 8000

# Khởi chạy ứng dụng
CMD ["npm", "run", "start:dev"]
