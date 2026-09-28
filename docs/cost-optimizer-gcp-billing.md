# MC-Cost-Optimizer GCP Billing Setup Guide

## Overview
`mc-cost-optimizer-gcp-collector` collects daily GCP billing data from a **BigQuery billing export** table and stores it in the `gcp_billing_raw` table of the cost DB. From there it runs monthly aggregation, anomaly detection, unused-VM detection, budget checks and right-sizing.

This guide covers images **0.6.5 and later** (`cloudbaristaorg/mc-costopti-api` and `mc-costopti-gcpcollector`). In these versions:

- **Credentials** come from OpenBao and are looked up in this order:
  1. `secret/cost/gcp`: the operator service account created by the setup flow.
  2. `secret/csp/gcp`: the admin service account. This is the same credential MC-Infra-Manager (CB-Tumblebug) uses.
- **Dataset and table** come from `secret/cost/gcp` (`dataset`, `table`). If they are not set, the collector scans every dataset in the project and uses the first table whose name starts with `gcp_billing_export`.
- The dataset and table **cannot be set with environment variables**. The `.env` variables `MC_COST_OPTIMIZER_GCP_BQ_DATASET` and `MC_COST_OPTIMIZER_GCP_BQ_TABLE` were removed, because 0.6.5 and later ignore them.
- The collector reads its credentials and table **once at startup**. Restart it after the setup flow finishes or whenever `secret/cost/gcp` changes.

