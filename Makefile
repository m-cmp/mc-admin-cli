.PHONY: default
default:
	@cd src && $(MAKE) default

.PHONY: linux-arm
linux-arm:
	@cd src && $(MAKE) linux-arm

#windows 64bint
.PHONY: win
win:
	@cd src && $(MAKE) win

#windows 32bit
.PHONY: win86
win86:
	@cd src && $(MAKE) win86

.PHONY: mac
mac:
	@cd src && $(MAKE) mac

.PHONY: mac-arm
mac-arm:
	@cd src && $(MAKE) mac-arm

.PHONY: clean
clean:
	@cd src && $(MAKE) clean