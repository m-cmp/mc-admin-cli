package k8s

const (
	// DefaultKubernetesConfig is a variable that holds path to helm-chart/values.yaml
	DefaultKubernetesConfig string = "../helm-chart/values.yaml"

	// K8sNamespace is a variable that holds the K8s namespace that CM-Mayfly will use.
	K8sNamespace string = "mcc"

	// HelmReleaseName is a variable that holds the K8s Helm release name that CM-Mayfly will use.
	HelmReleaseName string = "mcc"
)
