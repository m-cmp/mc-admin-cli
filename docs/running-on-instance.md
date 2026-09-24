# Running on Single Instance Guide

This document provides step-by-step instructions to set up and execute the `mc-admin-cli` for the MCMP (Multi-Cloud Management Platform) environment on an instance. Please follow the steps closely to ensure proper installation and configuration.

This guide covers the necessary preparations for deploying the MCMP platform on a single virtual machine (VM).

---

## ✅ Prerequisites

Ensure you have **sudo** privileges and access to the **VM instance** where you intend to set up the MCMP platform. The guide covers installing Docker, cloning `mc-admin-cli`, and running `installAll.sh` — the unified installer for the whole platform (mc-infra-manager/cb-tumblebug, mc-iam-manager, mc-web-console, and the rest of the microservices).

To enable full functionality, open your firewall or security group to allow all traffic.

### 1) Provisioning the VM

To run the entire platform on a single instance using mc-admin-cli, the following minimum requirements must be met:

- OS: Ubuntu 20.04 or higher (22.04 recommended)
- Instance Specifications: t2.xlarge (4vCPU, 16GiB RAM)
- EBS Storage Size: 15 GB
  - **31 images size**: approximately 10GB
  - **additional space for vm**: up to you!

### 2) Configuring Firewall Rules (Security Groups)

- Allow all TCP communication across all ports and from all IP addresses. (Note: This configuration will be improved in the future to address security concerns.)
- Ensure port 22 is open for SSH access.

---

<br>
<br>
<br>

## 🚀 Running MCMP on Instance Guide

The following instructions **should be executed on the provisioned VM.**

> If the key pair is correctly stored on your local host, you can connect to the instance via SSH. Otherwise, you may use the web terminal provided by AWS or other cloud consoles to establish an SSH connection and access the instance's terminal before proceeding with the next steps.

```bash
ssh -i <YOUR_KEY_PAIR_DIRECTORY> <VM_USER_NAME>@<VM_PUBLIC_IP>
```

<br>

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

<br>

## Step 2: Create a Working Directory

```bash
mkdir -p ~/workspace
cd ~/workspace
```

<br>

## Step 3: Clone mc-admin-cli

`mc-admin-cli` is the **unified installer** for the whole MCMP platform — you do not clone `mc-iam-manager` or `cb-tumblebug` separately. `installAll.sh` brings every subsystem up as containers via its bundled `docker-compose.yaml`.

For stable deployment, clone a specific [released version](https://github.com/m-cmp/mc-admin-cli/releases):

```bash
git clone https://github.com/m-cmp/mc-admin-cli.git -b v0.5.0
cd mc-admin-cli/bin
./mcc --version   # optional: confirm the pre-built binary runs on this OS
```

If `./mcc --version` fails with a `GLIBC` version error (e.g. on Ubuntu 20.04), rebuild from source as a static binary — see the main [README's "Build a Static Binary" section](https://github.com/m-cmp/mc-admin-cli#build-a-static-binary).

## Step 4: Configure Environment

```bash
cd ~/workspace/mc-admin-cli/conf/docker/conf/mc-iam-manager
cp .env.setup .env
# Edit .env — set the platform admin ID/password and any other REQUIRE-marked values
```

## Step 5: Run installAll.sh

```bash
cd ~/workspace/mc-admin-cli/bin
./installAll.sh
```

`installAll.sh` prompts interactively for deployment mode and domain (see the main [README's Quick Guide](https://github.com/m-cmp/mc-admin-cli#quick-guide) for the Mode A/Mode B distinction and non-interactive flags), generates TLS certs and nginx config, then starts every container — including `mc-iam-manager-post-initial`, a one-shot setup container that seeds Keycloak realms/roles, seeds the platform's menu catalog (the bundled copy `conf/docker/conf/mc-web-console/api/conf/webconsole_menu_resources.yaml`, mounted into mc-iam-manager and pointed to by `MC_WEB_CONSOLE_MENUYAML`), and seeds role-menu permissions (bundled `conf/docker/conf/mc-iam-manager/permission.yaml`). Both seeds are applied once at first install; afterwards menus and role-menu mappings are edited in the console and live in the IAM DB (re-running post-init skips the menu step). This container exiting with code `0` is expected, not a failure.

Upgrading an existing install: `installAll.sh` only adds *missing* variables to your `.env` files, so if `conf/docker/conf/mc-iam-manager/.env` still has `MC_WEB_CONSOLE_MENUYAML` set to the old raw GitHub URL, change it to `asset/menu/webconsole_menu_resources.yaml` (or keep the URL deliberately) before re-running.

Allow a few minutes for every container to reach a healthy state.

## Step 6: Verify Startup

```bash
cd ~/workspace/mc-admin-cli/bin
./mcc infra info
```

Confirm no container shows `unhealthy` (`mc-iam-manager-post-initial` showing `Exited (0)` is expected). See the main README's Step 5 "Verify Startup" for the full set of readyz/health checks, and its Troubleshooting section if `mc-iam-manager` stays unhealthy.

If you're setting up a new instance of Tumblebug, also follow the [Tumblebug initialization guide](https://github.com/cloud-barista/cb-tumblebug?tab=readme-ov-file#3-initialize-cb-tumblebug-to-configure-multi-cloud-info).

## Step 7: Access the MCMP Platform

```bash
https://{vm-public-ip}:3001
```

#### - initial id: mcmp

#### - initial password: mcmp_password

Replace `{vm-public-ip}` with the actual public IP (or domain) of your VM instance. Use **https**; a browser certificate warning is expected in Mode A (self-signed) and can be accepted/continued through.

This completes the setup. You are now ready to manage multi-cloud services using MCMP on your instance. Happy managing!
