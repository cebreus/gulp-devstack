#!/bin/sh

file="./TODO.md"
timeout=10

RED="\033[1;31m"
# YELLOW="\033[1;33m"
# GREEN="\033[1;32m"
# BLUE="\033[1;34m"
NOCOLOR="\033[0m"

function cleanup_file() {
  rm $file
}
function write_file() {
  ./node_modules/.bin/leasot -x -r markdown -A '.txt,coffeeParser' './**/*.{js,html,njk,scss,txt,md,yml}' -i './node_modules/**/*' >$file
}

function format_file() {
  node ./node_modules/remark-cli/cli -q $file
  prettier --write $file
}

function correct_file() {
  file_contents=$(<$file)
  echo "${file_contents//### TODOs/# TODOs}" >$file
}

# Write
# =============

write_file

# Format
# =============

while [ ! -f $file ]; do
  if [ "$timeout" == 0 ]; then
    printf "${RED}ERROR:${NOCOLOR} Timeout while waiting for CREATING the file ${file}"
    exit 1
  fi
  # Decrease the timeout of one
  ((timeout--))
done

file_date_original=$(stat -c %y "$file")

format_file

file_date_formatted=$(stat -c %y "$file")

# Correct file
# =============

while [ "$file_date_original" == "$file_date_formatted" ]; do
  if [ "$timeout" == 0 ]; then
    printf "${RED}ERROR:${NOCOLOR} Timeout while waiting for FORMATTING the file ${file}"
    exit 1
  fi
  # Decrease the timeout of one
  ((timeout--))
done

correct_file

file_date_corrected=$(stat -c %y "$file")

# Git add
# =============

while [ "$file_date_formatted" == "$file_date_corrected" ]; do
  if [ "$timeout" == 0 ]; then
    printf "${RED}ERROR:${NOCOLOR} Timeout while waiting for FORMATTING the file ${file}"
    exit 1
  fi
  # Decrease the timeout of one
  ((timeout--))
done

git add $file
