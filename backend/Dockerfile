FROM node:alpine AS builder

WORKDIR /backend
COPY . .

# Install dependencies and build custom logic
RUN npm install
RUN npm run build

FROM heroiclabs/nakama:3.24.2

COPY --from=builder /backend/build/*.js /nakama/data/modules/
COPY --from=builder /backend/local.yml /nakama/data/
COPY --from=builder /backend/start.sh /nakama/

# Set correct permissions
USER root
RUN chmod +x /nakama/start.sh

# Run the custom logic that checks for Railway's DATABASE_URL
ENTRYPOINT ["/nakama/start.sh"]
