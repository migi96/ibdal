#!/bin/bash
# Rebuilds index.html from parts/ + slides/*.html + css/slides/*.css
set -e
cd "$(dirname "$0")"

CSS_LINKS=""
for f in $(ls css/slides/*.css 2>/dev/null | sort); do
  CSS_LINKS+="<link rel=\"stylesheet\" href=\"$f\">\n"
done

{
  while IFS= read -r line; do
    if [[ "$line" == "<!--SLIDE_CSS-->" ]]; then
      printf "%b" "$CSS_LINKS"
    else
      printf "%s\n" "$line"
    fi
  done < parts/head.html

  for f in $(ls slides/*.html 2>/dev/null | sort); do
    n=$(basename "$f" .html)
    printf "<div class=\"slide-wrap\" data-slide=\"%s\">\n" "$n"
    cat "$f"
    printf "\n</div>\n"
  done

  if [[ -f parts/fx.html ]]; then
    while IFS= read -r line; do
      if [[ "$line" == "<!--FX_SCRIPTS-->" ]]; then
        cat parts/fx.html
      else
        printf "%s\n" "$line"
      fi
    done < parts/tail.html
  else
    cat parts/tail.html
  fi
} > index.html

echo "Built index.html with $(ls slides/*.html 2>/dev/null | wc -l | tr -d ' ') slides."
