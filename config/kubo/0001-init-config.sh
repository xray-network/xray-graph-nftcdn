#!/bin/sh
set -ex
ipfs config --json Datastore.StorageMax '"1000GB"'
ipfs config --json Datastore.GCPeriod '"30m"'
ipfs config --json Datastore.StorageGCWatermark '90'