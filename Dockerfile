FROM node:14-alpine
WORKDIR /usr/src/app

COPY . .

RUN yarn install && yarn build && rm -rf src/

RUN yarn install --production --ignore-scripts --prefer-offline

EXPOSE 3000

CMD ["yarn", "start"]