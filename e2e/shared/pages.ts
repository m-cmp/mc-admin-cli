export const PAGES = {
  auth: {
    login:        '/auth/login',
    signup:       '/auth/signup',
    unauthorized: '/auth/unauthorized',
  },
  operations: {
    mciWorkloads:    '/webconsole/operations/manage/workloads/mciworkloads',
    pmkWorkloads:    '/webconsole/operations/manage/workloads/pmkworkloads',
    workspaces:      '/webconsole/operations/manage/workspaces',
    workspaceRoles:  '/webconsole/operations/manage/workspaces/roles',
    costAnalysis:    '/webconsole/operations/analytics/costanalysis',
    mciMonitoring:   '/webconsole/operations/analytics/monitorings/mcismonitoring',
  },
  settings: {
    users:        '/webconsole/settings/accountnaccess/organizations/users',
    groups:       '/webconsole/settings/accountnaccess/organizations/groups',       // TODO: discovery 확인 필요
    roles:        '/webconsole/operations/manage/workspaces/roles',                 // confirmed 2026-06-05
    policies:     '/webconsole/settings/accountnaccess/organizations/policies',     // TODO: discovery 확인 필요
    organizations:'/webconsole/settings/accountnaccess/organizations',             // TODO: discovery 확인 필요
    companies:    '/webconsole/settings/accountnaccess/companies',                 // TODO: discovery 확인 필요
    approvals:    '/webconsole/settings/accountnaccess/organizations/approvals', // FR-PLATFORM-ADMIN-001 — 가입 신청 승인 화면
    credentials:  '/webconsole/settings/environment/cloudsps/credentials',
    connections:  '/webconsole/settings/environment/cloudsps/connections',
    serverSpecs:       '/webconsole/settings/environment/cloudresources/serverspecs',
    serverImages:      '/webconsole/settings/environment/cloudresources/serverimages',
    sshKeys:           '/webconsole/settings/environment/cloudresources/sshkeys',
    dataDisk:          '/webconsole/settings/environment/cloudresources/datadisk',
    networks:          '/webconsole/settings/environment/cloudresources/networks',
    securityGroups:    '/webconsole/settings/environment/cloudresources/securitygroups',
  },
  infra: {
    templates:    '/webconsole/operations/manage/templates',                        // confirmed 2026-05-27
    scheduleJobs: '/webconsole/operations/manage/schedulejobs',                     // confirmed 2026-05-27
  },
  sw: {
    catalog:      '/webconsole/operations/manage/swcatalogs',                       // confirmed 2026-06-09 (iframe 내부: Catalog/Apps Status/Repository 탭)
    repository:   '/webconsole/operations/manage/swcatalogs',                       // TC-APP-REP-01: Repository는 swcatalogs 페이지 내 iframe > Repository 탭
    deploy:       '/webconsole/operations/manage/swcatalogs',                       // TC-APP-DEP-01~03: Apps Status 탭
    appsStatus:   '/webconsole/operations/manage/swcatalogs',                       // TC-APP-APPS-01~04: Apps Status 탭
    workflow:     '/webconsole/operations/manage/workflows',                        // TODO: discovery 확인 필요
    oss:          '/webconsole/operations/manage/swcatalogs',                       // TODO: discovery 확인 필요
  },
  data: {
    objectStorage: '/webconsole/operations/data/objectstorage',                     // confirmed 2026-05-27
    rdbms:         '/webconsole/operations/data/rdbms',                             // confirmed 2026-05-27
    nordbms:       '/webconsole/operations/data/nordbms',                           // confirmed 2026-05-27
  },
  obs: {
    // 모든 C6 TC는 observability 단일 진입점 사용 (browser 확인 2026-06-27)
    // /webconsole/operations/analytics/observability → Namespace 대시보드 (Node/K8s 탭, MCI 카드)
    observability:     '/webconsole/operations/analytics/observability',
    monitoringConfig:  '/webconsole/operations/analytics/observability',
    monitoringAgent:   '/webconsole/operations/analytics/observability',
    monitoringData:    '/webconsole/operations/analytics/observability',
    cspMetrics:        '/webconsole/operations/analytics/observability',
    k8sMetrics:        '/webconsole/operations/analytics/observability',
    metricsOverview:   '/webconsole/operations/analytics/observability',
    monitoringInsight: '/webconsole/operations/analytics/observability',
    logs:              '/webconsole/operations/analytics/observability',
    tracing:           '/webconsole/operations/analytics/observability',
    triggerPolicy:     '/webconsole/operations/analytics/observability',
    obsIframe:         '/webconsole/operations/analytics/observability',
  },
} as const;
