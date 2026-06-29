/**
 * deploy/params/base/tc/data/connections.ts
 * mc-data-manager E2E — AWS / Alibaba 접속 프로필 (Tumblebug credential.temp 기준)
 *
 * NRDB:
 *   AWS     — Tumblebug 등록 credential 선택 후 Generate
 *   Alibaba — 등록 credential 선택 (host: dds-mj7e... / root / mcmp_test123)
 */
export const AWS_RDB = {
  provider:     'aws',
  host:         'mcmp-test.cteomeg827o8.ap-northeast-2.rds.amazonaws.com',
  port:         '3306',
  username:     'admin',
  password:     'mcmp_test',
  databaseName: 'LibraryManagement_0',
} as const;

export const ALIBABA_RDB = {
  provider:     'alibaba',
  host:         'rm-mj747t00m6294g84pvo.mysql.ap-northeast-2.rds.aliyuncs.com',
  port:         '3306',
  username:     'root',
  password:     'mcmp_test123',
  databaseName: 'MZ_LibraryManagement',
} as const;

/** AWS NoRDB — DynamoDB/Firestore: credential 드롭다운에서 Tumblebug 등록 credential 선택 */
export const AWS_NRDB = {
  mode:             'credential' as const,
  provider:         'aws',
  credentialFilter: ['dynamo', 'firestore', 'aws'],
  databaseName:     'e2e-nrdb-aws',
} as const;

/** Alibaba NoRDB — MongoDB: 등록 credential 선택 (직접 입력 fallback 값 포함) */
export const ALIBABA_NRDB = {
  mode:             'credential' as const,
  provider:         'alibaba',
  host:             'dds-mj7e851cdba37bb42822-pub.mongodb.ap-northeast-2.rds.aliyuncs.com',
  port:             '3717',
  username:         'root',
  password:         'mcmp_test123',
  credentialFilter: ['alibaba', 'mongo', 'dds-mj7', 'aliyun'],
  sourceDatabase:   'mcmp_test',
  targetDatabase:   'MZ_mcmp_test',
} as const;

export const DATA_MANAGER_DEFAULTS = {
  dataManagerBaseUrl: process.env.DATA_MANAGER_BASE_URL ?? 'https://15.164.139.37:3300',
  workspaceName:      'ws01',
  projectName:        'default',
};
