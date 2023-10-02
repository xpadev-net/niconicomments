# Prebuilt MS image
FROM mcr.microsoft.com/playwright:focal

ENV PWUSER pwuser

# Install aws-lambda-ric build dependencies
#RUN echo 'nameserver 1.1.1.1' | tee /etc/resolv.conf
RUN apt-get update && apt-get install -y sudo\
 && usermod -aG sudo $PWUSER\
 && echo '%sudo ALL=(ALL) NOPASSWD:ALL' | tee -a /etc/sudoers
RUN npm i -g pnpm

USER $PWUSER

WORKDIR /home/$PWUSER/app
RUN sudo chown -R $PWUSER:$PWUSER /home/$PWUSER/app
COPY --chown=$PWUSER:$PWUSER . .
RUN sudo chown -R $PWUSER:$PWUSER /home/$PWUSER/app
RUN pnpm add playwright
RUN pnpm playwright install firefox

# ENTRYPOINT ["node", "./sample.js"]