#!/bin/zsh
# Matched screenshots of every concept with native WebKit (tools/wkshot).
# Usage: tools/shoot-wk.sh [01-journal-spine ...]
set -u
cd "${0:A:h}/.."
root="$PWD/mockups"
out="$root/screenshots"
mkdir -p "$out"
concepts=("$@")
(( ${#concepts} )) || concepts=(${(f)"$(cd $root && ls -d [0-9][0-9]*-* )"})

enc_entry='%5Bdata-olf-entry%3D%222020%3Ah-red-tobacco%22%5D'
enc_owner='%5Bdata-olf-entry%3D%222019%3Ah-syn-nocturne%22%5D'
enc_year='%5Bdata-olf-year%3D%222019%22%5D'
typeset -A states
states=(
  history "view=history&year=2020&entry=h-red-tobacco&scrollTo=$enc_entry"
  try     "view=try&group=w-tuxedo"
  owner   "mode=owner&year=2019&entry=h-syn-nocturne&scrollTo=$enc_owner"
  redacted "year=2019&scrollTo=$enc_year"
)

for c in $concepts; do
  n=${c%%-*}
  for s in ${=STATES:-history try owner redacted}; do
    for vp in desktop mobile; do
      if [[ $vp == desktop ]]; then w=1440; h=1000; else w=390; h=844; fi
      res=$(tools/wkshot "file://$root/$c/index.html?${states[$s]}" $w $h "$out/$n-$s-$vp.png" 2>&1)
      sw=${${res#*scrollWidth=}%% *}; cw=${${res#*clientWidth=}%% *}
      flag=""; [[ "$sw" == "$cw" ]] || flag="  OVERFLOW"
      echo "$n $s $vp  sw=$sw cw=$cw$flag"
    done
  done
done
