FROM golang:alpine AS builder

WORKDIR /app

RUN apk add --no-cache gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /aether-server ./cmd/server/

FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /aether-server .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080

CMD ["./aether-server"]
