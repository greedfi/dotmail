#!/bin/sh
# Keep the hosted viewer (docs/) in sync with the root template: run after editing template.html or gen.py demo data.
set -e; cd "$(dirname "$0")"
cp template.html docs/template.html
python3 gen.py --out docs/demo.html --settings /nonexistent-settings.json >/dev/null
echo "docs/ synced"
