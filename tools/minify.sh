#!/bin/sh
# Edit sources in tools/src/, then run this to write the minified files the site serves.
# Needs: npm i esbuild (in /tmp/mini or anywhere) and set E to its binary.
E=${E:-esbuild}
for p in "shop_app.js shop/app.js" "main.js main.js" "consent.js consent.js" "glass.js glass.js" "shop_app.css shop/app.css" "styles.css styles.css" "consent.css consent.css" "glass.css glass.css"; do set -- $p; $E tools/src/$1 --minify --target=es2018 --outfile=$2 --allow-overwrite --log-level=error; done
python3 tools/bump_home_versions.py
