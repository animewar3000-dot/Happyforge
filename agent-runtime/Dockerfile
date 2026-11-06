FROM node:22-bookworm-slim

RUN npm install --global opencode-ai@1.19.5

WORKDIR /workspace
EXPOSE 4096

CMD ["opencode", "serve", "--hostname", "0.0.0.0", "--port", "4096"]
