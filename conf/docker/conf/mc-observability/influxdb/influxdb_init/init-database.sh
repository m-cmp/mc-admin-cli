#!/bin/bash

PREFIX="influx -host 127.0.0.1 -port $INFLUXDB_INIT_PORT -username ${INFLUXDB_ADMIN_USER} -password ${INFLUXDB_ADMIN_PASSWORD} -execute"

# Quote the DB name: it contains a hyphen, which the InfluxQL parser rejects
# when unquoted (the image's INFLUXDB_DB env triggers an unquoted CREATE and fails).
$PREFIX 'CREATE DATABASE "mc-observability"'
$PREFIX "CREATE DATABASE insight"
$PREFIX "CREATE DATABASE downsampling"
