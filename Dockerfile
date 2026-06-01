FROM node:24-alpine AS build

WORKDIR /app

COPY package.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm install --prefix backend
RUN npm install --prefix frontend

COPY backend ./backend
COPY frontend ./frontend

RUN npm run build --prefix frontend

FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./backend/
RUN npm install --prefix backend --omit=dev

COPY backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE 5000

CMD ["npm", "start", "--prefix", "backend"]