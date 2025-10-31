# Go Minimum Version Update to 1.25.0 - Release Notes

## Overview
This release updates the minimum required Go version from 1.23 to 1.25.0 and adds automated version checking to the build process.

---

## 🔧 Changes

### Go Version Requirement Update
**Breaking Change:** The minimum required Go version has been updated from **1.23** to **1.25.0**.

#### Updated Files:
- **`go.mod`**: Updated `go` directive from `1.23` to `1.25.0`
  - This ensures Go module system enforces the minimum version requirement
  - Builds will fail if Go version is below 1.25.0

- **`README.md`**: Updated documentation to reflect new minimum version
  - Changed from: `Go 1.23`
  - Changed to: `Go 1.25.0 (minimum required version)`

### Build System Enhancements

#### New Feature: Automated Go Version Checking
Added automated version checking to prevent builds with unsupported Go versions.

**Added Files:**
- **`Makefile`** (root): Added `check-go-version` target that delegates to `src/Makefile`
- **`src/Makefile`**: Added `check-go-version` target with version validation logic

**Implementation Details:**
- `check-go-version` target verifies that the installed Go version meets the minimum requirement (1.25.0)
- All build targets (`default`, `linux-arm`, `win`, `win86`, `mac`, `mac-arm`) now depend on `check-go-version`
- Version check runs automatically before any build operation
- Provides clear error messages if version requirements are not met

**Usage:**
```bash
# Check Go version manually
make check-go-version

# Build (automatically checks version first)
make

# Platform-specific builds (automatically checks version)
make linux-arm
make win
make mac
make mac-arm
```

---

## 📋 Migration Guide

### For Users

**Before upgrading, ensure you have Go 1.25.0 or higher installed:**

```bash
# Check your current Go version
go version

# If version is below 1.25.0, upgrade Go
# Visit https://go.dev/dl/ for download instructions
```

### For Contributors

1. **Upgrade Go to 1.25.0+**
   ```bash
   # Verify installation
   go version
   # Should show: go version go1.25.0 ... or higher
   ```

2. **Update Go modules**
   ```bash
   cd mc-admin-cli
   go mod tidy
   ```

3. **Test the build**
   ```bash
   # Test version check
   make check-go-version
   
   # Test build
   make
   ```

---

## ⚠️ Breaking Changes

- **Go 1.23 is no longer supported**
  - Projects using Go 1.23 or lower will fail to build
  - Error message will clearly indicate the version requirement

---

## ✅ Verification

After updating, verify the changes:

```bash
# 1. Verify go.mod
cat go.mod | grep "^go "

# Expected output:
# go 1.25.0

# 2. Test version check
make check-go-version

# Expected output:
# ✓ Go version 1.25.0 meets requirement (1.25.0)

# 3. Test build
make

# Should complete successfully if Go 1.25.0+ is installed
```

---

## 📝 Technical Details

### Version Check Implementation

The `check-go-version` target uses shell commands to:
1. Extract Go version from `go version` output
2. Compare version strings using semantic versioning
3. Fail with clear error message if version is below 1.25.0

**Example Error Message:**
```
Error: Go version 1.23.5 is below required version 1.25.0
Please upgrade Go to version 1.25.0 or higher
```

### Build Target Dependencies

All build targets now include `check-go-version` as a dependency:
- Ensures version check runs before any build
- Prevents silent failures due to version mismatches
- Provides early feedback to developers

---

## 🔗 Related Changes

### Modified Files Summary

1. **`go.mod`**
   - Line 3: `go 1.23` → `go 1.25.0`

2. **`README.md`**
   - Line 23: Updated Development & Test Environment section
   - Changed: `Go 1.23` → `Go 1.25.0 (minimum required version)`

3. **`Makefile`** (root)
   - Added: `check-go-version` target (delegates to src/Makefile)

4. **`src/Makefile`**
   - Added: `check-go-version` target with validation logic
   - Updated: All build targets to depend on `check-go-version`

---


## 📚 References

- [Go Release Notes](https://go.dev/doc/go1.25)
- [Go Download Page](https://go.dev/dl/)
- [Go Modules Documentation](https://go.dev/ref/mod)

---

**Release Date:** 2025-10-31  
**Maintainer:** M-CMP Development Team  
**Type:** Breaking Change - Go Version Requirement Update

