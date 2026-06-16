# Prebuilt MS image matching the lockfile's Playwright version.
FROM mcr.microsoft.com/playwright:v1.60.0-noble

ENV PWUSER pwuser

RUN apt-get update && apt-get install -y sudo\
 && usermod -aG sudo $PWUSER\
 && echo '%sudo ALL=(ALL) NOPASSWD:ALL' | tee -a /etc/sudoers
RUN corepack enable && corepack prepare pnpm@11 --activate

USER $PWUSER

WORKDIR /home/$PWUSER/app
RUN sudo chown -R $PWUSER:$PWUSER /home/$PWUSER/app
COPY --chown=$PWUSER:$PWUSER package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=$PWUSER:$PWUSER scripts/prepare.mjs ./scripts/prepare.mjs
RUN pnpm install --frozen-lockfile
COPY --chown=$PWUSER:$PWUSER . .

# ENTRYPOINT ["node", "./sample.js"]
