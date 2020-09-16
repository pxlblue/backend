FROM node:14-alpine
WORKDIR /usr/src/app

COPY yarn.lock .
COPY package.json .

RUN yarn install --production --ignore-scripts --prefer-offline

COPY dist/ ./dist

EXPOSE 3000

CMD ["yarn", "start"]