FROM node:14
WORKDIR /usr/src/app

COPY yarn.lock .
COPY package.json .

RUN yarn install --production --ignore-scripts --prefer-offline
RUN npm rebuild --update-binary

COPY dist/ ./dist

EXPOSE 3000

CMD ["yarn", "start"]