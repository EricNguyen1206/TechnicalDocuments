---
title: "Các khái niệm nâng cao về Kubernetes"
date: 2025-02-15
tags: ["kubernetes", "k8s", "devops", "containers", "nâng cao"]
description: "Các chủ đề nâng cao về Kubernetes bao gồm Ingress, StatefulSets, DaemonSets, Helm và chiến lược triển khai production."
author: "Eric Nguyen"
layout: "post"
---

# Các khái niệm nâng cao về Kubernetes

## Ingress

Ingress quản lý truy cập bên ngoài vào services trong cluster, thường là HTTP/HTTPS.

### Ingress Cơ bản

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-service
                port:
                  number: 80
```

### TLS Termination

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-ingress
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.example.com
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-service
                port:
                  number: 443
```

---

## StatefulSets

StatefulSets quản lý các ứng dụng có trạng thái với persistent storage và network identities duy nhất.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15-alpine
          ports:
            - containerPort: 5432
              name: postgres
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
  volumeClaimTemplates:
    - metadata:
        name: postgres-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

### Đặc điểm StatefulSet

- Network identities ổn định
- Persistent storage ổn định
- Triển khai và scaling theo thứ tự
- Cập nhật rolling theo thứ tự

---

## DaemonSets

DaemonSets đảm bảo tất cả (hoặc một số) nodes chạy một bản sao của Pod.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-agent
spec:
  selector:
    matchLabels:
      app: log-agent
  template:
    metadata:
      labels:
        app: log-agent
    spec:
      containers:
        - name: fluentd
          image: fluentd:v1.16-1
          volumeMounts:
            - name: varlog
              mountPath: /var/log
            - name: varlibdockercontainers
              mountPath: /var/lib/docker/containers
              readOnly: true
      tolerations:
        - key: node-role.kubernetes.io/master
          effect: NoSchedule
      volumes:
        - name: varlog
          hostPath:
            path: /var/log
        - name: varlibdockercontainers
          hostPath:
            path: /var/lib/docker/containers
```

---

## Jobs và CronJobs

### Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: batch-job
spec:
  completions: 5
  parallelism: 2
  backoffLimit: 4
  template:
    spec:
      containers:
        - name: worker
          image: busybox:1.36
          command: ["sh", "-c", "echo Hello from Kubernetes Job"]
      restartPolicy: OnFailure
```

### CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cleanup-job
spec:
  schedule: "0 2 * * *" # Chạy lúc 2 AM hàng ngày
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: cleanup
              image: busybox:1.36
              command:
                - sh
                - -c
                - find /tmp -type f -mtime +7 -delete
          restartPolicy: OnFailure
```

---

## Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

```bash
# Bật metrics server (yêu cầu cho HPA)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Kiểm tra trạng thái HPA
kubectl get hpa
kubectl describe hpa web-hpa
```

---

## Persistent Volumes

### Storage Class

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-storage
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
allowVolumeExpansion: true
```

### Persistent Volume

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nfs
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  nfs:
    server: 192.168.1.100
    path: /exports/data
```

### Persistent Volume Claim

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-nfs
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 5Gi
  storageClassName: manual
```

---

## ConfigMap như Volume

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
data:
  nginx.conf: |
    events {
      worker_connections 1024;
    }
    http {
      server {
        listen 80;
        location / {
          proxy_pass http://backend:3000;
        }
      }
    }
---
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
spec:
  containers:
    - name: nginx
      image: nginx:alpine
      volumeMounts:
        - name: config
          mountPath: /etc/nginx/nginx.conf
          subPath: nginx.conf
  volumes:
    - name: config
      configMap:
        name: nginx-config
```

---

## Service Accounts & RBAC

### Service Account

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
```

### Role

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-reader
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "watch", "list"]
```

### Role Binding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
  - kind: ServiceAccount
    name: app-sa
    namespace: default
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### ClusterRole & ClusterRoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: namespace-admin
rules:
  - apiGroups: [""]
    resources: ["namespaces"]
    verbs: ["get", "list", "create", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: namespace-admin-binding
subjects:
  - kind: ServiceAccount
    name: app-sa
    namespace: default
roleRef:
  kind: ClusterRole
  name: namespace-admin
  apiGroup: rbac.authorization.k8s.io
```

---

## Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web
spec:
  podSelector:
    matchLabels:
      app: web
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 443
```

---

## Init Containers

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-demo
spec:
  initContainers:
    - name: init-db
      image: busybox:1.36
      command: ["sh", "-c", "until nslookup db-service; do echo waiting for db; sleep 2; done"]
    - name: init-cache
      image: busybox:1.36
      command:
        ["sh", "-c", "until nslookup cache-service; do echo waiting for cache; sleep 2; done"]
  containers:
    - name: app
      image: myapp:latest
      env:
        - name: DB_HOST
          value: "db-service"
        - name: CACHE_HOST
          value: "cache-service"
```

---

## Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: web
```

---

## Resource Quotas

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-resources
  namespace: production
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    persistentvolumeclaims: 4
```

---

## Helm Package Manager

### Cài đặt Chart

```bash
# Thêm Helm repository
helm repo add bitnami https://charts.bitnami.com/bitnami

# Cập nhật repository
helm repo update

# Cài đặt chart
helm install my-release bitnami/wordpress

# Liệt kê releases
helm list

# Nâng cấp release
helm upgrade my-release bitnami/wordpress

# Gỡ bỏ release
helm uninstall my-release
```

### Tạo Custom Chart

```bash
# Tạo cấu trúc chart
helm create mychart

mychart/
├── Chart.yaml          # Chart metadata
├── values.yaml         # Giá trị cấu hình mặc định
├── charts/            # Chart dependencies
├── templates/         # Template files
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── _helpers.tpl   # Template helpers
└── NOTES.txt          # Ghi chú sử dụng
```

### Ví dụ values.yaml

```yaml
replicaCount: 3

image:
  repository: nginx
  tag: 1.25-alpine
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  port: 80

resources:
  requests:
    memory: "64Mi"
    cpu: "50m"
  limits:
    memory: "128Mi"
    cpu: "200m"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

### Triển khai với Custom Values

```bash
# Triển khai với custom values
helm install myapp mychart -f custom-values.yaml

# Triển khai với inline values
helm install myapp mychart --set replicaCount=5 --set image.tag=1.26
```

---

## Monitoring và Logging

### Prometheus Operator

```bash
# Cài đặt Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack
```

### Custom Metrics

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: web-app
  labels:
    app: web
spec:
  selector:
    matchLabels:
      app: web
  endpoints:
    - port: http
      path: /metrics
```

---

## Best Practices

### 1. Sử dụng Labels và Annotations

```yaml
metadata:
  labels:
    app: web
    environment: production
    version: v1.2.3
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8080"
```

### 2. Đặt Resource Limits

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "500m"
```

### 3. Sử dụng Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
```

### 4. Sử dụng Namespaces

```bash
# Tách biệt environments
kubectl create namespace development
kubectl create namespace staging
kubectl create namespace production
```

---

## Liên kết

- [Kubernetes Cơ bản](kubernetes-basics.md)
- [Docker Nâng cao](docker-advanced.md)
- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
