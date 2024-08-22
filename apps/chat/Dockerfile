# Install Stage
FROM node:18-alpine AS install

# Set the working directory
WORKDIR /app

# Copy package.json
COPY package*.json ./

# Install dependencies using Yarn
RUN yarn install --only=production
RUN yarn add sharp --ignore-engines

# Prebuild Stage
FROM node:18-alpine AS prebuild

# Set the working directory
WORKDIR /app

# Copy the installed node_modules from the install stage
COPY --from=install /app/node_modules ./node_modules

# Copy the whole project directory into the container
COPY ../../ ./

RUN cp apps/api/.env.deployment.example apps/api/.env
RUN cp apps/assignment/.env.deployment.example apps/assignment/.env
RUN cp apps/quiz/.env.deployment.example apps/quiz/.env
RUN cp apps/chat/.env.deployment.example apps/chat/.env
RUN cp apps/background-job/.env.deployment.example apps/background-job/.env
RUN cp .env.deployment.example .env

# Build the projects
RUN yarn build api
RUN yarn build assignment
RUN yarn build quiz
RUN yarn build chat
RUN yarn build background-job
RUN yarn build common

# Production Stage
FROM node:18-alpine AS production

# Set the working directory
WORKDIR /app

# Copy the built files from the prebuild stage
COPY --from=prebuild /app/dist ./dist
COPY --from=prebuild /app/node_modules ./node_modules
COPY --from=prebuild /app/package.json ./package.json
COPY --from=prebuild /app/apps/api/.env ./apps/api/.env
COPY --from=prebuild /app/apps/assignment/.env ./apps/assignment/.env
COPY --from=prebuild /app/apps/quiz/.env ./apps/quiz/.env
COPY --from=prebuild /app/apps/chat/.env ./apps/chat/.env
COPY --from=prebuild /app/apps/background-job/.env ./apps/background-job/.env
COPY --from=prebuild /app/.env ./.env

# Expose port 8080 to be accessible from outside the container
EXPOSE 8080

# Define the command to run the application
CMD ["yarn", "run", "start:prod-chat"]