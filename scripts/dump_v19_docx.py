import re
import zipfile
from pathlib import Path

p = Path(__file__).resolve().parent.parent / "document" / "Rentfoxxy_Addendum_v1.9.docx"
with zipfile.ZipFile(p) as z:
    xml = z.read("word/document.xml").decode("utf-8")
text = re.sub(r"<w:p[^>]*>", "\n", xml)
text = re.sub(r"<[^>]+>", "", text)
text = (
    text.replace("&lt;", "<")
    .replace("&gt;", ">")
    .replace("&amp;", "&")
    .replace("&quot;", '"')
)
lines = [l.strip() for l in text.split("\n") if l.strip()]
out = Path(__file__).resolve().parent.parent / "document" / "_v19_extracted.txt"
out.write_text("\n".join(f"{i}: {l}" for i, l in enumerate(lines)), encoding="utf-8")
print(f"Wrote {len(lines)} lines to {out}")
