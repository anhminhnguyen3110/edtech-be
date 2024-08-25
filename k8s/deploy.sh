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

# Wait for 2 minute before deploying the next set of services
echo "Waiting for 2 minute before deploying the next set of services..."
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

# Apply the Horizontal Pod Autoscalers (HPAs)
hpa_dir="hpas"
hpa_files=("api" "assignment" "background-job" "chat" "quiz" "rabbitmq" "redis")
for hpa_file in "${hpa_files[@]}"; do
  kubectl apply -f $hpa_dir/$hpa_file.yaml -n edtech-assistant-namespace
done

# Final check to ensure everything is running as expected
kubectl get hpa -n edtech-assistant-namespace
kubectl get deployments -n edtech-assistant-namespace