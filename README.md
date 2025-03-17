# **Kubernetes Bare-Metal Cluster Deployment with CI/CD & Datadog Monitoring**

## **🚀 Project Overview**

This project demonstrates how to deploy a simple web application on a **3-node bare-metal Kubernetes cluster** using **GitHub Actions for CI/CD** and **Datadog for monitoring**.

---

## **📌 Prerequisites**

Before proceeding, ensure you have the following:

- **Amazon linux Ami**
- **Docker with Kubernetes enabled**
- **kubectl** (CLI tool for Kubernetes)
- **kubeadm, kubelet, kubectl** installed
- **A GitHub repository with GitHub Actions enabled**
- **A Datadog API key** (for monitoring)

---

## **🛠️ Step 1: Set Up Kubernetes Cluster**

### **1️⃣ Initialize the Master Node**

```bash
sudo swapoff -a ##Prevent Kubernetes from relying on swap space by running

sudo kubeadm init --pod-network-cidr=10.244.0.0/16
```

- Copy the `kubeadm join` command for worker nodes.
- Configure `kubectl` for the current user:

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### **2️⃣ Join Worker Nodes**

On each worker node, run the `kubeadm join` command copied from step 1.

### **3️⃣ Install a Pod Network (Flannel)**

```bash
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

### **4️⃣ Verify Cluster Setup**

```bash
kubectl get nodes
```

✅ **Expected Output:** All nodes should be in `Ready` status.

---

## **🖥️ Step 2: Deploy the Web Application**

### **1️⃣ Apply Kubernetes Manifests**

```bash
kubectl apply -f web-app.yaml
kubectl apply -f web-app-service.yaml
```

### **2️⃣ Verify Deployment**

```bash
kubectl get pods
kubectl get svc
```

✅ **Expected Output:** The service should be running and assigned a cluster IP.

---

## **🔄 Step 3: Set Up CI/CD with GitHub Actions**

### **1️⃣ Generate an SSH Key for GitHub Actions**

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions"
```

- Add the **public key** to `~/.ssh/authorized_keys` on the server.
- Add the **private key** as a **GitHub Secret** (`SSH_PRIVATE_KEY`).

### **2️⃣ Add GitHub Secrets**

Go to **GitHub Repository → Settings → Secrets and Variables → Actions**, then add the following secrets:

| Secret Name      | Value |
|-----------------|---------------------------|
| SSH_PRIVATE_KEY | Contents of `~/K3S.pem` (Private Key) |
| HOST           | Your server’s public IP (`curl ifconfig.me`) |
| USERNAME       | Your Linux username (e.g., `ubuntu` or `root`) |
| DOCKER_USERNAME | Your Docker Hub username |
| DOCKER_PASSWORD | Your Docker Hub password |

To get the Base64 encoded Kubernetes config, run:

```bash
cat ~/.kube/config | base64 -w 0
```

Copy the output and paste it as the value of `KUBE_CONFIG`.

### **3️⃣ Push Changes & Trigger Deployment**

Once the secrets are configured, push your code to GitHub, and the GitHub Actions pipeline will automatically deploy your application.

---

## **📊 Step 4: Set Up Datadog Monitoring**

### **1️⃣ Install Datadog Agent on Kubernetes Cluster**

```bash
helm repo add datadog https://helm.datadoghq.com
helm repo update
kubectl create namespace datadog
helm install datadog-agent --set datadog.apiKey=<YOUR_DATADOG_API_KEY> --namespace datadog datadog/datadog
```

### **2️⃣ Verify Datadog Agent**

```bash
kubectl get pods -n datadog
```

✅ **Expected Output:** The Datadog agent should be running.

---

## **🛠️ Step 5: Troubleshooting**

### **1️⃣ Check Kubernetes Logs**

```bash
kubectl logs -n kube-system kube-apiserver-$(hostname)
```

### **2️⃣ Check Pod and Service Status**

```bash
kubectl get pods -A
kubectl get svc -A
```

### **3️⃣ Check If Port 22 is Open for SSH**

```bash
nc -zv <your-public-ip> 22
```

### **4️⃣ Restart SSH Service (If Needed)**

```bash
sudo systemctl restart ssh
```

---

## **🎯 Conclusion**

You have successfully:
✅ Set up a **Kubernetes cluster** on bare metal.
✅ Deployed a **web application** using **CI/CD (GitHub Actions)**.
✅ Monitored the cluster with **Datadog**.

🚀 **Now, you can modify, scale, and enhance this project as needed!**

