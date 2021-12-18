FROM node:15
WORKDIR /app
RUN apt update && apt install -y netcat
ADD --chmod=755 https://raw.githubusercontent.com/eficode/wait-for/v2.2.1/wait-for /app/wait-for
ADD package.json yarn.lock /app/
RUN yarn install
ADD . /app
RUN yarn && yarn build-deps
RUN chmod 0755 /app/wait-for
CMD ["yarn", "backend-start"]