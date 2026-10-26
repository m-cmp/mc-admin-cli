#!/usr/bin/env python3
"""Ask for Nexus EULA consent without changing platform services or configuration."""

import argparse
import base64
import http.client
import ipaddress
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys
import time
import urllib.error
import urllib.request


SERVICE = "mc-application-manager-sonatype-nexus"
EULA_PATH = "/service/rest/v1/system/eula"
EULA_TERMS = "https://links.sonatype.com/products/nxrm/ce-eula"
WAIT_SECONDS = 120
REQUEST_TIMEOUT = 10
POLL_INTERVAL = 3


class SetupError(Exception):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    # Never forward administrator credentials to a redirect destination.
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def resolve_nexus(compose_file, env_file):
    """Let Compose resolve .env quoting/interpolation instead of sourcing shell code."""
    command = [
        "docker", "compose", "--project-directory", str(compose_file.parent),
        "--env-file", str(env_file), "-f", str(compose_file),
        "config", "--format", "json", SERVICE,
    ]
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=20)
    except (OSError, subprocess.TimeoutExpired) as error:
        raise SetupError("Could not read the Nexus Compose configuration.") from error
    if result.returncode:
        # Compose output can contain environment values; do not print it.
        raise SetupError("Could not resolve Compose configuration. Check Docker Compose and .env files.")
    try:
        service = json.loads(result.stdout)["services"][SERVICE]
        ports = service.get("ports", [])
        port = next(item for item in ports if str(item.get("target")) == "8081"
                    and item.get("protocol", "tcp") == "tcp")
        published = int(port["published"])
        if not 1 <= published <= 65535:
            raise ValueError("Invalid port")
        host = port.get("host_ip") or "127.0.0.1"
        host = {"0.0.0.0": "127.0.0.1", "::": "::1"}.get(host, host)
        address = ipaddress.ip_address(host)
        if address.version == 6:
            host = "[{}]".format(host)
        environment = service.get("environment", {})
        password = os.environ.get("NEXUS_EULA_PASSWORD")
        if password is None:
            initial_password = environment.get("NEXUS_SECURITY_INITIAL_PASSWORD")
            # `compose config` doubles dollar signs, including in its JSON output,
            # so the rendered model can be parsed again without interpolation.
            password = initial_password.replace("$$", "$") if isinstance(initial_password, str) else None
        username = os.environ.get("NEXUS_EULA_USERNAME", "admin")
        if not isinstance(password, str) or not password or not username or ":" in username:
            raise ValueError("Missing administrator credentials")
    except (KeyError, TypeError, ValueError, AttributeError, StopIteration) as error:
        raise SetupError("Nexus needs a published 8081 management port and administrator credentials.") from error
    return "http://{}:{}".format(host, published), username, password


class NexusAPI:
    def __init__(self, url, username, password):
        self.url = url + EULA_PATH
        credentials = (username + ":" + password).encode("utf-8")
        self.authorization = "Basic " + base64.b64encode(credentials).decode("ascii")
        # This is a local management request. Ignore proxy environment variables.
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())

    def request(self, timeout, payload=None):
        headers = {"Authorization": self.authorization, "Accept": "application/json"}
        data = None
        if payload is not None:
            data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"
        request = urllib.request.Request(self.url, headers=headers, data=data)
        try:
            with self.opener.open(request, timeout=timeout) as response:
                body = response.read(1024 * 1024 + 1)
                if len(body) > 1024 * 1024:
                    raise SetupError("Nexus returned an unexpectedly large EULA response.")
                return response.status, body
        except urllib.error.HTTPError as error:
            status = error.code
            error.close()
            return status, b""
        except (OSError, urllib.error.URLError, http.client.HTTPException):
            return 0, b""


def parse_agreement(body):
    try:
        agreement = json.loads(body)
        if not isinstance(agreement, dict) or type(agreement.get("accepted")) is not bool:
            raise ValueError("Missing boolean accepted")
        if not agreement["accepted"]:
            disclaimer = agreement.get("disclaimer")
            if not isinstance(disclaimer, str) or not disclaimer.strip():
                raise ValueError("Missing disclaimer")
        return agreement
    except (ValueError, UnicodeError) as error:
        raise SetupError("Nexus returned an invalid EULA response; agreement status could not be determined.") from error


