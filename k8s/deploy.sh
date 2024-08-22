#!/bin/bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.1/deploy/static/provider/cloud/deploy.yaml

# Create namespace
kubectl create namespace edtech-assistant-namespace

# List of directories containing the deployment and service YAML files
dirs=("rabbitmq" "redis" "prometheus" "grafana")

# Deploy services
for dir in "${dirs[@]}"; do
  kubectl apply -f $dir/deployment.yaml -n edtech-assistant-namespace
  kubectl apply -f $dir/service.yaml -n edtech-assistant-namespace
done

# Wait for 1 minute before deploying the next set of services
echo "Waiting for 1 minute before deploying the next set of services..."
sleep 120

# List of directories that require waiting between deployments
wait_dirs=("api" "assignment" "background-job" "chat" "quiz")

# Deploy services
for dir in "${wait_dirs[@]}"; do
  kubectl apply -f $dir/deployment.yaml -n edtech-assistant-namespace
  kubectl apply -f $dir/service.yaml -n edtech-assistant-namespace
done

# Deploy ingress controller and loadbalancer
kubectl apply -f ssl/issuer.yaml -n edtech-assistant-namespace
kubectl apply -f ingress/ingress.yaml -n edtech-assistant-namespace

# Dashboard
kubectl apply -f dashboard/admin.yaml
kubectl apply -f dashboard/deployment.yaml
kubectl apply -f dashboard/service.yaml

# Verify deployments
kubectl get pods -n edtech-assistant-namespace
kubectl get services -n edtech-assistant-namespace