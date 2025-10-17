import jenkins.model.*
import hudson.model.*
import jenkins.install.*
import hudson.PluginWrapper

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

def plugins = pluginParameter.split("\\s+")

def instance = Jenkins.getInstance()
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
    println "--> All plugins are already installed. No restart needed."
}

