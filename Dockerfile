FROM python:3

WORKDIR /home/dockergui

ADD requirements.txt requirements.txt
RUN \
  curl -fsSL https://get.docker.com -o get-docker.sh && \
  sh get-docker.sh && \
  curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
  chmod +x /usr/local/bin/docker-compose && \
  pip install --no-cache-dir -r requirements.txt

ADD . .
RUN chmod +x server.py start.sh

CMD ["./start.sh"]
