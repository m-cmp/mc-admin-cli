import jenkins.model.*
import hudson.model.*
import hudson.security.*

// 설치할 플러그인 목록
def pluginParameter = """
workflow-api
swarm
authorize-project
antisamy-markup-formatter
pipeline-github-lib
pipeline-rest-api
git
github-branch-source
gradle
pipeline-model-definition
pipeline-build-step
workflow-aggregator
matrix-project
email-ext
durable-task
checks-api
build-timeout
timestamper
ws-cleanup
ssh-slaves
ssh-agent
publish-over-ssh
"""

def plugins = pluginParameter.trim().split("\\s+")

def instance = Jenkins.getInstance()
def readinessMarker = new File(instance.getRootDir(), ".mcmp-init-complete")

if (readinessMarker.exists() && !readinessMarker.delete()) {
    throw new IllegalStateException("Failed to clear the Jenkins initialization marker")
}

// Configure the Jenkins user used by mc-workflow-manager for REST API calls.
def username = System.getenv("JENKINS_USERNAME")?.trim()
def password = System.getenv("JENKINS_PASSWORD")

if (!username) {
    throw new IllegalStateException("JENKINS_USERNAME must not be empty")
}
if (!password) {
    throw new IllegalStateException("JENKINS_PASSWORD must not be empty")
}

def securityRealm = instance.getSecurityRealm()
if (!(securityRealm instanceof HudsonPrivateSecurityRealm)) {
    securityRealm = new HudsonPrivateSecurityRealm(false)
    instance.setSecurityRealm(securityRealm)
}

def user = User.getById(username, false)
def userDetails = user?.getProperty(HudsonPrivateSecurityRealm.Details)
if (userDetails == null || !userDetails.isPasswordCorrect(password)) {
    securityRealm.createAccount(username, password)
    println "--> Jenkins administrator account created or updated: ${username}"
} else {
    println "--> Jenkins administrator account already configured: ${username}"
}

def authorizationStrategy = new FullControlOnceLoggedInAuthorizationStrategy()
authorizationStrategy.setAllowAnonymousRead(false)
instance.setAuthorizationStrategy(authorizationStrategy)
instance.save()

println "--> Jenkins security enabled; anonymous access disabled."

def pm = instance.getPluginManager()
def uc = instance.getUpdateCenter()

println "--> Checking Update Center..."
uc.updateAllSites()
sleep(10000) // UpdateCenter 초기화 대기 (10초)

println "--> Installing missing plugins..."
def needsRestart = false

plugins.each { pluginName ->
    if (!pm.getPlugin(pluginName)) {
        println "Installing plugin: ${pluginName}"
        def plugin = uc.getPlugin(pluginName)
        if (plugin) {
            def installFuture = plugin.deploy()
            installFuture.get() // 설치 완료까지 대기
            println "Installed plugin: ${pluginName}"
            needsRestart = true
        } else {
            println "Plugin ${pluginName} not found in update center."
        }
    } else {
        println "Plugin ${pluginName} already installed."
    }
}

println "--> Saving Jenkins state..."
instance.save()

if (needsRestart) {
    println "--> Plugins installed. Jenkins will restart now..."
    instance.safeRestart() // 안전하게 재시작
} else {
    def inactivePlugins = plugins.findAll { pluginName ->
        def installedPlugin = pm.getPlugin(pluginName)
        installedPlugin == null || !installedPlugin.isActive()
    }
    if (!inactivePlugins.isEmpty()) {
        throw new IllegalStateException("Required Jenkins plugins are not active: ${inactivePlugins.join(', ')}")
    }

    readinessMarker.text = "ready\n"
    println "--> All required plugins are active. Jenkins initialization is complete."
}
