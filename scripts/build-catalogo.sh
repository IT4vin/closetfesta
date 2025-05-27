#!/bin/bash
set -e

# Build do catálogo
cd closet-festa-showcase
npm run build
cd ..

# Remove a pasta antiga do catálogo, se existir
rm -rf closetfesta/public/catalogo

# Copia o build novo
cp -r closet-festa-showcase/dist closetfesta/public/catalogo

echo "Catálogo copiado para closetfesta/public/catalogo com sucesso!" 