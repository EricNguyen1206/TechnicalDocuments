---
title: "Kubernetes Basics"
date: 2025-02-15
tags: ["kubernetes", "k8s", "devops", "containers", "orchestration"]
description: "Introduction to Kubernetes fundamentals including pods, deployments, services, and basic cluster management."
author: "Eric Nguyen"
layout: "post"
---

# Kubernetes Basics

## What is Kubernetes?

Kubernetes (K8s) is an open-source container orchestration platform that automates deployment, scaling, and management of containerized applications.

### Key Benefits

- **Scalability**: Automatically scale applications up and down
- **Self-healing**: Restart failed containers, replace unhealthy pods
- **Load balancing**: Distribute traffic across multiple containers
- **Rollouts & Rollbacks**: Update applications without downtime
- **Resource efficiency**: Optimize resource utilization

---

## Core Concepts

### Pod

A Pod is the smallest deployable unit in Kubernetes, representing one or more containers.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
spec:
  containers:
    - name: nginx
      image: nginx:1.25-alpine
      ports:
        - containerPort: 80
```

```bash
# Create a pod
kubectl apply -f pod.yaml

# List pods
kubectl get pods

# View pod details
kubectl describe pod nginx-pod

# Get pod logs
kubectl logs nginx-pod

# Execute command in pod
kubectl exec -it nginx-pod -- sh
```

### Deployment

A Deployment manages a set of identical Pods and provides declarative updates.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.25-alpine
          ports:
            - containerPort: 80
```

```bash
# Create deployment
kubectl apply -f deployment.yaml

# Scale deployment
kubectl scale deployment nginx-deployment --replicas=5

# Update image
kubectl set image deployment/nginx-deployment nginx=nginx:1.26

# Rollback
kubectl rollout undo deployment/nginx-deployment

# Check rollout status
kubectl rollout status deployment/nginx-deployment
```

### Service

A Service provides a stable network endpoint to access a set of Pods.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: LoadBalancer
```

#### Service Types

**ClusterIP** (default)

- Exposes service within cluster only

**NodePort**

- Exposes service on each node's IP at a static port

**LoadBalancer**

- Exposes service externally using cloud provider's load balancer

---

## ConfigMaps and Secrets

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  app.properties: |
    port=8080
    mode=production
  database.url: "postgresql://db:5432/app"
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: config-pod
spec:
  containers:
    - name: app
      image: myapp:latest
      envFrom:
        - configMapRef:
            name: app-config
```

### Secret

```bash
# Create secret from file
kubectl create secret generic db-secret \
  --from-literal=username=admin \
  --from-literal=password=secret123
```

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  username: YWRtaW4= # base64 encoded
  password: c2VjcmV0MTIz
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-pod
spec:
  containers:
    - name: app
      image: myapp:latest
      env:
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: username
```

---

## Namespaces

Namespaces provide isolation for resources within a cluster.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
```

```bash
# Create namespace
kubectl create namespace production

# List resources in namespace
kubectl get pods -n production

# Set default namespace
kubectl config set-context --current --namespace=production
```

---

## Basic Commands

### Cluster Info

```bash
# Check cluster info
kubectl cluster-info

# View nodes
kubectl get nodes

# View node details
kubectl describe node <node-name>
```

### Resource Management

```bash
# Get all resources
kubectl get all

# Get specific resource
kubectl get deployments

# Get with wide output
kubectl get pods -o wide

# Get in YAML format
kubectl get pod nginx-pod -o yaml

# Delete resources
kubectl delete pod nginx-pod
kubectl delete -f pod.yaml

# Delete all pods
kubectl delete pods --all
```

---

## Labels and Selectors

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: labeled-pod
  labels:
    app: nginx
    environment: production
    tier: frontend
spec:
  containers:
    - name: nginx
      image: nginx:alpine
```

```bash
# Filter by label
kubectl get pods -l app=nginx

# Filter by multiple labels
kubectl get pods -l app=nginx,environment=production

# Add label
kubectl label pod nginx-pod environment=production

# Remove label
kubectl label pod nginx-pod environment-
```

---

## Probes

### Liveness Probe

Checks if the container is still running.

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
```

### Readiness Probe

Checks if the container is ready to serve traffic.

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Startup Probe

Checks if the application has started.

```yaml
startupProbe:
  httpGet:
    path: /startup
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
```

---

## Resource Limits

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: resource-pod
spec:
  containers:
    - name: app
      image: myapp:latest
      resources:
        requests:
          memory: "128Mi"
          cpu: "100m"
        limits:
          memory: "256Mi"
          cpu: "500m"
```

---

## Quick Start Example

```yaml
# Complete example with deployment and service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.25-alpine
          ports:
            - containerPort: 80
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
  type: LoadBalancer
```

```bash
# Apply the manifest
kubectl apply -f web-app.yaml

# Check status
kubectl get pods,svc

# Access application
kubectl port-forward svc/web-service 8080:80
```

---

## Links

- [Docker Basics](docker-basics.md)
- [Docker Advanced](docker-advanced.md)
- [Kubernetes Advanced](kubernetes-advanced.md)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
