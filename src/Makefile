# Check Go version (minimum: 1.25.0)
check-go-version:
	@GO_VERSION=$$(go version | awk '{print $$3}' | sed 's/go//'); \
	REQUIRED_VERSION="1.25.0"; \
	if [ -z "$$GO_VERSION" ]; then \
		echo "Error: Go is not installed or not in PATH"; \
		exit 1; \
	fi; \
	COMPARE=$$(printf '%s\n%s\n' "$$REQUIRED_VERSION" "$$GO_VERSION" | sort -V | head -n1); \
	if [ "$$COMPARE" != "$$REQUIRED_VERSION" ]; then \
		echo "Error: Go version $$GO_VERSION is below required version $$REQUIRED_VERSION"; \
		echo "Please upgrade Go to version $$REQUIRED_VERSION or higher"; \
		exit 1; \
	fi; \
	echo "✓ Go version $$GO_VERSION meets requirement ($$REQUIRED_VERSION)"

default: check-go-version health-check-tool
	@go build -o ../bin/mcc
linux-arm: check-go-version
	@GOOS=linux GOARCH=arm go build -o ../bin/mcc
#windows 64bint
win: check-go-version
	@GOOS=windows GOARCH=amd64 go build -o ../bin/mcc.exe
#windows 32bit
win86: check-go-version
	@GOOS=windows GOARCH=386 go build -o ../bin/mcc.exe
mac: check-go-version
	@GOOS=darwin GOARCH=amd64 go build -o ../bin/mcc
mac-arm: check-go-version
	@GOOS=darwin GOARCH=arm64 go build -o ../bin/mcc
clean:
	@rm -v ../bin/mcc ../bin/mcc.exe
health-check-tool:
	@CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ../conf/docker/tool/mcc
