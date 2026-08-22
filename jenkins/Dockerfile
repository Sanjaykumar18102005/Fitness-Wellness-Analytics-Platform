# Docker-outside-of-Docker Jenkins Image
FROM jenkins/jenkins:lts-jdk17

USER root

# Install Docker CLI so Jenkins can run docker commands via the host socket
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      apt-transport-https \
      ca-certificates \
      curl \
      gnupg2 \
      docker.io && \
    rm -rf /var/lib/apt/lists/*

# Add jenkins user to docker group
RUN usermod -aG docker jenkins || true

USER jenkins
