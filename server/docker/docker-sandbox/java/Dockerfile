FROM eclipse-temurin:17-jdk-alpine

RUN apk add --no-cache coreutils bash

WORKDIR /sandbox

COPY entrypoint.sh /sandbox/entrypoint.sh

# remove CRLF + remove BOM (nếu có) + chmod
RUN sed -i 's/\r$//' /sandbox/entrypoint.sh \
 && awk 'NR==1{sub(/^\xef\xbb\xbf/,"")}1' /sandbox/entrypoint.sh > /tmp/e \
 && mv /tmp/e /sandbox/entrypoint.sh \
 && chmod +x /sandbox/entrypoint.sh

ENTRYPOINT ["/sandbox/entrypoint.sh"]