def get_agreement(api, wait_seconds, request_timeout, poll_interval):
    deadline = time.monotonic() + wait_seconds
    waiting = False
    while True:
        remaining = deadline - time.monotonic()
        status, body = api.request(min(request_timeout, max(0.1, remaining)))
        if status == 200:
            return parse_agreement(body)
        if status in (401, 403):
            raise SetupError("Nexus administrator authentication/permission failed (HTTP {}). "
                             "Check NEXUS_EULA_USERNAME / NEXUS_EULA_PASSWORD.".format(status))
        if status == 404:
            raise SetupError("The Nexus EULA API was not found (HTTP 404); agreement status is unknown.")
        if status not in (0, 502, 503, 504):
            raise SetupError("Could not read Nexus EULA status (HTTP {}).".format(status))
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise SetupError("Nexus did not become ready before the EULA check timed out.")
        if not waiting:
            print("[WAIT] Waiting up to {:g}s for the Nexus EULA API...".format(wait_seconds), flush=True)
            waiting = True
        time.sleep(min(poll_interval, remaining))


def show_recovery(url=None, compose_file=None, env_file=None):
    print("[WARN] Other platform services remain running and unchanged.")
    print("       Nexus uploads/downloads require EULA approval if it has not been accepted.")
    print("       To review/accept later, rerun this command (no platform reinstall is needed):")
    script = Path(__file__).resolve()
    command = ["python3", str(script)]
    if compose_file and compose_file != script.parent.parent / "conf/docker/docker-compose.yaml":
        command.extend(["--compose-file", str(compose_file)])
    if env_file and compose_file and env_file != compose_file.parent / ".env":
        command.extend(["--env-file", str(env_file)])
    print("       " + " ".join(shlex.quote(value) for value in command))
    if url:
        print("       Or sign in to the Nexus administrator UI: {}".format(url))
    print("       See README: Step 6-1. Nexus Community Edition EULA.")


def configure(api, wait_seconds, request_timeout, poll_interval):
    agreement = get_agreement(api, wait_seconds, request_timeout, poll_interval)
    if agreement["accepted"]:
        print("[SKIP] Nexus EULA is already accepted. No question or approval request is needed.")
        return True

    print("[INFO] Nexus EULA has not been accepted.")
    if not sys.stdin.isatty():
        print("[WARN] Interactive input is unavailable. No automatic consent will be given.")
        return False

    print("\nSonatype Nexus Repository Community Edition EULA")
    print(EULA_TERMS)
    # Keep the POST's disclaimer exact; only sanitize its terminal display.
    print("".join(char for char in agreement["disclaimer"] if char.isprintable() or char in "\n\t"))
    print("\nRead the EULA before answering. Only y/yes gives consent.")
    print("Declining does not stop other services; Nexus uploads/downloads remain restricted.")
    while True:
        try:
            answer = input("Do you agree to the Nexus Community Edition EULA? [y/N]: ").strip().lower()
        except EOFError:
            answer = ""
        if answer in ("", "n", "no"):
            print("[SKIP] EULA was not accepted. No approval request was sent.")
            return False
        if answer in ("y", "yes"):
            break
        print("Please enter y or n. Pressing Enter means N.")

    status, _ = api.request(request_timeout, {
        "disclaimer": agreement["disclaimer"], "accepted": True,
    })
    if not 200 <= status < 300:
        code = "HTTP {}".format(status) if status else "connection/timeout error"
        raise SetupError("EULA approval could not be confirmed ({}). Check Nexus status before retrying.".format(code))
    status, body = api.request(request_timeout)
    if status != 200:
        raise SetupError("Approval request succeeded, but the final EULA status could not be verified.")
    if not parse_agreement(body)["accepted"]:
        raise SetupError("Approval request succeeded, but Nexus still reports accepted: false.")
    print("[OK] Nexus EULA accepted and verified (accepted: true).")
    return True


def main(argv=None):
    root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--compose-file", type=Path, default=root / "conf/docker/docker-compose.yaml")
    parser.add_argument("--env-file", type=Path, help="defaults to .env beside the Compose file")
    args = parser.parse_args(argv)
    compose_file = args.compose_file.resolve()
    env_file = args.env_file.resolve() if args.env_file else compose_file.parent / ".env"
    url = None
    try:
        print("\n[INFO] Checking Nexus Community Edition EULA status...", flush=True)
        url, username, password = resolve_nexus(compose_file, env_file)
        accepted = configure(NexusAPI(url, username, password), WAIT_SECONDS,
                             REQUEST_TIMEOUT, POLL_INTERVAL)
        if not accepted:
            show_recovery(url, compose_file, env_file)
        # A user's No (including no terminal/EOF) is not an installation failure.
        return 0
    except SetupError as error:
        print("[WARN] {}".format(error))
        show_recovery(url, compose_file, env_file)
        return 1
    except KeyboardInterrupt:
        print("\n[WARN] EULA setup interrupted. Verify Nexus status before retrying.")
        show_recovery(url, compose_file, env_file)
        return 130


if __name__ == "__main__":
    sys.exit(main())
