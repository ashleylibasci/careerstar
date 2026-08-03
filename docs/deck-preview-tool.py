"""Faithful HTML preview of a .pptx for visual QA.

Reads each slide's real XML — shape geometry, fills, text runs, sizes, bold,
alignment, insets — and emits absolutely-positioned HTML at 100px/inch. The
browser then does the text layout with real Arial metrics, so anything that
overflows its shape is visible exactly as PowerPoint would show it.
"""
import base64
import html
import re
import sys
import zipfile
from defusedxml import ElementTree as ET

A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
P = "{http://schemas.openxmlformats.org/presentationml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
EMU = 914400.0
PX = 100.0  # px per inch


def rels_for(z, part):
    name = part.rsplit("/", 1)
    rel = f"{name[0]}/_rels/{name[1]}.rels"
    out = {}
    if rel in z.namelist():
        for r in ET.fromstring(z.read(rel)):
            out[r.get("Id")] = r.get("Target")
    return out


def solid_fill(node):
    if node is None:
        return None
    sf = node.find(f"{A}solidFill/{A}srgbClr")
    if sf is not None:
        return "#" + sf.get("val")
    if node.find(f"{A}noFill") is not None:
        return None
    return None


def emit_shape(sp, z, part, out):
    xfrm = sp.find(f".//{A}xfrm")
    if xfrm is None:
        return
    off, ext = xfrm.find(f"{A}off"), xfrm.find(f"{A}ext")
    if off is None or ext is None:
        return
    x, y = int(off.get("x")) / EMU * PX, int(off.get("y")) / EMU * PX
    w, h = int(ext.get("cx")) / EMU * PX, int(ext.get("cy")) / EMU * PX

    spPr = sp.find(f"{P}spPr")
    fill = solid_fill(spPr)
    ln = spPr.find(f"{A}ln") if spPr is not None else None
    border = ""
    if ln is not None:
        lc = ln.find(f"{A}solidFill/{A}srgbClr")
        if lc is not None:
            border = f"border:1px solid #{lc.get('val')};"
    prst = spPr.find(f"{A}prstGeom") if spPr is not None else None
    radius = "border-radius:9px;" if prst is not None and prst.get("prst") == "roundRect" else ""

    tx = sp.find(f"{P}txBody")
    body = ""
    pad_l = pad_t = 0.0
    valign = "flex-start"
    if tx is not None:
        bp = tx.find(f"{A}bodyPr")
        if bp is not None:
            pad_l = int(bp.get("lIns", 91440)) / EMU * PX
            pad_t = int(bp.get("tIns", 45720)) / EMU * PX
            anchor = bp.get("anchor", "t")
            valign = {"ctr": "center", "b": "flex-end"}.get(anchor, "flex-start")
        for p in tx.findall(f"{A}p"):
            pPr = p.find(f"{A}pPr")
            align = (pPr.get("algn") if pPr is not None else None) or "l"
            css_align = {"ctr": "center", "r": "right"}.get(align, "left")
            spans = []
            for r in p.findall(f"{A}r"):
                rPr = r.find(f"{A}rPr")
                t = r.find(f"{A}t")
                if t is None:
                    continue
                sz = int(rPr.get("sz", "1400")) / 100 if rPr is not None else 14
                bold = rPr is not None and rPr.get("b") == "1"
                ital = rPr is not None and rPr.get("i") == "1"
                col = "#E8EEFC"
                if rPr is not None:
                    c = rPr.find(f"{A}solidFill/{A}srgbClr")
                    if c is not None:
                        col = "#" + c.get("val")
                face = "Arial"
                if rPr is not None:
                    lf = rPr.find(f"{A}latin")
                    if lf is not None and "Courier" in (lf.get("typeface") or ""):
                        face = "Courier New"
                spc = ""
                if rPr is not None and rPr.get("spc"):
                    spc = f"letter-spacing:{int(rPr.get('spc'))/100:.2f}pt;"
                spans.append(
                    f'<span style="font:{"italic " if ital else ""}{"bold " if bold else ""}'
                    f'{sz}pt/1.21 \'{face}\',Arial,sans-serif;color:{col};{spc}">'
                    f"{html.escape(t.text or '')}</span>"
                )
            body += f'<div style="text-align:{css_align};margin:0;">{"".join(spans) or "&nbsp;"}</div>'

    out.append(
        f'<div style="position:absolute;left:{x:.1f}px;top:{y:.1f}px;width:{w:.1f}px;height:{h:.1f}px;'
        f'{f"background:{fill};" if fill else ""}{border}{radius}'
        f'display:flex;flex-direction:column;justify-content:{valign};'
        f'padding:{pad_t:.1f}px {pad_l:.1f}px;box-sizing:border-box;overflow:visible;">{body}</div>'
    )


