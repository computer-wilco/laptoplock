#!/bin/bash

cd "SCRIPTS"

APP_NAME="laptoplock"
VERSION="1.0.0"
ARCH="amd64"
BUILD_DIR="build-deb"

rm -rf "$BUILD_DIR"
rm -rf pakket.deb
rm -rf "../INSTALL/${APP_NAME}_${VERSION}_${ARCH}.deb"
mkdir -p "$BUILD_DIR/DEBIAN"
mkdir -p "$BUILD_DIR/usr/bin"

cp "$(pwd)/laptoplock" "$BUILD_DIR/usr/bin/$APP_NAME"
chmod +x "$BUILD_DIR/usr/bin/$APP_NAME"

cat > "$BUILD_DIR/DEBIAN/control" <<EOF
Package: $APP_NAME
Version: $VERSION
Section: base
Priority: optional
Architecture: $ARCH
Maintainer: Wilco
Description: Laptoplock - vergrendel de laptop van uw kind - CLI
EOF

dpkg-deb --build "$BUILD_DIR" pakket.deb
rm -rf $BUILD_DIR
mv pakket.deb "../INSTALL/${APP_NAME}_${VERSION}_${ARCH}.deb"

cd ..
