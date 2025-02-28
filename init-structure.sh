#!/bin/bash
# Script pro vytvoření výchozí adresářové struktury

# Vytvoření adresářů pro assety
mkdir -p src/assets/{fonts,icons,images}

# Vytvoření adresářů pro komponenty
mkdir -p src/components/{button,card,hero,header,footer,navigation,features-list,favicons}

# Vytvoření adresářů pro layouty a stránky
mkdir -p src/layouts
mkdir -p src/pages/{about,contact,components}

# Vytvoření adresářů pro partialy
mkdir -p src/partials

# Vytvoření adresářů pro styly
mkdir -p src/scss/{base,utilities,vendor}

# Vytvoření adresářů pro JavaScript
mkdir -p src/js/{modules,utils}

# Vytvoření adresářů pro templates
mkdir -p src/templates/{macros,helpers}

# Vytvoření adresářů pro obsah
mkdir -p content/{components,pages/about,pages/contact}

# Vytvoření souborů .gitkeep pro zachování adresářové struktury v git
find src -type d -empty -exec touch {}/.gitkeep \;
find content -type d -empty -exec touch {}/.gitkeep \;

echo "✅ Základní adresářová struktura vytvořena!"
