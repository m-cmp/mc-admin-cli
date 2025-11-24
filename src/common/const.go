package common

// API Call
const (
	API_FILE  = "../conf/api.yaml"
	SWAG_FILE = "../conf/swagger.json"
)

// Docker
const (
	DefaultDockerComposeConfig = "../conf/docker/docker-compose.yaml"

	// ComposeProjectName is a variable that holds the default COMPOSE_PROJECT_NAME that mcc will use.
	ComposeProjectName string = "mcc"
)

// k8s
const (
	DefaultKubernetesConfig string = "../conf/k8s/cloud-migrator/values.yaml"

	// CMK8sNamespace is a variable that holds the K8s namespace that mcc will use.
	CMK8sNamespace string = "mcc"

	// CMHelmReleaseName is a variable that holds the K8s Helm release name that mcc will use.
	CMHelmReleaseName string = "mcc"
)
