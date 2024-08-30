package k8s

var K8sFilePath string

const (
	// DefaultKubernetesConfig is a variable that holds path to helm-chart/values.yaml
	DefaultKubernetesConfig string = "../conf/helm-chart/values.yaml"

	// K8sNamespace is a variable that holds the K8s namespace that MC-ADMIN-CLI will use.
	K8sNamespace string = "mcc"

	// HelmReleaseName is a variable that holds the K8s Helm release name that MC-ADMIN-CLI will use.
	HelmReleaseName string = "mcc"
)
