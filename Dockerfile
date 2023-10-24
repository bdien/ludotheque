FROM alpine:3.18 as build
EXPOSE 80

# Build website
RUN apk add nodejs
RUN wget -qO- https://get.pnpm.io/install.sh  | ENV="$HOME/.shrc" SHELL="$(which sh)" sh -
ENV PATH="$PATH:/root/.local/share/pnpm"
ADD . /app
RUN sed -i "s/DEVDEV/`date +%m%d%H%M`/" /app/src/api/system.py /app/src/webui/src/components/sidemenu.tsx
RUN cd /app/src/webui && pnpm install && pnpm run build

# Now build final image
FROM alpine:3.18

ENV TZ=Europe/Paris
ENV LUDO_STORAGE /app/storage
VOLUME /app/storage

RUN apk add --no-cache python3 py3-pip nginx sqlite tzdata
RUN pip install --user pdm

COPY --from=build /app/src/webui/dist /app/www
COPY --from=build /app/src/api /app/src/api
COPY --from=build /app/pyproject.toml /app/setup/start.sh /app
COPY --from=build /app/setup/nginx.conf /etc/nginx/http.d/default.conf

WORKDIR /app
RUN python -m pdm install --prod

CMD ./start.sh
