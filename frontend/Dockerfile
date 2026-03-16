# Етап 1: Збірка React
FROM node:20-alpine AS build

WORKDIR /app

# Копіюємо файли залежностей (використовуємо кореневий package.json фронтенду)
COPY package*.json ./
RUN npm install

COPY . .

# При збірці вказуємо, що API тепер буде за відносним шляхом /api/
# (завдяки проксі в Nginx)
ENV VITE_API_URL=/api/
RUN npm run build

# Етап 2: Nginx
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html
# Копіюємо наш кастомний конфіг
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
