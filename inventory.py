#!/usr/bin/env python3

import argparse
import http.client
import os
import sys
import urllib.request

PINGPONG_SERVER = 'http://localhost:3000'

try:
    import json
except ImportError:
    import simplejson as json

class Inventory(object):
    def __init__(self):
        self.inventory = {}
        self.read_cli_args()

    @property
    def pingpong_server(self):
        global PINGPONG_SERVER
        return PINGPONG_SERVER

    def get_inventory(self):
        inventory =  {'_meta': {'hostvars': {}}}
        # called with `--list`
        if self.args.list:
            inventory = json.loads(urllib.request.urlopen(self.pingpong_server+'/device/inventory').read())
            hosts_set = set()
            for key, value in inventory.items():
                for host in (value['hosts'] if 'hosts' in value else []):
                    hosts_set.add(host)
            hostvars = {}
            for host in hosts_set:
                hostvars[host] = {}
            return {
                **inventory,
                '_meta': {
                    'hostvars': hostvars
                }
            }
        # called with `--host [hostname]`.
        elif self.args.host:
            # not implemented, since we return _meta info `--list`.
            return inventory
        return inventory

    def print_inventory(self):
        print(json.dumps(self.get_inventory(), indent=2))

    def read_cli_args(self):
        parser = argparse.ArgumentParser()
        parser.add_argument('--list', action = 'store_true')
        parser.add_argument('--host', action = 'store')
        self.args = parser.parse_args()

def main():
  inventory = Inventory()
  inventory.print_inventory()

main()
