FROM gcc:latest

RUN apt-get update \
 && apt-get install -y --no-install-recommends coreutils bash \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /sandbox

COPY entrypoint.sh /sandbox/entrypoint.sh

# remove CRLF + remove BOM + chmod
RUN sed -i 's/\r$//' /sandbox/entrypoint.sh \
 && awk 'NR==1{sub(/^\xef\xbb\xbf/,"")}1' /sandbox/entrypoint.sh > /tmp/e \
 && mv /tmp/e /sandbox/entrypoint.sh \
 && chmod +x /sandbox/entrypoint.sh

ENTRYPOINT ["/sandbox/entrypoint.sh"]
