FROM node:20-alpine

# Alpine ships without IANA tzdata by default, so ENV TZ alone would silently
# no-op and the server would compute the "current week" in UTC.
RUN apk add --no-cache tzdata
ENV TZ=Europe/Zurich

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server ./server
COPY public ./public

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_FILE=/app/data/homeoffice-data.json \
    TEAM_FILE=/app/data/team.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