def emit_pic(pic, z, part, out):
    xfrm = pic.find(f".//{A}xfrm")
    blip = pic.find(f".//{A}blip")
    if xfrm is None or blip is None:
        return
    off, ext = xfrm.find(f"{A}off"), xfrm.find(f"{A}ext")
    x, y = int(off.get("x")) / EMU * PX, int(off.get("y")) / EMU * PX
    w, h = int(ext.get("cx")) / EMU * PX, int(ext.get("cy")) / EMU * PX
    rid = blip.get(f"{R}embed")
    target = rels_for(z, part).get(rid, "")
    path = "ppt/" + target.replace("../", "")
    try:
        data = base64.b64encode(z.read(path)).decode()
    except KeyError:
        return
    out.append(
        f'<img src="data:image/png;base64,{data}" style="position:absolute;left:{x:.1f}px;'
        f'top:{y:.1f}px;width:{w:.1f}px;height:{h:.1f}px;">'
    )


def slide_html(z, part, master_bg):
    root = ET.fromstring(z.read(part))
    out = []
    if master_bg:
        out.append(
            f'<img src="data:image/png;base64,{master_bg}" style="position:absolute;left:0;top:0;'
            f'width:{13.333*PX:.0f}px;height:{7.5*PX:.0f}px;">'
        )
    tree = root.find(f"{P}cSld/{P}spTree")
    for node in tree:
        if node.tag == f"{P}sp":
            emit_shape(node, z, part, out)
        elif node.tag == f"{P}pic":
            emit_pic(node, z, part, out)
    return "".join(out)


def master_background(z, part):
    """Background image of the layout/master chain for this slide."""
    for rel_part, rels in [(part, rels_for(z, part))]:
        for rid, target in rels.items():
            if "slideLayout" in target:
                lay = "ppt/" + target.replace("../", "")
                for lid, ltarget in rels_for(z, lay).items():
                    if "slideMaster" in ltarget:
                        mas = "ppt/" + ltarget.replace("../", "")
                        mroot = ET.fromstring(z.read(mas))
                        blip = mroot.find(f".//{P}bg//{A}blip")
                        if blip is not None:
                            mrid = blip.get(f"{R}embed")
                            mt = rels_for(z, mas).get(mrid, "")
                            try:
                                return base64.b64encode(
                                    z.read("ppt/" + mt.replace("../", ""))
                                ).decode()
                            except KeyError:
                                return None
    return None


def main(pptx, outdir):
    z = zipfile.ZipFile(pptx)
    slides = sorted(
        [n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)],
        key=lambda n: int(re.search(r"\d+", n).group()),
    )
    for i, sl in enumerate(slides, 1):
        bg = master_background(z, sl)
        doc = (
            "<html><head><meta charset='utf-8'><style>"
            "html,body{margin:0;padding:0;background:#070D24;overflow:hidden}"
            f".slide{{position:relative;width:{13.333*PX:.0f}px;height:{7.5*PX:.0f}px;"
            "background:#070D24;overflow:hidden;}"
            "</style></head><body>"
            f"<div class='slide'>{slide_html(z, sl, bg)}</div>"
            "</body></html>"
        )
        open(f"{outdir}/slide{i:02d}.html", "w").write(doc)
    print(f"wrote {len(slides)} slide files")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
