default: health-check-tool
	@go build -o ../bin/mcc
linux-arm:
	@GOOS=linux GOARCH=arm go build -o ../bin/mcc
#windows 64bint
win:
	@GOOS=windows GOARCH=amd64 go build -o ../bin/mcc.exe
#windows 32bit
win86:
	@GOOS=windows GOARCH=386 go build -o ../bin/mcc.exe
mac:
	@GOOS=darwin GOARCH=amd64 go build -o ../bin/mcc
mac-arm:
	@GOOS=darwin GOARCH=arm64 go build -o ../bin/mcc
clean:
	@rm -v ../bin/mcc ../bin/mcc.exe
health-check-tool:
	@CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ../conf/docker/tool/mcc
