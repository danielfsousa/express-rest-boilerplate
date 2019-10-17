FROM node:8-alpine

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

WORKDIR /usr/src/app
COPY package*.json .
RUN yarn install

COPY . .

EXPOSE 3000

CMD ["yarn", "docker:start"]
