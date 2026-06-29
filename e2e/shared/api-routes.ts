// mc-application-manager 직접 접근 base URL (.env.external-ip: APP_MANAGER_BASE_URL)
const APP_MANAGER = process.env.APP_MANAGER_BASE_URL || 'https://15.164.139.37:18084';

// mc-data-manager 직접 접근 base URL (.env.external-ip: DATA_MANAGER_BASE_URL)
// 인증 불필요. FE + API 동일 포트 3300. Swagger: /swagger/index.html
const DATA_MANAGER = process.env.DATA_MANAGER_BASE_URL || 'https://15.164.139.37:3300';

// API 경로 패턴. explore-*.ts discovery로 확정한 값. TODO 항목은 discovery 필요.
export const API_ROUTES = {

  // --- IAM (mc-iam-manager) ---
  auth: {
    login:    '/api/auth/login',
    logout:   '/api/auth/logout',
    refresh:  '/api/auth/refresh',
    userinfo: '/api/auth/userinfo',
    signup:   '/api/auth/signup',   // POST — 신규 사용자 가입 신청 (enabled=false 로 생성, 관리자 승인 대기)
  },
  iam: {
    // 로그인 후 메뉴/워크스페이스 초기 로드
    menus:              '/api/mc-iam-manager/GetAllAvailableMenus',           // POST
    listUserWorkspaces: '/api/mc-iam-manager/listUserWorkspaces',             // POST
    getProjects:        '/api/mc-iam-manager/getProjectsByWorkspaceId',       // POST (workspace flow)
    // Users — 모든 IAM API는 POST 방식 (body 없이도 동작)
    listUsers:          '/api/mc-iam-manager/Listusers',                      // POST (discovery 확정: 대문자 L)
    createUser:         '/api/mc-iam-manager/Createuser',                     // POST — body: { request: { username, email, firstName, lastName, enabled } } (소문자 u 확정)
    resetUserPassword:  '/api/mc-iam-manager/ResetUserPassword',              // POST — body: { pathParams: { userId }, request: { newPassword } } (확정: 생성 후 별도 호출 필요)
    updateUser:         '/api/mc-iam-manager/updateUser',                     // POST — body: { pathParams: { userId }, request: { ... } }
    deleteUser:         '/api/mc-iam-manager/deleteUser',                     // POST — body: { pathParams: { userId } }
    getUser:            '/api/mc-iam-manager/Getuserbyname',                  // POST — body: { pathParams: { username } } (discovery 확정)
    // Roles
    listRoles:          '/api/mc-iam-manager/ListRoles',                      // POST (TODO: discovery 확인)
    createRole:         '/api/mc-iam-manager/CreateRole',                     // POST (TODO)
    updateRole:         '/api/mc-iam-manager/UpdateRole',                     // POST (TODO)
    deleteRole:         '/api/mc-iam-manager/DeleteRole',                     // POST (TODO)
    // Policies (Permissions)
    listPolicies:       '/api/mc-iam-manager/listMciamPermissions',           // POST (discovery 확정)
    createPolicy:       '/api/mc-iam-manager/CreatePermission',               // POST (TODO)
    updatePolicy:       '/api/mc-iam-manager/UpdatePermission',               // POST (TODO)
    deletePolicy:       '/api/mc-iam-manager/DeletePermission',               // POST (TODO)
    // User-Role assignment
    assignRoleToUser:        '/api/mc-iam-manager/assignPlatformRole',        // POST — @deprecated: assignPlatformRole 직접 사용 권장. body: { request: { userId, roleId, roleName, roleType: 'platform' } }
    assignPlatformRole:      '/api/mc-iam-manager/assignPlatformRole',        // POST — { request: { userId, roleId, roleName, roleType: 'platform' } }
    removePlatformRole:      '/api/mc-iam-manager/removePlatformRole',        // DELETE — { request: { userId, roleId, roleType: 'platform' } }
    updateUserStatus:        '/api/mc-iam-manager/UpdateUserStatus',          // POST — { pathParams: { userId }, request: { status: 'approved' } }
    // Platform Roles (menu-roles)
    listPlatformRoles:       '/api/mc-iam-manager/listPlatformRoles',         // POST — menu-roles 목록
    // Group-Platform Role assignment
    assignGroupPlatformRole: '/api/mc-iam-manager/assignGroupPlatformRole',   // POST — { pathParams: { groupId }, request: { role_id } }
    getGroupPlatformRoles:   '/api/mc-iam-manager/getGroupPlatformRoles',     // POST — { pathParams: { groupId } }
    removeGroupPlatformRole: '/api/mc-iam-manager/removeGroupPlatformRole',   // POST — { pathParams: { groupId, roleId } }
    // Group-Workspace assignment
    assignGroupUsers:        '/api/mc-iam-manager/assignGroupUsers',          // POST — { pathParams: { groupId }, request: { user_ids: [] } }
    // Workspace Roles
    listWorkspaceRoles:          '/api/mc-iam-manager/listWorkspaceRoles',                    // POST — 전체 workspace role 목록 (old API)
    listWorkspaceRolesList:      '/api/mc-iam-manager/Listworkspaceroles',                    // POST — 새 API: { } → responseData: [{name, ...}]
    addUserToWorkspace:          '/api/mc-iam-manager/addUserToWorkspace',                    // POST — { pathParams: { id: workspaceId }, request: { userId, workspaceRoleId } } (old)
    assignWorkspaceRoleByName:   '/api/mc-iam-manager/CreateWorkspaceUserRoleMappingByName',  // POST — { request: { workspaceId, roleName, username } } (새 API)
    removeWorkspaceRoleByName:   '/api/mc-iam-manager/DeleteWorkspaceUserRoleMapping',        // POST — { request: { workspaceId, username, roleName } } (새 API)
    // Groups (Organizations) — conf/api.yaml:1073-1112 확정
    listGroups:          '/api/mc-iam-manager/Getorganizations',               // POST — body 없음 (flat list)
    listGroupsTree:      '/api/mc-iam-manager/Getorganizations',               // POST — { queryParams: { tree: "true" } }
    getGroupById:        '/api/mc-iam-manager/Getorganizationbyid',            // POST — { pathParams: { organizationId } }
    getGroupByCode:      '/api/mc-iam-manager/Getorganizationbycode',          // POST — { pathParams: { code } }
    createGroup:         '/api/mc-iam-manager/Createorganization',             // POST — { request: { name, description, parent_id?, organization_code? } }
    updateGroup:         '/api/mc-iam-manager/Updateorganization',             // POST — { pathParams: { organizationId }, request: { name, description, ... } }
    deleteGroup:         '/api/mc-iam-manager/Deleteorganization',             // POST — { pathParams: { organizationId } } — 하위 그룹·소속 사용자 있으면 400
    getGroupUsers:       '/api/mc-iam-manager/Getorganizationusers',           // POST — { pathParams: { organizationId } }
    assignUserToGroup:   '/api/mc-iam-manager/Assignuserorganizations',        // POST — { pathParams: { userId }, request: { organization_ids: [id] } }
    getUserGroups:       '/api/mc-iam-manager/Getuserorganizations',           // POST — { pathParams: { userId } }
    removeUserFromGroup: '/api/mc-iam-manager/Removeuserorganization',         // POST — { pathParams: { userId, organizationId } }
    // Workspaces
    listWorkspaces:               '/api/mc-iam-manager/listWorkspaces',                          // POST (discovery 확정)
    createWorkspace:              '/api/mc-iam-manager/CreateWorkspace',                         // POST (TODO)
    createWorkspaceUserRoleMapping: '/api/mc-iam-manager/assignWorkspaceRole',                    // POST — { request: { workspaceId, roleId, userId } } (all strings)
    removeWorkspaceRole:            '/api/mc-iam-manager/removeWorkspaceRole',                    // DELETE — { request: { workspaceId, roleId, userId } } (all strings)
    updateWorkspace:    '/api/mc-iam-manager/UpdateWorkspace',                // POST (TODO)
    deleteWorkspace:    '/api/mc-iam-manager/DeleteWorkspace',                // POST (TODO)
    // Projects
    listProjects:       '/api/mc-iam-manager/listProjects',                   // POST (discovery 확정)
    createProject:      '/api/mc-iam-manager/CreateProject',                  // POST (TODO)
    updateProject:      '/api/mc-iam-manager/UpdateProject',                  // POST (TODO)
    deleteProject:      '/api/mc-iam-manager/DeleteProject',                  // POST (TODO)
    // User-Workspace-Role assignment
    listUsersAndRolesByWorkspaces: '/api/mc-iam-manager/listUsersAndRolesByWorkspaces', // POST (discovery 확정)
    assignWorkspaceToUser: '/api/mc-iam-manager/AssignWorkspaceRoleToUser',   // POST (TODO)
    // Organizations (Groups의 alias — 동일 API)
    listOrgs:   '/api/mc-iam-manager/Getorganizations',
    createOrg:  '/api/mc-iam-manager/Createorganization',
    updateOrg:  '/api/mc-iam-manager/Updateorganization',
    deleteOrg:  '/api/mc-iam-manager/Deleteorganization',
    // Companies (TODO: discovery 필요)
    listCompanies:      '/api/mc-iam-manager/listCompanies',                  // POST (TODO)
    createCompany:      '/api/mc-iam-manager/CreateCompany',                  // POST (TODO)
    updateCompany:      '/api/mc-iam-manager/UpdateCompany',                  // POST (TODO)
    deleteCompany:      '/api/mc-iam-manager/DeleteCompany',                  // POST (TODO)
  },

  // --- CSP (cb-spider via mc-infra-manager proxy) ---
  csp: {
    // Credentials (CredentialHolder)
    listCredentials:    '/api/mc-infra-manager/GetCredentialHolderList',      // POST — responseData.credentialHolderList[]
    getCredential:      '/api/mc-infra-manager/GetCredentialHolder',          // POST — pathParams.credentialHolder
    createCredential:   '/api/mc-infra-manager/CreateCredentialHolder',       // POST (TODO)
    updateCredential:   '/api/mc-infra-manager/UpdateCredentialHolder',       // POST (TODO)
    deleteCredential:   '/api/mc-infra-manager/DeleteCredentialHolder',       // POST (TODO)
    // Connections (ConnConfig)
    listConnections:    '/api/mc-infra-manager/GetConnConfigList',            // POST — responseData.connectionconfig[]
    listConnectionsByCredential: '/api/mc-infra-manager/FilterConnConfigByCredentialHolder', // POST
    createConnection:   '/api/mc-infra-manager/CreateConnConfig',             // POST (TODO)
    deleteConnection:   '/api/mc-infra-manager/DeleteConnConfig',             // POST (TODO)
    // Server Specs
    listServerSpecs:    '/api/mc-infra-manager/ListVMSpec',                   // POST — pathParams.connectionName (TODO: workspace needed)
  },

  // --- INFRA (cb-tumblebug / mc-infra-manager) ---
  // 모든 INFRA API는 pathParams.nsId 필수. nsId는 project.nsid 값 (기본: "default")
  infra: {
    // MCI (Multi-Cloud Infrastructure)
    listMci:            '/api/mc-infra-manager/GetAllInfra',                 // POST — pathParams.nsId, responseData.infra[]
    getMci:             '/api/mc-infra-manager/GetInfra',                    // POST — pathParams.{nsId, infraId}
    createMci:          '/api/mc-infra-manager/CreateMci',                   // POST — TODO: 요청 형식 확인 필요
    createMciDynamic:   '/api/mc-infra-manager/PostInfraDynamic',             // POST — pathParams.nsId + nodeGroups[] (동적 스펙 기반 생성)
    reviewMciDynamic:   '/api/mc-infra-manager/PostInfraDynamicCheckRequest', // POST — 생성 전 pre-flight (overallStatus: Ready|Warning|Error)
    controlMci:         '/api/mc-infra-manager/GetControlInfra',             // POST — pathParams.{nsId, infraId}, queryParams.action=suspend|resume|reboot
    deleteMci:          '/api/mc-infra-manager/DelMci',                      // POST — pathParams.{nsId, mciId} (TODO)
    delInfra:           '/api/mc-infra-manager/DelInfra',                    // POST — pathParams.{nsId, infraId}, queryParams.option=force
    cmdMci:             '/api/mc-infra-manager/PostCmdInfra',                 // POST — pathParams.{nsId, infraId}, command
    mciLifecycle:       '/api/mc-infra-manager/ControlLifecycleVm',          // POST — VM 단위 lifecycle (MCI 전체는 controlMci 사용)
    // SSH Keys
    listSshKeys:        '/api/mc-infra-manager/Getallsshkey',                // POST — pathParams.nsId, responseData.sshKey[]
    getSshKey:          '/api/mc-infra-manager/Getsshkey',                   // POST — pathParams.{nsId, sshKeyId}, responseData: key info + privateKey
    createSshKey:       '/api/mc-infra-manager/Postsshkey',                  // POST — TODO
    deleteSshKey:       '/api/mc-infra-manager/Delsshkey',                   // POST — TODO
    // VNet Templates
    listTemplates:      '/api/mc-infra-manager/GetAllVNetTemplate',           // POST — pathParams.nsId, responseData.templates[]
    createTemplate:     '/api/mc-infra-manager/PostVNetTemplate',             // POST — pathParams.nsId + request.{name,description,vNetPolicy}
    getTemplate:        '/api/mc-infra-manager/GetVNetTemplate',              // POST — pathParams.{nsId,templateId}
    deleteTemplate:     '/api/mc-infra-manager/DeleteVNetTemplate',           // POST — pathParams.{nsId,templateId}
    // CSP Resource Schedule Jobs
    listScheduleJobs:   '/api/mc-infra-manager/GetScheduleRegisterCspResourcesList', // POST — {}, responseData.jobs[]
    createScheduleJob:  '/api/mc-infra-manager/PostScheduleRegisterCspResources',    // POST — request.{jobType,nsId,connectionName,intervalSeconds,mciNamePrefix}
    pauseScheduleJob:   '/api/mc-infra-manager/PutScheduleRegisterCspResourcesPause', // POST — pathParams.jobId
    deleteScheduleJob:  '/api/mc-infra-manager/DeleteScheduleRegisterCspResources',   // POST — pathParams.jobId
    // K8s (PMK) — 클러스터
    listK8s:            '/api/mc-infra-manager/GetAllK8sCluster',             // POST — pathParams.nsId → responseData.K8sClusterInfo[]
    createK8s:          '/api/mc-infra-manager/PostK8sCluster',               // POST — Expert: vNetId+subnetIds+securityGroupIds 필수
    getK8s:             '/api/mc-infra-manager/Getk8scluster',                // POST — pathParams.{nsId, k8sClusterId} → responseData.{status, k8sNodeGroupList[]}
    deleteK8s:          '/api/mc-infra-manager/DeleteK8sCluster',             // POST — pathParams.{nsId, k8sClusterId}
    // K8s (PMK) — Simple (Dynamic) Creation
    reviewK8sDynamic:   '/api/mc-infra-manager/Postk8sclusterdynamiccheckrequest', // POST — Request.{specId:[]} → reqCheck[].connectionConfigCandidates
    createK8sDynamic:   '/api/mc-infra-manager/Postk8sclusterdynamic',        // POST — Request.{name,connectionName,specId,imageId,nodeGroupName}
    // K8s (PMK) — NodeGroup
    addK8sNodeGroup:    '/api/mc-infra-manager/Postk8snodegroup',             // POST — pathParams.{nsId,k8sClusterId} + request.{name,specId,imageId,sshKeyId,minNodeSize(int),maxNodeSize(int),desiredNodeSize(int),onAutoScaling(string)}
    deleteK8sNodeGroup: '/api/mc-infra-manager/Deletek8snodegroup',           // POST — pathParams.{nsId,k8sClusterId,k8sNodeGroupName}
  },

  // --- COST (mc-cost-optimizer-fe) ---
  costAnalysis: {
    getApiHosts:     '/api/getapihosts',
    getCurMonthBill: '/api/costopti/be/getCurMonthBill',
    getTop5Bill:     '/api/costopti/be/getTop5Bill',
    getBillAsset:    '/api/costopti/be/getBillAsset',
  },

  // --- OBS (mc-observability) ---
  obs: {
    listMonitoringTargets: '/api/mc-observability/targets',                  // TODO
    installAgent:          '/api/mc-observability/agents/install',           // TODO
    listLogs:              '/api/mc-observability/logs',                     // TODO
    listTraces:            '/api/mc-observability/traces',                   // TODO
    listInsights:          '/api/mc-observability/insights',                 // TODO
  },

  // --- SW (mc-application-manager) — 직접 접근 (Bearer auth, responseData 래퍼 없음) ---
  // 응답 형식: { code: 200, message: "...", detail: null, data: ... }
  sw: {
    // Repository (TC-APP-REP-*) — /oss/v1/repositories/nexus/{list|create|detail/{name}|delete/{name}}
    listRepository:    `${APP_MANAGER}/oss/v1/repositories/nexus/list`,           // TC-APP-REP-01: GET
    createRepository:  `${APP_MANAGER}/oss/v1/repositories/nexus/create`,         // TC-APP-REP-02: POST
    getRepository:     `${APP_MANAGER}/oss/v1/repositories/nexus/detail`,         // TC-APP-REP-03: GET /{name}
    deleteRepository:  `${APP_MANAGER}/oss/v1/repositories/nexus/delete`,         // TC-APP-REP-05: DELETE /{name}
    // Catalog (TC-APP-CAT-*)
    listCatalog:       `${APP_MANAGER}/catalog/software`,                           // TC-APP-CAT-01: GET (trailing slash 제거 필수 — /software/는 9999 반환)
    getAppCatalog:     `${APP_MANAGER}/catalog/software`,                          // TC-APP-CAT-02: GET /{id}
    searchExtCatalog:  `${APP_MANAGER}/search/dockerhub`,                          // TC-APP-CAT-03: GET /{keyword}
    uploadExtCatalog:  `${APP_MANAGER}/catalog/software/upload`,                   // TC-APP-CAT-04: TODO discovery
    createAppCatalog:  `${APP_MANAGER}/catalog/software`,                          // TC-APP-CAT-05: POST
    updateAppCatalog:  `${APP_MANAGER}/catalog/software`,                          // TC-APP-CAT-06: PATCH /{id}
    deleteAppCatalog:  `${APP_MANAGER}/catalog/software`,                          // TC-APP-CAT-07: DELETE /{id}
    // Deploy (TC-APP-DEP-*)
    deploySw:          `${APP_MANAGER}/deploy`,                                    // TC-APP-DEP-01~03: TODO discovery
    // Apps Status (TC-APP-APPS-*)
    listAppsStatus:    `${APP_MANAGER}/apps`,                                      // TC-APP-APPS-01: TODO discovery
    getAppsDetail:     `${APP_MANAGER}/apps`,                                      // TC-APP-APPS-02: GET /{id}
    restartApp:        `${APP_MANAGER}/apps/restart`,                              // TC-APP-APPS-03
    stopApp:           `${APP_MANAGER}/apps/stop`,                                 // TC-APP-APPS-03
    uninstallApp:      `${APP_MANAGER}/apps/uninstall`,                            // TC-APP-APPS-03
    submitRating:      `${APP_MANAGER}/apps/rating`,                               // TC-APP-APPS-04
    listWorkflows:     '/api/mc-workflow-manager/workflows',                          // TODO — 일반 목록 (discovery 필요)
    listWorkflowsEl:   '/api/mc-workflow-manager/eventlistener/workflowList/N',       // TC-WORKFLOW-DETAIL-01 기준 (UI 실제 호출 경로)
    listWorkflowsElY:  '/api/mc-workflow-manager/eventlistener/workflowList/Y',       // EventListener 연결 WF 목록 (TC-WORKFLOW-EL-07)
    runWorkflow:       '/api/mc-workflow-manager/workflows/run',                      // TC-WORKFLOW-RUN-01: POST /workflow/run
    runWorkflowPost:   '/api/mc-workflow-manager/workflow/run',                       // C3-Step5: POST /workflow/run (단수 경로)
    getWorkflowDetail: '/api/mc-workflow-manager/eventlistener/workflowDetail',       // TC-WORKFLOW-DETAIL-02: GET /eventlistener/workflowDetail/{idx}/N
    getRunHistory:     '/api/mc-workflow-manager/workflow/runHistory',                // TC-WORKFLOW-DETAIL-05: GET /workflow/runHistory/{idx}
    getWorkflowLog:    '/api/mc-workflow-manager/workflow/log',                       // TC-WORKFLOW-RUN-03: GET /workflow/log/{idx}
    // OSS (mc-workflow-manager) — C3 Step 2, SCENARIOS.md WORKFLOW-OSS
    listOss:           '/api/mc-workflow-manager/oss/list',                           // GET — OSS 목록 조회
    createOss:         '/api/mc-workflow-manager/oss',                                // POST — OSS 등록
    checkOssConnection:'/api/mc-workflow-manager/oss/connection-check',               // POST — 연결 확인
    updateOss:         '/api/mc-workflow-manager/oss',                                // PATCH /{ossIdx}
    deleteOss:         '/api/mc-workflow-manager/oss',                                // DELETE /{ossIdx}
    // WF management (mc-workflow-manager) — C3 Step 3/4
    checkWfDuplicate:  '/api/mc-workflow-manager/workflow/name/duplicate',            // GET ?workflowName=xxx
    getWfTemplate:     '/api/mc-workflow-manager/workflow/template',                  // GET /{name}
    createWorkflow:    '/api/mc-workflow-manager/workflow',                           // POST
    updateWorkflow:    '/api/mc-workflow-manager/workflow',                           // PATCH /{wfIdx}
    deleteWorkflow:    '/api/mc-workflow-manager/workflow',                           // DELETE /{wfIdx}
    // Event Listener (mc-workflow-manager) — TC-WF-EL-*
    listEventListeners:  '/api/mc-workflow-manager/eventlistener/list',               // GET — EL 목록
    createEventListener: '/api/mc-workflow-manager/eventlistener',                    // POST — EL 생성
    updateEventListener: '/api/mc-workflow-manager/eventlistener',                    // PATCH /{elIdx}
    deleteEventListener: '/api/mc-workflow-manager/eventlistener',                    // DELETE /{elIdx}
  },

  // --- DATA (mc-data-manager) ---
  // 직접 접근: https://15.164.139.37:3300 (인증 불필요, FE+API 동일 포트)
  // Swagger: https://15.164.139.37:3300/swagger/index.html
  data: {
    // Health
    healthcheck:            `${DATA_MANAGER}/readyZ`,
    // Task lists (read-only, no auth)
    allTasks:               `${DATA_MANAGER}/tasks`,
    generateList:           `${DATA_MANAGER}/generate`,
    migrateList:            `${DATA_MANAGER}/migrate`,
    backupList:             `${DATA_MANAGER}/backup`,
    restoreList:            `${DATA_MANAGER}/restore`,
    // Credentials / Namespace
    credentialList:         `${DATA_MANAGER}/credentials`,
    namespace:              `${DATA_MANAGER}/namespace`,
    // Generate
    generateObjectstorage:  `${DATA_MANAGER}/generate/objectstorage`,
    generateRdbms:          `${DATA_MANAGER}/generate/rdbms`,
    generateNrdbms:         `${DATA_MANAGER}/generate/nrdbms`,
    generateLinux:          `${DATA_MANAGER}/generate/linux`,
    // Migrate
    migrateObjectstorage:   `${DATA_MANAGER}/migrate/objectstorage`,
    migrateRdbms:           `${DATA_MANAGER}/migrate/rdbms`,
    migrateNrdbms:          `${DATA_MANAGER}/migrate/nrdbms`,
    // Backup
    backupObjectstorage:    `${DATA_MANAGER}/backup/objectstorage`,
    backupRdbms:            `${DATA_MANAGER}/backup/rdbms`,
    backupNrdbms:           `${DATA_MANAGER}/backup/nrdbms`,
    // Restore
    restoreObjectstorage:   `${DATA_MANAGER}/restore/objectstorage`,
    // Aliases (legacy names)
    objectStorageMigrate:   `${DATA_MANAGER}/migrate/objectstorage`,
    objectStorageBackup:    `${DATA_MANAGER}/backup/objectstorage`,
    objectStorageRestore:   `${DATA_MANAGER}/restore/objectstorage`,
    rdbmsMigrate:           `${DATA_MANAGER}/migrate/rdbms`,
    rdbmsBackup:            `${DATA_MANAGER}/backup/rdbms`,
    nordbmsMigrate:         `${DATA_MANAGER}/migrate/nrdbms`,
    nordbmsBackup:          `${DATA_MANAGER}/backup/nrdbms`,
  },

} as const;
