# Gaegu 서브셋 다시 만들기

`src/assets/fonts/gaegu-ui-700.woff2` 는 Gaegu Bold(SIL OFL, `src/assets/fonts/OFL-Gaegu.txt`)에서
이 앱의 고정 문구에 쓰이는 글자만 추린 것이다(전체 한글은 1.8MB, 서브셋은 약 75KB).
`hand` 유틸리티를 새 문구에 쓰거나 기존 문구를 고쳐 글자가 늘었으면 다시 추린다.

```sh
pip install fonttools brotli
curl -sSLo /tmp/Gaegu-Bold.ttf https://raw.githubusercontent.com/google/fonts/main/ofl/gaegu/Gaegu-Bold.ttf

# 1) 고정 문구의 한글을 모은다 — 컴포넌트·App·labels·theme·dialIn·grinders 의 모든 한글 음절
python3 - <<'EOF'
import re, glob
chars = set()
for f in glob.glob('src/components/*.tsx') + ['src/App.tsx', 'src/lib/labels.ts', 'src/lib/theme.ts', 'src/lib/dialIn.ts', 'src/lib/grinders.ts']:
    chars.update(re.findall(r'[가-힣]', open(f, encoding='utf8').read()))
open('/tmp/hangul.txt', 'w', encoding='utf8').write(''.join(sorted(chars)))
print(len(chars), '자')
EOF

# 2) 라틴·구두점을 더해 woff2 로
python3 -m fontTools.subset /tmp/Gaegu-Bold.ttf --text-file=/tmp/hangul.txt \
  --unicodes="U+0020-007E,U+00B7,U+2013-2014,U+2018-2019,U+201C-201D,U+2022,U+2026,U+2103" \
  --flavor=woff2 --layout-features='' --no-hinting --desubroutinize --drop-tables+=DSIG \
  --output-file=src/assets/fonts/gaegu-ui-700.woff2
```

사용자 입력(레시피 제목, 메모, 원두 이름)에는 `hand` 를 쓰지 않는다 — 서브셋에 없는 글자가 고딕으로 떨어진다.