For images up to 0.6.0, see [Legacy (≤ 0.6.0)](#legacy--060).

```
[GCP Billing] --daily export--> [BigQuery: <dataset>.gcp_billing_export_v1_<ID>]
                                            |
      OpenBao secret/cost/gcp  ------>  gcp-collector (cron / manual)
      (operator SA, dataset, table)         |
                                            v
                                cost DB: gcp_billing_raw -> monthly / anomaly / unused / budget / right-size
```

## 1. Prerequisites (GCP)

### 1-1. Enable the BigQuery billing export
In the GCP console, go to **Billing → Billing export → BigQuery export** and enable **Standard usage cost**. Select the target project and dataset.

- The export table is created automatically. It can take a few hours, and up to a few days, before the first table appears.
- Table names depend on the export type. The billing account ID looks like `XXXXXX-XXXXXX-XXXXXX`; replace each `-` with `_` in the table name.

  | Export type | BigQuery table name |
  |---|---|
  | Standard usage cost | `gcp_billing_export_v1_<BILLING_ACCOUNT_ID>` |
  | Detailed usage cost | `gcp_billing_export_resource_v1_<BILLING_ACCOUNT_ID>` |
  | Pricing | `cloud_pricing_export` (not used by the collector) |

- The billing account ID is not a collector setting. It only appears in the table name.

> **Standard and Detailed in the same dataset**
>
> Both automatic table selection and the `billing-confirmed` step pick the first table matching `gcp_billing_export*`. If both exports exist, that is usually the **Detailed** (`..._resource_v1_...`) table, because it sorts first.
>
> Collection still works with either table, because the collector only reads columns that both tables share. The Detailed table has more rows per day, since it is per resource. To pin the Standard table, see [Troubleshooting](#5-troubleshooting).

### 1-2. Register the admin service account in OpenBao
The setup flow uses the admin service account stored at OpenBao `secret/csp/gcp` (keys `project_id`, `client_email`, `private_key`, `private_key_id`).

This entry is normally registered by MC-Infra-Manager initialization from `~/.cloud-barista/credentials.yaml` (see [infra-init](./infra-init-cmd.md)). Check whether it exists without printing any values:

```bash
# token: MC_INFRA_MANAGER_OPENBAO_VAULT_TOKEN in conf/docker/.env
docker exec -e BAO_TOKEN=<openbao-token> mc-infra-manager-openbao \
  bao kv get -format=json secret/csp/gcp | jq '.data.data | keys'
```

The admin service account needs these roles in the billing export project:

| Role | Needed for |
|---|---|
| `roles/iam.serviceAccountAdmin` | Creating the operator service account |
| `roles/resourcemanager.projectIamAdmin` | Granting roles to the operator service account |
| `roles/iam.serviceAccountKeyAdmin` | Creating the operator service account key. Without it, the `SA key generation` step fails with 403 `iam.serviceAccountKeys.create` |
| `roles/bigquery.jobUser`, `roles/bigquery.dataViewer` | Querying and auto-discovering the billing table while `secret/cost/gcp` does not exist yet |

The IAM, Cloud Resource Manager and BigQuery APIs must be enabled in the project.

## 2. Configuration (`conf/docker/.env`)

| Variable | Default (`.env.setup`) | Description |
|---|---|---|
| `MC_COST_OPTIMIZER_OPENBAO_ENABLED` | `true` | Keep this `true`. The GCP setup flow and credentials depend on OpenBao |
| `MC_COST_OPTIMIZER_OPENBAO_ADDRESS` / `_TOKEN` | MC-Infra-Manager OpenBao | Passed to both `mc-cost-optimizer-be` and `mc-cost-optimizer-gcp-collector` |
| `MC_COST_OPTIMIZER_GCP_BATCH_CRON_SCHEDULE` | `0 20 9 * * ?` | Daily collection schedule (Spring cron, `TZ=Asia/Seoul`). Each run collects the previous day |
| `MC_COST_OPTIMIZER_GCP_COLLECTOR_PORT` | `28095` | Host port of the collector (manual collection API) |
| `MC_COST_OPTIMIZER_GCP_PROJECT_ID`, `_CLIENT_EMAIL`, `_PRIVATE_KEY_ID`, `_PRIVATE_KEY` | placeholders | Read **only** when `MC_COST_OPTIMIZER_OPENBAO_ENABLED=false` |

## 3. Setup flow (0.6.5+)
The flow is exposed by `mc-cost-optimizer-be` under `/api/gcp/setup`. The Cost Optimizer UI drives the same API from its CSP settings dialog. The examples below call it from inside the BE container:

```bash
BE="docker exec mc-cost-optimizer-be curl -s"
```

**Step 1. Check the current stage.**
```bash
$BE localhost:9090/api/gcp/setup/status
# {"stage":"NO_CREDENTIALS","adminKeyPresent":true,"projectId":null,"clientEmail":null,"dataset":null,"table":null}
```

| stage | Meaning | Next action |
|---|---|---|
| `NO_CREDENTIALS` | No operator service account in `secret/cost/gcp` (`adminKeyPresent` shows whether `secret/csp/gcp` exists) | `POST /auto-provision` |
| `DATASET` | Operator service account ready, dataset not selected | `POST /dataset` |
| `BILLING_GUIDE` | Dataset selected, export not confirmed | Enable the billing export (§1-1), then `POST /billing-confirmed` |
| `WAITING_TABLE` | Confirmed, but no `gcp_billing_export*` table yet | Wait. BE re-scans daily at 09:00 |
| `COMPLETE` | Dataset and table stored in `secret/cost/gcp` | Restart the collector |

**Step 2. Provision the operator service account.**
```bash
$BE -X POST localhost:9090/api/gcp/setup/auto-provision
```
This step does the following:
1. Authenticates with the admin service account.
2. Creates `mcmp-cost-collector@<project>.iam.gserviceaccount.com`, or reuses it if it already exists.
3. Grants the operator account `roles/iam.serviceAccountUser`, `roles/bigquery.dataEditor`, `roles/bigquery.jobUser` and `roles/compute.admin`.
4. Creates a key for it.
5. Saves the key to `secret/cost/gcp`.

The step is safe to re-run after fixing a failure, for example a missing admin role. The response has a `steps[]` array; every entry must be `OK`.

**Step 3. Select the dataset.**
```bash
# use an existing billing export dataset
$BE -X POST -H 'Content-Type: application/json' \
  -d '{"action":"existing","datasetName":"<billing-export-dataset>"}' \
  localhost:9090/api/gcp/setup/dataset
# or create a new one (asia-northeast3): {"action":"create","datasetName":"mcmp_billing_export"}
```
If you create a new dataset, point the billing export at it (§1-1) before the next step.

**Step 4. Confirm the billing export.**
```bash
$BE -X POST localhost:9090/api/gcp/setup/billing-confirmed
```
This step:
1. Checks the credentials and the dataset.
2. Tests the BigQuery connection.
3. Scans the dataset for a `gcp_billing_export*` table.
4. Saves `dataset` and `table` to `secret/cost/gcp`.
5. Registers the dataset in the cost DB (`temp_cmp_user_role_arn`).

If no table is found yet, the stage becomes `WAITING_TABLE`. Otherwise it becomes `COMPLETE`.

**Step 5. Restart the collector.**
```bash
cd bin && ./mcc infra stop -s mc-cost-optimizer-gcp-collector && ./mcc infra run -s mc-cost-optimizer-gcp-collector
# or: docker restart mc-cost-optimizer-gcp-collector
```

## 4. Verification

**Collector startup log**
```bash
docker logs mc-cost-optimizer-gcp-collector 2>&1 | grep -E '크레덴셜 출처|빌링 테이블'
# GCP 크레덴셜 출처: cost/gcp (운영 SA)
# 빌링 테이블 (OpenBao cost/gcp): <dataset>.gcp_billing_export_v1_<ID>
```

**Manual collection for one day** (defaults to yesterday when `date` is omitted)
```bash
curl -s "http://localhost:28095/admin/billing/collect?date=YYYY-MM-DD"
# {"date":"YYYY-MM-DD","status":"COMPLETED","jobId":N}
docker logs --since 5m mc-cost-optimizer-gcp-collector 2>&1 | grep 'BigQuery raw 조회 완료'
```

> Collection appends rows to `gcp_billing_raw` and does not de-duplicate. Collecting the same date twice doubles that day's rows, so do not re-run a date that is already loaded.

**DB check** (`mc-cost-optimizer-db`, database `cost`)
```sql
SELECT DATE(usage_start_time) AS usage_date, COUNT(*) AS rows_cnt, ROUND(SUM(cost),2) AS cost
FROM gcp_billing_raw GROUP BY 1 ORDER BY 1 DESC LIMIT 7;

SELECT JOB_EXECUTION_ID, STATUS, EXIT_CODE FROM BATCH_JOB_EXECUTION ORDER BY JOB_EXECUTION_ID DESC LIMIT 5;
```

## 5. Troubleshooting

| Symptom (collector / BE log) | Cause | Fix |
|---|---|---|
| `UnknownHostException: mc-cost-optimizer-db`, collector restarting repeatedly | Cost DB container is stopped | `./mcc infra run -s mc-cost-optimizer-db`, then restart the collector |
| `SA key generation FAILED ... 403 iam.serviceAccountKeys.create` | Admin service account lacks `roles/iam.serviceAccountKeyAdmin` | Grant the role, then re-run `auto-provision` |
| `BigQuery 질의 실패 [403] ... bigquery.jobs.create` | The service account in use cannot run BigQuery jobs | Grant `roles/bigquery.jobUser` (project) and `roles/bigquery.dataViewer` (dataset) |
| `빌링 내보내기 테이블을 찾지 못했습니다` / stage `WAITING_TABLE` | Export not enabled, or the table is not created yet | Check §1-1 and wait for the first export |
| `OpenBao 조회 실패 (cost/gcp): 404` | Setup flow not done yet (expected before Step 2) | Run the setup flow |
| Setup completed, but the log still shows `csp/gcp (어드민 SA)` or the old table | Collector not restarted | Restart the collector |
| Detailed table (`..._resource_v1_...`) selected instead of Standard | Both exports are in the same dataset; the first `gcp_billing_export*` match wins | Optional. Collection works with either. To pin Standard, run `docker exec -e BAO_TOKEN=<openbao-token> mc-infra-manager-openbao bao kv patch secret/cost/gcp table=gcp_billing_export_v1_<ID>`, then restart the collector. Also restart `mc-cost-optimizer-be` if you want `/status` to show the new table right away (BE caches OpenBao values) |

## Legacy (≤ 0.6.0)
Images up to 0.6.0 have no setup flow:

- Credentials come from OpenBao `secret/csp/gcp`, or from the `MC_COST_OPTIMIZER_GCP_*` variables when OpenBao is disabled.
- The table is set directly with environment variables.

```
MC_COST_OPTIMIZER_GCP_BQ_DATASET=<billing-export-dataset>
MC_COST_OPTIMIZER_GCP_BQ_TABLE=gcp_billing_export_v1_<BILLING_ACCOUNT_ID with '-' -> '_'>
```

The service account in `secret/csp/gcp` needs `roles/bigquery.jobUser` and `roles/bigquery.dataViewer`. After changing `.env`, recreate the container with `./mcc infra run -s mc-cost-optimizer-gcp-collector`, then verify as in §4.
