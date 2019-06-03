FROM node:8-alpine

ENV TZ Etc/UTC
RUN apk add tzdata
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime
RUN echo $TZ >  /etc/timezone

RUN rm -rf /var/cache/apk/*

RUN yarn global add pm2 knex knex-migrate

RUN mkdir -p /var/app
WORKDIR /var/app
COPY ./package.json /var/app
COPY ./yarn.lock /var/app
RUN yarn install
COPY . /var/app/
RUN yarn build:0

CMD ["pm2", "start", "index.js", "--no-daemon", "--watch"]
