FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm install
COPY --from=build /app/dist dist
COPY --from=build /app/server.js ./

ENTRYPOINT ["node", "/app/server.js"]
