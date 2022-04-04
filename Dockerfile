# syntax=docker/dockerfile:1
FROM amd64/ubuntu:20.04

# Set up dependencies
RUN apt update && apt install -y curl wget

# Set up Node.js 16
RUN curl -sL https://deb.nodesource.com/setup_16.x -o /tmp/nodesource_setup.sh
RUN bash /tmp/nodesource_setup.sh
RUN apt update && apt install -y nodejs
RUN npm install yarn -g

# Set up dgraph
ADD https://github.com/unigraph-dev/dgraph/releases/latest/download/dgraph_linux_amd64 dgraph_linux_amd64
RUN mkdir /opt/unigraph
RUN mv dgraph_linux_amd64 /opt/dgraph
RUN chmod +x /opt/dgraph

# Set up unigraph, with incremental caches
COPY package.json yarn.lock /app/
COPY ./packages/unigraph-dev-backend/package.json /app/packages/unigraph-dev-backend/package.json
COPY ./packages/unigraph-dev-common/package.json /app/packages/unigraph-dev-common/package.json
COPY ./packages/unigraph-dev-electron/package.json /app/packages/unigraph-dev-electron/package.json
COPY ./packages/unigraph-dev-explorer/package.json /app/packages/unigraph-dev-explorer/package.json
RUN cd /app && yarn --network-timeout 600000
COPY . /app
RUN cd /app && yarn --network-timeout 600000
RUN cd /app && yarn build-deps

# Run Unigraph
WORKDIR /app
CMD ["sh", "-c", "./scripts/start_server.sh -b /opt/dgraph -d /opt/unigraph & yarn explorer-start"]

EXPOSE 3000
EXPOSE 4001
EXPOSE 4002