---
title: "Kubernetes Cơ bản"
date: 2025-02-15
tags: ["kubernetes", "k8s", "devops", "containers", "orchestration"]
description: "Giới thiệu về Kubernetes cơ bản bao gồm pods, deployments, services và quản lý cluster cơ bản."
author: "Eric Nguyen"
layout: "post"
---

# Kubernetes Cơ bản

## Kubernetes là gì?

Kubernetes (K8s) là nền tảng open-source để orchestrate containers, tự động hóa việc triển khai, scaling và quản lý các ứng dụng containerized.

### Lợi ích chính

- **Scalability**: Tự động scale ứng dụng lên/xuống
- **Self-healing**: Khởi động lại containers thất bại, thay thế unhealthy pods
- **Load balancing**: Phân phối traffic qua nhiều containers
- **Rollouts & Rollbacks**: Cập nhật ứng dụng mà không có downtime
- **Resource efficiency**: Tối ưu hóa sử dụng tài nguyên

---

## Các khái niệm cốt lõi

### Pod

Pod là đơn vị triển khai nhỏ nhất trong Kubernetes, đại diện cho một hoặc nhiều containers.

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
# Tạo pod
kubectl apply -f pod.yaml

# Liệt kê pods
kubectl get pods

# Xem chi tiết pod
kubectl describe pod nginx-pod

# Xem logs của pod
kubectl logs nginx-pod

# Thực thi lệnh trong pod
kubectl exec -it nginx-pod -- sh
```

### Deployment

Deployment quản lý một tập hợp các Pods giống hệt nhau và cung cấp các cập nhật declarative.

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
# Tạo deployment
kubectl apply -f deployment.yaml

# Scale deployment
kubectl scale deployment nginx-deployment --replicas=5

# Cập nhật image
kubectl set image deployment/nginx-deployment nginx=nginx:1.26

# Rollback
kubectl rollout undo deployment/nginx-deployment

# Kiểm tra trạng thái rollout
kubectl rollout status deployment/nginx-deployment
```

### Service

Service cung cấp một endpoint mạng ổn định để truy cập một tập hợp Pods.

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

#### Các loại Service

**ClusterIP** (mặc định)

- Exposes service chỉ trong cluster

**NodePort**

- Exposes service trên mỗi node với port tĩnh

**LoadBalancer**

- Exposes service bên ngoài sử dụng load balancer của cloud provider

---

## ConfigMaps và Secrets

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
# Tạo secret từ file
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
  username: YWRtaW4= # mã hóa base64
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

Namespaces cung cấp sự cách ly cho các resources trong cluster.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
```

```bash
# Tạo namespace
kubectl create namespace production

# Liệt kê resources trong namespace
kubectl get pods -n production

# Đặt namespace mặc định
kubectl config set-context --current --namespace=production
```

---

## Các lệnh cơ bản

### Thông tin Cluster

```bash
# Kiểm tra thông tin cluster
kubectl cluster-info

# Xem nodes
kubectl get nodes

# Xem chi tiết node
kubectl describe node <node-name>
```

### Quản lý Resources

```bash
# Lấy tất cả resources
kubectl get all

# Lấy resource cụ thể
kubectl get deployments

# Lấy với wide output
kubectl get pods -o wide

# Lấy ở định dạng YAML
kubectl get pod nginx-pod -o yaml

# Xóa resources
kubectl delete pod nginx-pod
kubectl delete -f pod.yaml

# Xóa tất cả pods
kubectl delete pods --all
```

---

## Labels và Selectors

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
# Lọc theo label
kubectl get pods -l app=nginx

# Lọc theo nhiều labels
kubectl get pods -l app=nginx,environment=production

# Thêm label
kubectl label pod nginx-pod environment=production

# Xóa label
kubectl label pod nginx-pod environment-
```

---

## Probes

### Liveness Probe

Kiểm tra xem container còn đang chạy không.

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
```

### Readiness Probe

Kiểm tra xem container đã sẵn sàng phục vụ traffic chưa.

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Startup Probe

Kiểm tra xem ứng dụng đã khởi động chưa.

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

## Ví dụ Quick Start

```yaml
# Ví dụ hoàn chỉnh với deployment và service
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
# Apply manifest
kubectl apply -f web-app.yaml

# Kiểm tra trạng thái
kubectl get pods,svc

# Truy cập ứng dụng
kubectl port-forward svc/web-service 8080:80
```

---

## Liên kết

- [Docker Cơ bản](docker-basics.md)
- [Docker Nâng cao](docker-advanced.md)
- [Kubernetes Nâng cao](kubernetes-advanced.md)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
