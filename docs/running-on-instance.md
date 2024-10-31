# Running on Instance Guide

This document provides step-by-step instructions to set up and execute the `mc-admin-cli` for the MCMP (Multi-Cloud Management Platform) environment on an instance. Please follow the steps closely to ensure proper installation and configuration.

---

## Prerequisites

Ensure you have **sudo** privileges and access to the **VM instance** where you intend to set up the MCMP platform. The guide covers installing Docker, setting up necessary directories, cloning repositories, and initializing credentials and IAM (Identity and Access Management).

To enable full functionality, open your firewall or security group to allow all traffic.

---

## Step 1: Install Docker

Install Docker and necessary dependencies to facilitate containerized operations:

```bash
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli docker-compose-plugin
```

### Add Docker Permissions for Current User
```bash
sudo usermod -aG docker $(whoami)
newgrp docker
docker ps  # Verifies Docker installation by listing running containers
```

## Step 2: Create Required Directories and Credentials File
Set up a working directory and initialize the necessary credentials configuration:

```bash
mkdir -p ~/workspace
mkdir -p ~/.cloud-barista
```


## Step 3: Clone Required Git Repositories
Navigate to the workspace directory and clone the necessary repositories:
```bash
cd ~/workspace
git clone https://github.com/cloud-barista/cb-tumblebug.git
git clone https://github.com/m-cmp/mc-admin-cli.git
git clone https://github.com/m-cmp/mc-iam-manager.git
```

## Step 4: Run mc-admin-cli
Execute `mc-admin-cli` to initialize the MCMP infrastructure:
```bash
cd ~/workspace/mc-admin-cli/bin
./mcc infra run -d
```

Wait for Services to Initialize
Allow some time for all services to start and reach a healthy state. You may verify health checks for each service if required.
It will take approximately 5 mins.


## Step 5: Initialize Credentials
If you're setting up a new instance of Tumblebug, follow these initialization steps (otherwise, skip this section if you already have Tumblebug set up).

For more information, refer to the [Tumblebug initialization guide.](https://github.com/cloud-barista/cb-tumblebug?tab=readme-ov-file#3-initialize-cb-tumblebug-to-configure-multi-cloud-info)


## Step 6: Initialize IAM (Identity and Access Management)
Install jq, a lightweight JSON processor, and set up IAM configurations:
```bash
sudo apt-get install -y jq
```

### Configure IAM Environment Variables
Edit .env to configure IAM service properties:
```bash
cd ~/workspace/mc-iam-manager/scripts/init
cp .env.initsample .env
sed -i 's|MCIAMMANAGER_HOST=https://MCIAMMANAGER_HOST|MCIAMMANAGER_HOST=http://127.0.0.1:5000|' .env
sed -i 's|MCIAMMANAGER_PLATFORMADMIN_ID=|MCIAMMANAGER_PLATFORMADMIN_ID=mcmpadmin|' .env
sed -i 's|MCIAMMANAGER_PLATFORMADMIN_PASSWORD=|MCIAMMANAGER_PLATFORMADMIN_PASSWORD=mcmpAdminPassword#@!|' .env
```

### Finalize IAM Initialization
Execute the IAM auto-initialization script:
```bash
./initauto.sh -f
```


### Add user for Console user
Execute the IAM auto-add-user script:
```bash
./add_demo_user.sh -f
```

## Step 7: Access the MCMP Platform

Upon successful initialization, access the MCMP platform via:

```bash
http://{vm-public-ip}:3001
```

> initial id: mcmpadmin
> initial password: 
Replace {vm-public-ip} with the actual public IP of your VM instance.

This completes the setup. You are now ready to manage multi-cloud services using MCMP on your instance. Happy managing!