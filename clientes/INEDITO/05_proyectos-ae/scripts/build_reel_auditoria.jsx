/*
  INEDITO | REEL AUDITORIA DIGITAL 9x16  (v1)
  Construye el reel completo en el proyecto abierto: fondo, 6 escenas, pantallas de dashboard,
  tarjetas, logo y transiciones. Las laptops son PLACEHOLDERS vectoriales hasta que lleguen los
  clips de Flow (se reemplazan luego por el clip con key + corner pin de la pantalla).

  Re-ejecutable: borra lo que creó antes (carpeta "INEDITO REEL") y lo vuelve a crear.
  ExtendScript ES3.
*/
(function BUILD_INEDITO_AUDITORIA() {
    var FPS = 24, W = 1080, H = 1920;
    var _AQUI = File($.fileName).parent; // .../clientes/INEDITO/05_proyectos-ae/scripts
    var ROOT = _AQUI.parent.parent.fsName.replace(/\\/g, "/") + "/";
    var RAIZ = _AQUI.parent.parent.parent.parent.fsName.replace(/\\/g, "/") + "/";
    var LOGO_FILE = ROOT + "03_assets/logos/inedito-negro_2400.png";
    var AURA = true;
    // seguimiento de pantallas (esquinas por tiempo del clip): la laptop en angulo sigue girando despacio
    try { $.evalFile(new File(ROOT + "05_proyectos-ae/scripts/track_pantallas.jsx")); } catch (eT) {}
    var TRK = (typeof TRACK != "undefined") ? TRACK : null;   // capa de aura mistica (brillos, rayos, particulas)
    // clips de Flow (medidos con analisis de frames): verde de fondo, esquinas de pantalla (TL,TR,BR,BL), caja del objeto, segundo en que queda quieto
    var CLIPS = {
        lap34: { file: ROOT + "04_clips/generados-ia/plano01_laptop-34_v1.mp4", key: [40, 165, 66], quad: [[94, 811], [677, 832], [701, 1277], [108, 1324]], box: [80, 802, 1017, 1445], settle: 2.95, srcIn: 1.25, bezel: [0.024, 0.042, 0.032] },
        lapFr: { file: ROOT + "04_clips/generados-ia/plano02_laptop-frontal_v1.mp4", key: [22, 201, 43], quad: [[195, 669], [881, 670], [887, 1131], [189, 1131]], box: [84, 662, 991, 1281], settle: 3.2, srcIn: 1.4, bezel: [0.02, 0.036, 0.038] },
        lupa: { file: ROOT + "04_clips/generados-ia/plano03_lupa-violeta_v1.mp4", key: [25, 180, 46], ring: [495, 795], ringD: 480 }
    };

    // ---------- paleta / fuentes
    var C = {
        bg: [0.894, 0.898, 0.918], white: [1, 1, 1], ink: [0.067, 0.063, 0.098],
        violet: [0.404, 0.110, 0.859], violetL: [0.545, 0.298, 0.941], violetD: [0.302, 0.098, 0.698],
        gray: [0.851, 0.859, 0.890], grayT: [0.45, 0.45, 0.52], panel: [0.918, 0.910, 0.965], silver: [0.80, 0.81, 0.85], lid: [0.15, 0.15, 0.19]
    };
    var F = { H: "HansonBold", B: "Gilroy-ExtraBold", SB: "Gilroy-SemiBold", M: "Gilroy-Medium", BD: "Gilroy-Bold" };

    // ---------- escenas (tiempos en el reel)
    var SC = [
        { key: "HOOK", t: 0.0, d: 2.5 },
        { key: "S1_CONECTA", t: 2.5, d: 3.5 },
        { key: "S2_DETECTA", t: 6.0, d: 3.5 },
        { key: "S3_PRIORIZA", t: 9.5, d: 3.5 },
        { key: "S4_CONVIERTE", t: 13.0, d: 3.5 },
        { key: "CTA", t: 16.5, d: 3.5 }
    ];
    var TOTAL = 20.0;

    // ---------- utilidades
    function findItem(name) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it.name == name) return it; } return null; }
    var old = findItem("INEDITO REEL");
    if (old) { // borrar todo lo de la carpeta (comps y subcarpetas)
        for (var i = app.project.numItems; i >= 1; i--) { var it = app.project.item(i); if (it.parentFolder == old && it instanceof CompItem) it.remove(); }
        for (var j = app.project.numItems; j >= 1; j--) { var it2 = app.project.item(j); if (it2.parentFolder == old) it2.remove(); }
        old.remove();
    }
    var FOLDER = app.project.items.addFolder("INEDITO REEL");
    var FS = app.project.items.addFolder("PANTALLAS"); FS.parentFolder = FOLDER;
    var FA = app.project.items.addFolder("ASSETS"); FA.parentFolder = FOLDER;

    function comp(name, w, h, d, folder) { var c = app.project.items.addComp(name, w, h, 1, d, FPS); c.parentFolder = folder || FOLDER; c.bgColor = C.bg; return c; }
    function TR(L, n) { return L.property("ADBE Transform Group").property(n); }
    function easeAll(prop, idx, infl) {
        var d = prop.isSpatial ? 1 : (prop.value instanceof Array ? prop.value.length : 1);
        var e = []; for (var q = 0; q < d; q++) e.push(new KeyframeEase(0, infl));
        try { prop.setTemporalEaseAtKey(idx, e, e); } catch (er) {}
    }
    function K(prop, list, infl) { // list = [[t, v], ...]
        for (var k = 0; k < list.length; k++) { var idx = prop.addKey(list[k][0]); prop.setValueAtKey(idx, list[k][1]); easeAll(prop, idx, infl || 75); }
    }
    function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }

    // ---------- texto
    function txt(c, name, str, font, size, color, just, pos, maxW) {
        var L = c.layers.addText(str); L.name = name;
        var sp = L.property("ADBE Text Properties").property("ADBE Text Document");
        var td = sp.value; td.resetCharStyle(); td.font = font; td.fontSize = size; td.fillColor = color;
        td.applyFill = true; td.applyStroke = false; td.tracking = 0;
        td.justification = (just == "c") ? ParagraphJustification.CENTER_JUSTIFY : (just == "r" ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.LEFT_JUSTIFY);
        sp.setValue(td);
        if (maxW) { var r = L.sourceRectAtTime(0, false); if (r.width > maxW) { td = sp.value; td.fontSize = size * maxW / r.width; sp.setValue(td); } }
        TR(L, "ADBE Position").setValue(pos);
        L.motionBlur = true;
        return L;
    }
    function textW(L) { return L.sourceRectAtTime(0, false).width; }
    function rise(L, t0, dy) { // revelado: sube con leve overshoot
        var P = TR(L, "ADBE Position"), p = P.value; dy = dy || 60;
        K(P, [[t0, [p[0], p[1] + dy]], [t0 + 0.32, [p[0], p[1] - 6]], [t0 + 0.48, p]], 70);
        K(TR(L, "ADBE Opacity"), [[t0, 0], [t0 + 0.18, 100]], 60);
    }
    function pop(L, t0, base) { // 70 -> 104 -> 100
        base = base || 100;
        K(TR(L, "ADBE Scale"), [[t0, [base * 0.7, base * 0.7]], [t0 + 0.26, [base * 1.04, base * 1.04]], [t0 + 0.42, [base, base]]], 70);
        K(TR(L, "ADBE Opacity"), [[t0, 0], [t0 + 0.12, 100]], 60);
    }
    function counter(L, prefix, target, suffix, t0, t1) {
        L.property("ADBE Text Properties").property("ADBE Text Document").expression =
            "var p = Math.min(Math.max((time - " + t0 + ") / " + (t1 - t0) + ", 0), 1); p = 1 - Math.pow(1 - p, 3); '" + prefix + "' + Math.round(" + target + " * p) + '" + suffix + "';";
    }

    // ---------- shapes
    function shp(c, name, pos) { var L = c.layers.addShape(); L.name = name; TR(L, "ADBE Position").setValue(pos || [0, 0]); L.motionBlur = true; return L; }
    function grp(L, name) { var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); g.name = name || "g"; return g; }
    function gc(g) { return g.property("ADBE Vectors Group"); }
    function gt(g, n) { return g.property("ADBE Vector Transform Group").property(n); }
    function rect(g, size, pos, r) { var p = gc(g).addProperty("ADBE Vector Shape - Rect"); p.property("ADBE Vector Rect Size").setValue(size); p.property("ADBE Vector Rect Position").setValue(pos || [0, 0]); p.property("ADBE Vector Rect Roundness").setValue(r || 0); return p; }
    function ell(g, size, pos) { var p = gc(g).addProperty("ADBE Vector Shape - Ellipse"); p.property("ADBE Vector Ellipse Size").setValue(size); p.property("ADBE Vector Ellipse Position").setValue(pos || [0, 0]); return p; }
    function path(g, verts, closed) { var p = gc(g).addProperty("ADBE Vector Shape - Group"); var s = new Shape(); s.vertices = verts; s.closed = !!closed; p.property("ADBE Vector Shape").setValue(s); return p; }
    function fill(g, col, op) { var f = gc(g).addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(col); if (op != null) f.property("ADBE Vector Fill Opacity").setValue(op); return f; }
    function stroke(g, col, w, op) { var s = gc(g).addProperty("ADBE Vector Graphic - Stroke"); s.property("ADBE Vector Stroke Color").setValue(col); s.property("ADBE Vector Stroke Width").setValue(w); if (op != null) s.property("ADBE Vector Stroke Opacity").setValue(op); try { s.property("ADBE Vector Stroke Line Cap").setValue(2); } catch (e) {} return s; }
    function trim(g, t0, t1, endVal) { var tr = gc(g).addProperty("ADBE Vector Filter - Trim"); K(tr.property("ADBE Vector Trim End"), [[t0, 0], [t1, endVal == null ? 100 : endVal]], 70); return tr; }
    function shadow(L, op, dist, soft) {
        var e = L.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
        try { e.property(1).setValue([0.25, 0.12, 0.55]); e.property(2).setValue(op == null ? 45 : op); e.property(3).setValue(160); e.property(4).setValue(dist == null ? 14 : dist); e.property(5).setValue(soft == null ? 40 : soft); } catch (er) {}
        return e;
    }
    function card(c, name, size, pos, r) { var L = shp(c, name, pos); var g = grp(L, "card"); rect(g, size, [0, 0], r == null ? 24 : r); fill(g, C.white); shadow(L); return L; }
    function pill(c, name, size, pos, col) { var L = shp(c, name, pos); var g = grp(L, "pill"); rect(g, size, [0, 0], size[1] / 2); fill(g, col || C.violet); return L; }

    // ---------- iconos simples (sin marcas de terceros)
    function icon(c, name, kind, pos, s, col) {
        var L = shp(c, name, pos); col = col || C.violet; s = s || 1;
        var g = grp(L, kind);
        if (kind == "web") { rect(g, [64 * s, 48 * s], [0, 0], 8 * s); stroke(g, col, 6 * s); var g2 = grp(L, "bar"); rect(g2, [64 * s, 12 * s], [0, -18 * s], 4 * s); fill(g2, col); }
        else if (kind == "search") { ell(g, [40 * s, 40 * s], [-6 * s, -6 * s]); stroke(g, col, 7 * s); var g3 = grp(L, "mango"); path(g3, [[9 * s, 9 * s], [24 * s, 24 * s]], false); stroke(g3, col, 8 * s); }
        else if (kind == "chat") { rect(g, [62 * s, 44 * s], [0, -4 * s], 14 * s); stroke(g, col, 6 * s); var g4 = grp(L, "cola"); path(g4, [[-14 * s, 18 * s], [-22 * s, 30 * s], [-2 * s, 18 * s]], true); fill(g4, col); }
        else if (kind == "store") { rect(g, [60 * s, 40 * s], [0, 8 * s], 6 * s); stroke(g, col, 6 * s); var g5 = grp(L, "toldo"); rect(g5, [70 * s, 16 * s], [0, -18 * s], 5 * s); fill(g5, col); }
        else if (kind == "link") { rect(g, [44 * s, 22 * s], [-12 * s, 6 * s], 11 * s); stroke(g, col, 6 * s); gt(g, "ADBE Vector Rotation").setValue(-35); var g6 = grp(L, "eslabon"); rect(g6, [44 * s, 22 * s], [12 * s, -6 * s], 11 * s); stroke(g6, col, 6 * s); gt(g6, "ADBE Vector Rotation").setValue(-35); }
        else if (kind == "check") { // en shapes el PRIMER grupo se dibuja encima: palomita primero
            g.name = "palomita"; path(g, [[-20 * s, 0], [-5 * s, 15 * s], [22 * s, -14 * s]], false); stroke(g, C.white, 10 * s); trim(g, 0, 0.001, 100);
            var g7 = grp(L, "circulo"); ell(g7, [90 * s, 90 * s]); fill(g7, col); }
        else if (kind == "bars") { for (var b = 0; b < 3; b++) { var gb = grp(L, "b" + b); rect(gb, [14 * s, (20 + b * 14) * s], [(-20 + b * 20) * s, (10 - b * 7) * s], 3 * s); fill(gb, col); } }
        return L;
    }

    // ================= PANTALLAS (1280x800) =================
    var SW = 1280, SH = 800;
    function screenBase(name, title, chip) {
        var c = comp(name, SW, SH, 4.5, FS); c.bgColor = C.panel;
        var bg = c.layers.addSolid(C.panel, "fondo", SW, SH, 1, c.duration);
        var sb = shp(c, "sidebar", [0, 0]); var g = grp(sb, "sb"); rect(g, [150, SH], [75, SH / 2], 0); fill(g, C.violetD);
        var ic = ["web", "bars", "search", "chat", "store"];
        for (var i = 0; i < ic.length; i++) {
            if (i == 0) { var hl = shp(c, "sb_sel", [75, 110]); var hg = grp(hl, "sel"); rect(hg, [84, 84], [0, 0], 18); fill(hg, C.violetL); }
            icon(c, "sb_ic" + i, ic[i], [75, 110 + i * 120], 0.75, C.white);
        }
        txt(c, "titulo", title, F.BD, 46, C.ink, "l", [200, 100]);
        if (chip) {
            var cp = pill(c, "chip", [330, 60], [1060, 86], [0.93, 0.90, 1.0]);
            var ct = txt(c, "chip_txt", chip, F.SB, 24, C.violet, "c", [1060, 95]);
        }
        return c;
    }
    function miniCard(c, name, size, pos, label) {
        card(c, name, size, pos, 22);
        txt(c, name + "_lbl", label, F.SB, 28, C.ink, "l", [pos[0] - size[0] / 2 + 28, pos[1] - size[1] / 2 + 48]);
    }

    function screenDash(name, L4, pcts) {
        var c = screenBase(name, "Auditor\u00EDa Digital", null);
        var cw = 500, ch = 290, A = [460, 315], B = [1000, 315], Cc = [460, 640], D = [1000, 640];
        // 1: barras
        miniCard(c, "c1", [cw, ch], A, L4[0]);
        var hs = [0.35, 0.5, 0.42, 0.66, 0.8, 1.0];
        for (var i = 0; i < hs.length; i++) {
            var bl = shp(c, "bar" + i, [A[0] - 170 + i * 52, A[1] + 110]); var bg = grp(bl, "b");
            var h = 150 * hs[i]; rect(bg, [32, h], [0, -h / 2], 6); fill(bg, i == hs.length - 1 ? C.violet : C.violetL, i == hs.length - 1 ? 100 : 55 + i * 8);
            K(TR(bl, "ADBE Scale"), [[0.55 + i * 0.07, [100, 0]], [0.95 + i * 0.07, [100, 108]], [1.1 + i * 0.07, [100, 100]]], 70);
        }
        var d1 = txt(c, "c1_val", "+0%", F.B, 40, C.violet, "r", [A[0] + cw / 2 - 28, A[1] + 120]); counter(d1, "+", pcts[0], "%", 0.7, 1.6);
        // 2: linea
        miniCard(c, "c2", [cw, ch], B, L4[1]);
        var ln = shp(c, "linea", [B[0] - 190, B[1] + 80]); var lg = grp(ln, "l");
        var pts = [[0, 0], [70, -30], [140, -14], [210, -60], [280, -44], [360, -100]];
        path(lg, pts, false); stroke(lg, C.violet, 6); trim(lg, 0.6, 1.5);
        for (var j = 0; j < pts.length; j++) { var dt = shp(c, "punto" + j, add([B[0] - 190, B[1] + 80], pts[j])); var dg = grp(dt, "p"); ell(dg, [16, 16]); fill(dg, C.violet); pop(dt, 0.6 + j * 0.16); }
        var d2 = txt(c, "c2_val", "+0%", F.B, 40, C.violet, "r", [B[0] + cw / 2 - 28, B[1] + 120]); counter(d2, "+", pcts[1], "%", 0.8, 1.7);
        // 3: dona
        miniCard(c, "c3", [cw, ch], Cc, L4[2]);
        var dn = shp(c, "dona", [Cc[0] - 120, Cc[1] + 30]);
        var arc = grp(dn, "arco"); ell(arc, [150, 150]); stroke(arc, C.violet, 22); trim(arc, 0.6, 1.6, pcts[2]);
        var trk = grp(dn, "pista"); ell(trk, [150, 150]); stroke(trk, C.gray, 22);
        var d3 = txt(c, "c3_val", "0%", F.B, 36, C.ink, "c", [Cc[0] - 120, Cc[1] + 43]); counter(d3, "", pcts[2], "%", 0.6, 1.6);
        for (var k = 0; k < 3; k++) { var gl = shp(c, "gris" + k, [Cc[0] + 90, Cc[1] - 10 + k * 40]); var gg = grp(gl, "g"); rect(gg, [k == 0 ? 160 : 120, 16], [0, 0], 8); fill(gg, C.gray); }
        // 4: barras horizontales
        miniCard(c, "c4", [cw, ch], D, L4[3]);
        var fills = [0.78, 0.55, 0.36];
        for (var m = 0; m < 3; m++) {
            var y = D[1] - 20 + m * 52;
            var tk = shp(c, "trk" + m, [D[0] - 200, y]); var tg = grp(tk, "t"); rect(tg, [400, 22], [200, 0], 11); fill(tg, C.gray);
            var fl = shp(c, "fill" + m, [D[0] - 200, y]); var fg = grp(fl, "f"); rect(fg, [400 * fills[m], 22], [200 * fills[m], 0], 11); fill(fg, C.violet);
            K(TR(fl, "ADBE Scale"), [[0.7 + m * 0.12, [0, 100]], [1.2 + m * 0.12, [100, 100]]], 80);
        }
        return c;
    }

    function screenPatterns(name) {
        var c = screenBase(name, "Resultados de Auditor\u00EDa", "\u00DAltimos 90 d\u00EDas");
        miniCard(c, "graf", [1040, 380], [705, 345], "Tendencia de Rendimiento");
        var org = [250, 470];
        for (var y = 0; y < 4; y++) { var gl = shp(c, "grid" + y, [org[0], org[1] - y * 70]); var gg = grp(gl, "g"); path(gg, [[0, 0], [860, 0]], false); stroke(gg, C.gray, 2); }
        var a = [[0, -40], [120, -70], [240, -55], [360, -140], [480, -90], [600, -170], [720, -200], [860, -120]];
        var b = [[0, -20], [120, -45], [240, -80], [360, -60], [480, -110], [600, -95], [720, -130], [860, -105]];
        var L1 = shp(c, "serie_a", org); var g1 = grp(L1, "a"); path(g1, a, false); stroke(g1, C.violet, 7); trim(g1, 0.5, 1.7);
        var L2 = shp(c, "serie_b", org); var g2 = grp(L2, "b"); path(g2, b, false); stroke(g2, C.violetL, 5, 60); trim(g2, 0.65, 1.85);
        var pk = shp(c, "anomalia_ring", add(org, a[6])); var pg = grp(pk, "r"); ell(pg, [46, 46]); stroke(pg, C.violet, 6); var pd = grp(pk, "d"); ell(pd, [16, 16]); fill(pd, C.violet); pop(pk, 1.8);
        TR(pk, "ADBE Scale").expression = "var t = Math.max(0, time - 2.3); value * (1 + 0.08 * Math.sin(t * 6));";
        // la pildora va a la izquierda del pico: la lupa (en la escena) encierra el pico
        var ap = pill(c, "anomalia_pill", [290, 54], [680, 300], C.violet);
        var at = txt(c, "anomalia_txt", "Anomal\u00EDa detectada", F.SB, 24, C.white, "c", [680, 309]);
        pop(ap, 2.0); pop(at, 2.05);
        miniCard(c, "hallazgos", [500, 230], [445, 680], "Hallazgos Clave");
        var hs = [0.4, 0.6, 0.85];
        for (var i = 0; i < 3; i++) { var bl = shp(c, "hb" + i, [270 + i * 44, 760]); var bg = grp(bl, "b"); var h = 110 * hs[i]; rect(bg, [30, h], [0, -h / 2], 5); fill(bg, C.violet, 60 + i * 20); K(TR(bl, "ADBE Scale"), [[0.9 + i * 0.08, [100, 0]], [1.3 + i * 0.08, [100, 100]]], 75); }
        miniCard(c, "patrones", [500, 230], [985, 680], "Patrones Identificados");
        var vals = [0.2, 0.7, 0.4, 0.9, 0.3, 0.6, 0.5, 0.8, 0.25, 0.65, 0.35, 0.95, 0.45, 0.15, 0.75, 0.55, 0.3, 0.85, 0.6, 0.4, 0.7];
        for (var r = 0; r < 3; r++) for (var q = 0; q < 7; q++) {
            var v = vals[r * 7 + q]; var cl = shp(c, "hm" + r + "_" + q, [790 + q * 58, 650 + r * 44]); var cg = grp(cl, "c"); rect(cg, [50, 36], [0, 0], 6); fill(cg, C.violet, 15 + v * 80);
            K(TR(cl, "ADBE Opacity"), [[1.0 + (r * 7 + q) * 0.03, 0], [1.2 + (r * 7 + q) * 0.03, 100]], 60);
        }
        return c;
    }

    function screenPriorities(name) {
        var c = screenBase(name, "Auditor\u00EDa Digital", "Oportunidades detectadas");
        var rows = [["Mejorar velocidad web", "Mayor impacto en rendimiento", 0.88, "Alto", 1.0],
                    ["Optimizar contenido", "Incrementa visibilidad", 0.6, "Medio", 0.7],
                    ["Corregir enlaces rotos", "Mejora experiencia de usuario", 0.3, "Bajo", 0.45]];
        for (var i = 0; i < 3; i++) {
            var y = 270 + i * 180, t0 = 0.4 + i * 0.22, R = rows[i];
            var cd = card(c, "fila" + i, [1060, 150], [710, y], 22);
            var nb = shp(c, "num" + i, [250, y]); var ng = grp(nb, "n"); ell(ng, [78, 78]); fill(ng, C.violet, R[4] * 100);
            var nt = txt(c, "num_txt" + i, String(i + 1), F.B, 40, C.white, "c", [250, y + 14]);
            var t1 = txt(c, "tit" + i, R[0], F.BD, 32, C.ink, "l", [315, y - 8]);
            var t2 = txt(c, "sub" + i, R[1], F.M, 24, C.grayT, "l", [315, y + 30]);
            var il = txt(c, "imp" + i, "Impacto", F.SB, 24, C.ink, "l", [760, y - 18]);
            var tk = shp(c, "trk" + i, [760, y + 18]); var tg = grp(tk, "t"); rect(tg, [260, 18], [130, 0], 9); fill(tg, C.gray);
            var fl = shp(c, "fill" + i, [760, y + 18]); var fg = grp(fl, "f"); rect(fg, [260 * R[2], 18], [130 * R[2], 0], 9); fill(fg, C.violet);
            K(TR(fl, "ADBE Scale"), [[t0 + 0.5, [0, 100]], [t0 + 1.1, [100, 100]]], 80);
            var tp = pill(c, "tag" + i, [130, 54], [1140, y], [0.93, 0.90, 1.0]);
            var tt = txt(c, "tag_txt" + i, R[3], F.SB, 26, C.violet, "c", [1140, y + 9]);
            // entrada de toda la fila desde la derecha
            var grpL = [cd, nb, nt, t1, t2, il, tk, fl, tp, tt];
            for (var g = 0; g < grpL.length; g++) {
                var P = TR(grpL[g], "ADBE Position"), p = P.value;
                if (grpL[g] == fl) { // la barra conserva su escala propia
                }
                K(P, [[t0, [p[0] + 900, p[1]]], [t0 + 0.4, [p[0] - 12, p[1]]], [t0 + 0.55, p]], 75);
            }
        }
        return c;
    }

    // ================= LAPTOP PLACEHOLDER =================
    function laptop(c, name, center, w, screenComp, t0, mirror) {
        var h = w * 0.64;
        var nul = c.layers.addNull(c.duration); nul.name = name; TR(nul, "ADBE Position").setValue(center);
        var base = shp(c, name + "_base", center); var bg = grp(base, "base");
        path(bg, [[-w * 0.6, h / 2], [w * 0.6, h / 2], [w * 0.55, h / 2 + w * 0.05], [-w * 0.55, h / 2 + w * 0.05]], true); fill(bg, C.silver);
        var lid = shp(c, name + "_tapa", center); var lg = grp(lid, "tapa"); rect(lg, [w, h], [0, 0], w * 0.03); fill(lg, C.lid);
        shadow(lid, 35, 30, 80);
        var scr = c.layers.add(screenComp); scr.name = name + "_pantalla";
        var s = (w * 0.94) / SW * 100; TR(scr, "ADBE Scale").setValue([s, s]); TR(scr, "ADBE Position").setValue([center[0], center[1] - h * 0.01]);
        scr.startTime = t0 + 0.1;
        base.parent = nul; lid.parent = nul; scr.parent = nul;
        if (mirror) TR(nul, "ADBE Scale").setValue([100, 100]);
        var P = TR(nul, "ADBE Position");
        K(P, [[t0, [center[0], center[1] + 260]], [t0 + 0.5, [center[0], center[1] - 10]], [t0 + 0.7, center]], 75);
        K(TR(nul, "ADBE Rotate Z"), [[t0, 6], [t0 + 0.6, 0]], 75);
        // aparece con la subida
        var ls = [base, lid, scr];
        for (var i = 0; i < ls.length; i++) K(TR(ls[i], "ADBE Opacity"), [[t0, 0], [t0 + 0.2, 100]], 60);
        // flotacion suave
        P.expression = "var t = Math.max(0, time - " + (t0 + 0.7) + "); value + [0, Math.sin(t * 2.0) * 6];";
        return nul;
    }

    // ================= RIGS CON CLIPS DE FLOW =================
    var FR = app.project.items.addFolder("RIGS"); FR.parentFolder = FOLDER;
    var FC = app.project.items.addFolder("CLIPS FLOW"); FC.parentFolder = FOLDER;
    var clipCache = {};
    function clipItem(k) {
        if (clipCache[k]) return clipCache[k];
        var f = new File(CLIPS[k].file); if (!f.exists) return null;
        var it = app.project.importFile(new ImportOptions(f)); it.parentFolder = FC; clipCache[k] = it; return it;
    }
    function keylight(L, rgb, desat) {
        var k = L.property("ADBE Effect Parade").addProperty("Keylight 906");
        k.property("Keylight 906-0004").setValue([rgb[0] / 255, rgb[1] / 255, rgb[2] / 255]);
        try { k.property("Keylight 906-0012").setValue(30); k.property("Keylight 906-0013").setValue(85); } catch (e) {} // clip black / white
        try { k.property("Keylight 906-0015").setValue(-1.5); k.property("Keylight 906-0016").setValue(0.8); } catch (e) {} // encoger y suavizar borde
        var ch = L.property("ADBE Effect Parade").addProperty("ADBE Simple Choker"); try { ch.property(2).setValue(1.2); } catch (e) {}
        if (desat) { // laptops plateadas: quitar el verde residual del borde desaturando
            var hs = L.property("ADBE Effect Parade").addProperty("ADBE HUE SATURATION");
            try { hs.property(4).setValue(-100); } catch (e) {}
        }
        return k;
    }
    function quadInset(q, f) { var cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4, o = []; for (var i = 0; i < 4; i++) o.push([q[i][0] + (cx - q[i][0]) * f, q[i][1] + (cy - q[i][1]) * f]); return o; }
    // area activa de la pantalla: se recorta el marco en el espacio propio de la pantalla (respeta la perspectiva)
    function quadDisplay(q, bz) {
        return [quadPoint(q, bz[0], bz[1]), quadPoint(q, 1 - bz[0], bz[1]), quadPoint(q, 1 - bz[0], 1 - bz[2]), quadPoint(q, bz[0], 1 - bz[2])];
    }
    // rectangulo redondeado como mascara (radio pequeno)
    function roundRectShape(w, h, r) {
        var k = 0.5523 * r, sh = new Shape();
        sh.vertices = [[r, 0], [w - r, 0], [w, r], [w, h - r], [w - r, h], [r, h], [0, h - r], [0, r]];
        sh.inTangents = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]];
        sh.outTangents = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]];
        sh.closed = true; return sh;
    }
    function quadPoint(q, u, v) { // bilineal TL,TR,BR,BL
        var top = [q[0][0] + (q[1][0] - q[0][0]) * u, q[0][1] + (q[1][1] - q[0][1]) * u], bot = [q[3][0] + (q[2][0] - q[3][0]) * u, q[3][1] + (q[2][1] - q[3][1]) * u];
        return [top[0] + (bot[0] - top[0]) * v, top[1] + (bot[1] - top[1]) * v];
    }
    function maskQuad(L, q) {
        var m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); var s = new Shape(); s.vertices = q; s.closed = true; m.property("ADBE Mask Shape").setValue(s); return m;
    }
    // time remap: entrada acelerada hasta que la laptop se asienta, luego velocidad normal (reutiliza los keys por defecto)
    function remap(L, cfg, tSet, dur, item) {
        L.timeRemapEnabled = true; var tr = L.property("ADBE Time Remapping");
        tr.setValueAtTime(0, cfg.srcIn);
        tr.setValueAtTime(tSet, cfg.settle);
        tr.setValueAtTime(dur, Math.min(item.duration - 0.05, cfg.settle + (dur - tSet)));
        for (var k = tr.numKeys; k >= 1; k--) if (tr.keyTime(k) > dur + 0.01) tr.removeKey(k);
        for (var k2 = 1; k2 <= tr.numKeys; k2++) { if (Math.abs(tr.keyTime(k2) - tSet) < 0.01) { try { tr.setTemporalEaseAtKey(k2, [new KeyframeEase(0, 85)], [new KeyframeEase(0, 0.1)]); } catch (e) {} } }
        L.outPoint = dur;
    }
    // rig: clip con key + time remap (entrada acelerada) + pantalla con corner pin + reflejo del cristal
    function laptopRig(name, k, screenComp, dur, instant) {
        var cfg0 = CLIPS[k], item = clipItem(k); if (!item) return null;
        var cfg = cfg0; if (instant) { cfg = {}; for (var kk in cfg0) cfg[kk] = cfg0[kk]; cfg.srcIn = cfg0.settle - 0.02; }
        var c = comp("RIG | " + name, W, H, dur, FR); c.bgColor = [0, 1, 0];
        var L = c.layers.add(item); L.name = "clip";
        var tSet = instant ? 0.05 : 0.95;
        remap(L, cfg, tSet, dur, item);
        keylight(L, cfg.key, true);
        var q = quadDisplay(cfg.quad, cfg.bezel);
        var scr = c.layers.add(screenComp); scr.name = "pantalla"; scr.startTime = tSet - 0.1;
        var rm = scr.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); rm.property("ADBE Mask Shape").setValue(roundRectShape(SW, SH, 18));
        var cp = scr.property("ADBE Effect Parade").addProperty("ADBE Corner Pin");
        // corner pin en espacio de capa: comp -> capa = p - posicion + ancla
        var off = [SW / 2 - W / 2, SH / 2 - H / 2];
        cp.property(1).setValue(add(q[0], off)); cp.property(2).setValue(add(q[1], off)); cp.property(3).setValue(add(q[3], off)); cp.property(4).setValue(add(q[2], off));
        K(TR(scr, "ADBE Opacity"), [[tSet - 0.1, 0], [tSet + 0.15, 100]], 60);
        var gl = scr.property("ADBE Effect Parade").addProperty("ADBE Glo2");
        try { gl.property("ADBE Glo2-0002").setValue(55); gl.property("ADBE Glo2-0003").setValue(30); gl.property("ADBE Glo2-0004").setValue(0.25); } catch (e) {}
        // reflejo original del cristal encima de la pantalla
        var rf = c.layers.add(item); rf.name = "reflejo"; remap(rf, cfg, tSet, dur, item); rf.blendingMode = BlendingMode.SCREEN; TR(rf, "ADBE Opacity").setValue(20);
        var rfm = maskQuad(rf, cfg.quad);
        // corner pin y mascara del reflejo siguen la pantalla cuadro a cuadro
        if (TRK && TRK[k]) {
            var smp = TRK[k], cpp = scr.property("ADBE Effect Parade").property("ADBE Corner Pin"), pins = [cpp.property(1), cpp.property(2), cpp.property(3), cpp.property(4)];
            for (var si = 0; si < smp.length; si++) {
                var tr0 = tSet + (smp[si][0] - cfg.settle);
                if (tr0 < -0.2 || tr0 > dur + 0.2) continue;
                var dq = quadDisplay(smp[si][1], cfg.bezel);
                pins[0].setValueAtTime(tr0, add(dq[0], off)); pins[1].setValueAtTime(tr0, add(dq[1], off));
                pins[2].setValueAtTime(tr0, add(dq[3], off)); pins[3].setValueAtTime(tr0, add(dq[2], off));
                var ms = new Shape(); ms.vertices = smp[si][1]; ms.closed = true; rfm.property("ADBE Mask Shape").setValueAtTime(tr0, ms);
            }
        }
        rf.moveBefore(scr);
        return c;
    }
    // coloca un rig en la escena: el centro de la laptop cae en 'center' con ancho 'w'
    function placeRig(c, rig, k, center, w, t0) {
        var cfg = CLIPS[k], b = cfg.box, bc = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], s = w / (b[2] - b[0]) * 100;
        var aura = glowSolidC(c, "AURA_HEROE", C.violetL, [center[0], center[1] + 30], w * 0.7, w * 0.42, w * 0.45, 0);
        K(TR(aura, "ADBE Opacity"), [[t0 + 0.6, 0], [t0 + 1.2, 55]], 60);
        TR(aura, "ADBE Scale").expression = "var t = time; value * (1 + 0.06 * Math.sin(t * 1.6));";
        var L = c.layers.add(rig); L.name = "LAPTOP"; L.startTime = t0;
        TR(L, "ADBE Anchor Point").setValue(bc); TR(L, "ADBE Position").setValue(center); TR(L, "ADBE Scale").setValue([s, s]);
        TR(L, "ADBE Position").expression = "var t = Math.max(0, time - " + (t0 + 1.0) + "); value + [0, Math.sin(t * 1.8) * 5];";
        L.motionBlur = true;
        // mapea un punto del clip (px) a la escena
        return { layer: L, map: function (p) { return [center[0] + (p[0] - bc[0]) * s / 100, center[1] + (p[1] - bc[1]) * s / 100]; }, quad: quadDisplay(cfg.quad, cfg.bezel) };
    }
    function glowSolidC(c, name, col, ctr0, rx, ry, feather, op) {
        var GW = 3000, GH = 3600, ctr = [GW / 2, GH / 2];
        var L = c.layers.addSolid(col, name, GW, GH, 1, c.duration);
        var m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        var k = 0.5523, s = new Shape();
        s.vertices = [[ctr[0], ctr[1] - ry], [ctr[0] + rx, ctr[1]], [ctr[0], ctr[1] + ry], [ctr[0] - rx, ctr[1]]];
        s.inTangents = [[-k * rx, 0], [0, -k * ry], [k * rx, 0], [0, k * ry]];
        s.outTangents = [[k * rx, 0], [0, k * ry], [-k * rx, 0], [0, -k * ry]];
        s.closed = true; m.property("ADBE Mask Shape").setValue(s); m.property("ADBE Mask Feather").setValue([feather, feather]);
        TR(L, "ADBE Anchor Point").setValue(ctr); TR(L, "ADBE Position").setValue(ctr0);
        TR(L, "ADBE Opacity").setValue(op); return L;
    }
    // laptop: usa el clip de Flow si existe; si no, el placeholder vectorial
    function hero(c, name, k, screenComp, center, w, t0, dur, instant) {
        var rig = laptopRig(name, k, screenComp, dur, instant);
        if (rig) return placeRig(c, rig, k, center, w, t0);
        laptop(c, "LAPTOP", center, w, screenComp, t0);
        var h = w * 0.64, sw = w * 0.94, sh = sw * SH / SW;
        var q = [[center[0] - sw / 2, center[1] - sh / 2], [center[0] + sw / 2, center[1] - sh / 2], [center[0] + sw / 2, center[1] + sh / 2], [center[0] - sw / 2, center[1] + sh / 2]];
        return { layer: null, map: function (p) { return p; }, quad: q };
    }
    function screenToScene(H_, u, v) { return H_.map(quadPoint(H_.quad, u, v)); }

    function headline(c, lines, t0) { // lines: [[texto, color, font, size, y], ...]
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var ln = lines[i];
            var L = txt(c, "TIT_" + i, ln[0], ln[2] || F.H, ln[3] || 120, ln[1], "c", [540, ln[4]], ln[5] || 900);
            rise(L, t0 + i * 0.12, 70); out.push(L);
        }
        return out;
    }

    // ================= ESCENAS =================
    var scr1 = screenDash("PANTALLA | DASH VISIBILIDAD", ["Visibilidad", "Rendimiento", "Reputaci\u00F3n", "Oportunidades"], [38, 24, 85]);
    var scr2 = screenPatterns("PANTALLA | PATRONES");
    var scr3 = screenPriorities("PANTALLA | PRIORIDADES");
    var scr4 = screenDash("PANTALLA | DASH TRAFICO", ["Tr\u00E1fico", "Conversiones", "Contenido", "Rendimiento"], [42, 29, 78]);

    var PAD = 0.4; // las escenas se solapan 0.4 s para transiciones suaves
    function sceneComp(key, d) { return comp("ESCENA | " + key, W, H, d + PAD, FOLDER); }

    // HOOK — maxima: el primer segundo es el de mas impacto (idea + marca + heroe)
    function logoVivo(L) { // color pleno del logo sobre el degradado violeta
        var hs = L.property("ADBE Effect Parade").addProperty("ADBE HUE SATURATION");
        try { hs.property(4).setValue(35); } catch (e) {}
        var bc = L.property("ADBE Effect Parade").addProperty("ADBE Brightness & Contrast 2");
        try { bc.property(1).setValue(-6); bc.property(2).setValue(30); } catch (e) {}
    }
    function slam(L, t0, base) {
        base = base || 100;
        // en el frame 0 el titular YA se ve (grande y algo desenfocado) y golpea a su tamano
        K(TR(L, "ADBE Scale"), [[t0, [base * 1.12, base * 1.12]], [t0 + 0.16, [base * 0.96, base * 0.96]], [t0 + 0.28, [base, base]]], 80);
        if (t0 > 0) K(TR(L, "ADBE Opacity"), [[t0 - 0.04, 0], [t0 + 0.02, 100]], 60);
        var bz = L.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
        K(bz.property("ADBE Gaussian Blur 2-0001"), [[t0, 14], [t0 + 0.14, 0]], 70);
    }
    var cH = sceneComp("HOOK", 2.5);
    // destello violeta en el frame 0
    var burst = glowSolidC(cH, "DESTELLO", C.violetL, [540, 760], 520, 380, 420, 0);
    burst.blendingMode = BlendingMode.ADD;
    K(TR(burst, "ADBE Opacity"), [[0, 85], [0.6, 0]], 60);
    K(TR(burst, "ADBE Scale"), [[0, [45, 45]], [0.6, [150, 150]]], 70);
    // heroe: laptop frontal con el dashboard ya encendido
    var HH = hero(cH, "HOOK", "lapFr", scr1, [540, 1225], 760, 0, 2.5 + PAD, true);
    if (HH.layer) {
        var hp = TR(HH.layer, "ADBE Position"), hs0 = TR(HH.layer, "ADBE Scale").value[0];
        K(hp, [[0, [540, 1225 + 260]], [0.34, [540, 1213]], [0.48, [540, 1225]]], 80);
        K(TR(HH.layer, "ADBE Scale"), [[0, [hs0 * 0.86, hs0 * 0.86]], [0.42, [hs0, hs0]]], 80);
    }
    // gancho: el dueno del negocio se reconoce en 1 s (gasta en marketing, no vende)
    var h1 = txt(cH, "TIT_0", "INVIERTES EN", F.H, 112, C.ink, "c", [540, 530], 900); slam(h1, 0.0);
    var h2 = txt(cH, "TIT_1", "MARKETING", F.H, 112, C.ink, "c", [540, 650], 900); slam(h2, 0.0);
    var h3 = txt(cH, "TIT_2", "\u00BFY NO VENDES?", F.H, 112, C.violet, "c", [540, 785], 900); slam(h3, 0.22);
    var tagP = pill(cH, "TAG_PILL", [470, 62], [540, 868], C.violet);
    K(TR(tagP, "ADBE Scale"), [[0.45, [0, 100]], [0.7, [100, 100]]], 85);
    var tagT = txt(cH, "TAG_TXT", "INÉDITO TE DICE POR QUÉ", F.B, 30, C.white, "c", [540, 878], 430); pop(tagT, 0.55);
    // las metricas de vanidad suben... las ventas no
    var chips = [["Alcance", 240, [190, 1030], "+"], ["Mensajes", 85, [890, 1090], "+"], ["Ventas", 0, [215, 1395], "+"]];
    for (var i = 0; i < chips.length; i++) {
        var cp = chips[i], t0 = 0.45 + i * 0.1;
        var cd = card(cH, "chip" + i, [280, 124], cp[2], 26); pop(cd, t0);
        var lb = txt(cH, "chip_lbl" + i, cp[0], F.SB, 27, C.grayT, "l", add(cp[2], [-112, -14])); pop(lb, t0 + 0.04);
        var vl = txt(cH, "chip_val" + i, "0%", F.B, 48, cp[1] == 0 ? C.ink : C.violet, "l", add(cp[2], [-112, 38])); pop(vl, t0 + 0.04); counter(vl, cp[3], cp[1], "%", t0, t0 + 0.6);
        var fl = [cd, lb, vl];
        for (var f = 0; f < fl.length; f++) {
            var ex = "value + [0, Math.sin(time * 2.2 + " + i + ") * 7]";
            if (cp[1] == 0) ex = "var t = time - " + (t0 + 0.45) + "; var sx = (t > 0 && t < 0.45) ? Math.sin(t * 55) * 12 * (1 - t / 0.45) : 0; value + [sx, Math.sin(time * 2.2 + " + i + ") * 7]";
            TR(fl[f], "ADBE Position").expression = ex;
        }
    }

    // S1 CONECTA
    var c1 = sceneComp("S1_CONECTA", 3.5);
    headline(c1, [["CONECTAMOS", C.violet, F.H, 120, 520], ["TODA TU INFORMACIÓN", C.ink, F.H, 80, 625]], 0.05);
    var s1 = txt(c1, "SUB", "Web, Google, redes e IA en una sola auditoría", F.M, 44, C.ink, "c", [540, 705], 900); rise(s1, 0.35, 40);
    var H1 = hero(c1, "S1 CONECTA", "lap34", scr1, [540, 1225], 640, 0.25, 3.5 + PAD);
    var src = [["Tu sitio web", "web", [195, 860]], ["B\u00FAsqueda de Google", "search", [540, 815]], ["Chat con IA", "chat", [885, 860]], ["Tu perfil de negocio", "store", [185, 1030]], ["Enlaces (Backlinks)", "link", [895, 1030]]];
    var lapTop = screenToScene(H1, 0.5, 0.0);
    for (var i = 0; i < src.length; i++) {
        var s = src[i], t0 = 0.75 + i * 0.12, p = s[2];
        var ln = shp(c1, "linea" + i, [0, 0]); var lg = grp(ln, "l");
        var tgt = [lapTop[0] + (p[0] - 540) * 0.25, lapTop[1] + 10];
        path(lg, [[p[0], p[1] + 50], [p[0], (p[1] + tgt[1]) / 2], [tgt[0], (p[1] + tgt[1]) / 2], tgt], false); stroke(lg, C.violet, 5, 85); trim(lg, t0 + 0.3, t0 + 0.9);
        var cd = card(c1, "fuente" + i, [290, 104], p, 22); pop(cd, t0);
        var ic = icon(c1, "fuente_ic" + i, s[1], add(p, [-100, 0]), 0.7); pop(ic, t0 + 0.06);
        var tx = txt(c1, "fuente_txt" + i, s[0], F.SB, 26, C.ink, "l", add(p, [-58, 9]), 180); pop(tx, t0 + 0.06);
    }

    // S2 DETECTA
    var c2 = sceneComp("S2_DETECTA", 3.5);
    headline(c2, [["DETECTAMOS", C.violet, F.H, 120, 520], ["DÓNDE PIERDES VENTAS", C.ink, F.H, 80, 630]], 0.05);
    var s2 = txt(c2, "SUB", "Encontramos lo que a simple vista no ves", F.M, 44, C.ink, "c", [540, 715], 900); rise(s2, 0.35, 40);
    var H2 = hero(c2, "S2 DETECTA", "lapFr", scr2, [540, 1160], 860, 0.2, 3.5 + PAD);
    // la lupa encierra el pico de la anomalia: punto (970,270) de la pantalla 1280x800
    var LUPA_AT = screenToScene(H2, 970 / SW, 270 / SH);
    var lupaClip = clipItem("lupa");
    if (lupaClip) {
        var lz = c2.layers.add(lupaClip); lz.name = "LUPA"; lz.startTime = 1.0 - 0.45;
        keylight(lz, CLIPS.lupa.key);
        var hs = lz.property("ADBE Effect Parade").addProperty("ADBE HUE SATURATION");
        try { hs.property(3).setValue(38); hs.property(4).setValue(25); } catch (eh) {}
        var lsc = 175 / CLIPS.lupa.ringD * 100;
        TR(lz, "ADBE Anchor Point").setValue(CLIPS.lupa.ring); TR(lz, "ADBE Scale").setValue([lsc, lsc]);
        K(TR(lz, "ADBE Position"), [[1.0, [LUPA_AT[0] + 520, LUPA_AT[1] + 140]], [1.6, [LUPA_AT[0] - 10, LUPA_AT[1] - 6]], [1.8, LUPA_AT]], 80);
        K(TR(lz, "ADBE Opacity"), [[1.0, 0], [1.15, 100]], 60);
        shadow(lz, 35, 18, 45);
    } else {
    var lupa = shp(c2, "LUPA_PH", LUPA_AT);
    var lr = grp(lupa, "aro"); ell(lr, [160, 160]); stroke(lr, C.violet, 22); var lv = grp(lupa, "vidrio"); ell(lv, [140, 140]); fill(lv, C.white, 22);
    var lm = grp(lupa, "mango"); rect(lm, [36, 120], [0, 130], 18); fill(lm, C.violetD); gt(lm, "ADBE Vector Rotation").setValue(-40);
    K(TR(lupa, "ADBE Position"), [[1.2, [1350, 1300]], [1.7, [LUPA_AT[0] - 12, LUPA_AT[1] - 8]], [1.9, LUPA_AT]], 75);
    K(TR(lupa, "ADBE Rotate Z"), [[1.2, 40], [1.9, 0]], 75);
    TR(lupa, "ADBE Position").expression = "var t = Math.max(0, time - 1.9); value + [Math.sin(t * 1.8) * 6, Math.cos(t * 2.1) * 6];";
    shadow(lupa, 40, 20, 50);
    }

    // S3 PRIORIZA
    var c3 = sceneComp("S3_PRIORIZA", 3.5);
    headline(c3, [["PRIORIZAMOS", C.ink, F.H, 120, 520], ["LO QUE MÁS VENDE", C.violet, F.H, 92, 635]], 0.05);
    var s3 = txt(c3, "SUB", "Sabrás exactamente qué corregir primero", F.M, 46, C.ink, "c", [540, 715], 900); rise(s3, 0.35, 40);
    var H3 = hero(c3, "S3 PRIORIZA", "lapFr", scr3, [560, 1160], 860, 0.2, 3.5 + PAD);
    var tile = card(c3, "TILE_BARRAS", [190, 170], [175, 1000], 30); var tb = icon(c3, "TILE_ic", "bars", [175, 1010], 2.2);
    pop(tile, 1.1); pop(tb, 1.15);
    TR(tile, "ADBE Rotate Z").setValue(-8); TR(tb, "ADBE Rotate Z").setValue(-8);
    for (var r = 0; r < 3; r++) { var ry = shp(c3, "rayo" + r, [140 + r * 35, 880 - (r == 1 ? 25 : 0)]); var rg = grp(ry, "r"); path(rg, [[0, 0], [-(20 - r * 10), -40]], false); stroke(rg, C.violet, 9); trim(rg, 1.3 + r * 0.05, 1.5 + r * 0.05); }

    // S4 CONVIERTE
    var c4 = sceneComp("S4_CONVIERTE", 3.5);
    headline(c4, [["CONVERTIMOS", C.ink, F.H, 120, 500], ["TUS DATOS", C.violet, F.H, 120, 615]], 0.05);
    var en = txt(c4, "TIT_EN", "EN ", F.H, 112, C.ink, "l", [0, 725]);
    var dc = txt(c4, "TIT_DEC", "VENTAS", F.H, 112, C.violet, "l", [0, 725]);
    var gap = 34, wEn = textW(en), wDc = textW(dc), tot = wEn + gap + wDc, sc4 = tot > 900 ? 900 / tot : 1;
    if (sc4 < 1) { TR(en, "ADBE Scale").setValue([sc4 * 100, sc4 * 100]); TR(dc, "ADBE Scale").setValue([sc4 * 100, sc4 * 100]); }
    var x0 = 540 - tot * sc4 / 2;
    TR(en, "ADBE Position").setValue([x0, 725]); TR(dc, "ADBE Position").setValue([x0 + (wEn + gap) * sc4, 725]);
    rise(en, 0.29, 70); rise(dc, 0.33, 70);
    var s4 = txt(c4, "SUB", "Para que inviertas donde sí hay resultados", F.M, 42, C.ink, "c", [540, 800], 920); rise(s4, 0.45, 40);
    var H4 = hero(c4, "S4 CONVIERTE", "lap34", scr4, [420, 1200], 640, 0.25, 3.5 + PAD);
    var rc = card(c4, "RECO", [300, 400], [860, 1160], 28);
    var rck = icon(c4, "RECO_check", "check", [860, 1050], 1.0);
    var rt1 = txt(c4, "RECO_t1", "Recomendaci\u00F3n", F.BD, 30, C.ink, "c", [860, 1140]);
    var rt2 = txt(c4, "RECO_t2", "Estrat\u00E9gica", F.BD, 30, C.ink, "c", [860, 1178]);
    var rls = []; for (var q = 0; q < 3; q++) { var rl = shp(c4, "RECO_l" + q, [860, 1215 + q * 26]); var rgq = grp(rl, "l"); rect(rgq, [q == 2 ? 140 : 220, 12], [0, 0], 6); fill(rgq, C.gray); rls.push(rl); }
    var rb = pill(c4, "RECO_btn", [240, 62], [860, 1320], C.violet);
    var rbt = txt(c4, "RECO_btn_txt", "Tomar acci\u00F3n", F.SB, 28, C.white, "c", [860, 1330]);
    var recoL = [rc, rck, rt1, rt2, rls[0], rls[1], rls[2], rb, rbt];
    for (var z = 0; z < recoL.length; z++) {
        var P = TR(recoL[z], "ADBE Position"), pp = P.value;
        K(P, [[1.0, [pp[0] + 420, pp[1]]], [1.45, [pp[0] - 10, pp[1]]], [1.6, pp]], 75);
        K(TR(recoL[z], "ADBE Opacity"), [[1.0, 0], [1.15, 100]], 60);
    }
    // palomita se dibuja al llegar
    var chkTrim = rck.property("ADBE Root Vectors Group").property("palomita").property("ADBE Vectors Group").property("ADBE Vector Filter - Trim").property("ADBE Vector Trim End");
    while (chkTrim.numKeys > 0) chkTrim.removeKey(1);
    K(chkTrim, [[1.6, 0], [1.95, 100]], 70);
    // clic en el boton
    K(TR(rb, "ADBE Scale"), [[2.3, [100, 100]], [2.4, [92, 92]], [2.55, [104, 104]], [2.7, [100, 100]]], 70);

    // CTA
    var c5 = sceneComp("CTA", 3.5);
    var logoItem = app.project.importFile(new ImportOptions(new File(LOGO_FILE))); logoItem.parentFolder = FA;
    var lg = c5.layers.add(logoItem); lg.name = "LOGO_GRANDE"; var ls = 760 / logoItem.width * 100;
    var haloC = glowSolidC(c5, "HALO_LOGO", C.white, [540, 755], 470, 170, 220, 85);
    TR(lg, "ADBE Position").setValue([540, 760]); pop(lg, 0.1, ls); logoVivo(lg); lg.moveToBeginning();
    var ct1 = txt(c5, "CTA_TIT", "AGENDA TU", F.H, 96, C.ink, "c", [540, 975], 900); rise(ct1, 0.3, 60); var ct1b = txt(c5, "CTA_TIT2", "AUDITORÍA", F.H, 110, C.violet, "c", [540, 1090], 900); rise(ct1b, 0.4, 60);
    var ct2 = txt(c5, "CTA_SUB", "Descubre por qué tu marketing no vende", F.M, 44, C.ink, "c", [540, 1160], 900); rise(ct2, 0.55, 40);
    var cpill = pill(c5, "CTA_PILL", [640, 104], [540, 1270], C.violet);
    K(TR(cpill, "ADBE Scale"), [[0.75, [0, 100]], [1.15, [100, 100]]], 85);
    var cpt = txt(c5, "CTA_PILL_TXT", "Escríbenos por WhatsApp", F.SB, 42, C.white, "c", [540, 1285], 560); rise(cpt, 0.95, 20);
    var web = txt(c5, "CTA_WEB", "449 120 4353", F.B, 50, C.ink, "c", [540, 1390]); rise(web, 1.15, 30); var web2 = txt(c5, "CTA_WEB2", "inedito.digital", F.M, 36, C.grayT, "c", [540, 1445]); rise(web2, 1.3, 20);
    TR(cpill, "ADBE Scale").expression = "var t = Math.max(0, time - 1.6); value * (1 + 0.025 * Math.sin(t * 5));";

    var scenes = { "HOOK": cH, "S1_CONECTA": c1, "S2_DETECTA": c2, "S3_PRIORIZA": c3, "S4_CONVIERTE": c4, "CTA": c5 };

    // ================= FONDO =================
    var cBG = comp("FONDO | DESTELLOS", W, H, TOTAL, FOLDER);
    cBG.layers.addSolid(C.bg, "base", W, H, 1, TOTAL);
    // brillos: solido + mascara eliptica muy calada (un blur sobre shape se recorta en su caja)
    function glowSolid(c, name, col, ctr, rx, ry, feather, op) {
        var L = c.layers.addSolid(col, name, W, H, 1, c.duration);
        var m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        var k = 0.5523, s = new Shape();
        s.vertices = [[ctr[0], ctr[1] - ry], [ctr[0] + rx, ctr[1]], [ctr[0], ctr[1] + ry], [ctr[0] - rx, ctr[1]]];
        s.inTangents = [[-k * rx, 0], [0, -k * ry], [k * rx, 0], [0, k * ry]];
        s.outTangents = [[k * rx, 0], [0, k * ry], [-k * rx, 0], [0, -k * ry]];
        s.closed = true;
        m.property("ADBE Mask Shape").setValue(s);
        m.property("ADBE Mask Feather").setValue([feather, feather]);
        TR(L, "ADBE Opacity").setValue(op);
        return L;
    }
    glowSolidC(cBG, "brillo", C.white, [540, 1050], 620, 760, 520, 75);
    glowSolidC(cBG, "glow_violeta", C.violetL, [540, 1250], 420, 260, 300, 22);
    var widths = [10, 4, 18, 6, 26, 3, 12, 8, 30, 5, 14, 7];
    for (var l = 0; l < widths.length; l++) {
        var st = shp(cBG, "destello" + l, [540 + (l - 6) * 140, 960 + (l % 3) * 120]); var sg = grp(st, "s");
        rect(sg, [1800, widths[l]], [0, 0], widths[l] / 2); fill(sg, C.white, 45 + (l % 4) * 12);
        TR(st, "ADBE Rotate Z").setValue(-35);
        var spd = 60 + (l % 5) * 25, off = l * 230;
        TR(st, "ADBE Position").expression = "var d = [0.819, -0.574]; var s = ((time * " + spd + " + " + off + ") % 1400) - 700; value + d * s;";
    }

    // ================= REEL PRINCIPAL =================
    var main = comp("INEDITO | REEL AUDITORIA 9x16", W, H, TOTAL, FOLDER);
    var bgL = main.layers.add(cBG); bgL.name = "FONDO";
    // ================= AURA MISTICA (entre fondo y escenas) =================
    if (AURA) {
        var cA = comp("AURA | MISTICA", W, H, TOTAL, FOLDER);
        // nieblas violeta que derivan lentamente
        var hz = [[300, 700, 520, 420, 26, 0], [820, 1300, 560, 460, 30, 2], [520, 1650, 620, 360, 22, 4]];
        for (var hI = 0; hI < hz.length; hI++) {
            var hh = hz[hI], hzL = glowSolidC(cA, "niebla" + hI, hI == 1 ? C.violet : C.violetL, [hh[0], hh[1]], hh[2], hh[3], hh[2] * 0.9, hh[4]);
            TR(hzL, "ADBE Position").expression = "value + [Math.sin(time * 0.35 + " + hh[5] + ") * 90, Math.cos(time * 0.28 + " + hh[5] + ") * 70];";
            TR(hzL, "ADBE Opacity").expression = "value * (0.75 + 0.25 * Math.sin(time * 0.9 + " + hh[5] + "));";
        }
        // rayos de luz desde detras del heroe
        var rays = shp(cA, "rayos", [540, 1180]);
        for (var rI = 0; rI < 18; rI++) {
            var rg2 = grp(rays, "r" + rI); var wdt = 18 + (rI % 4) * 14;
            path(rg2, [[0, 0], [-wdt, -1400], [wdt, -1400]], true); fill(rg2, C.white, 30 + (rI % 3) * 15);
            gt(rg2, "ADBE Vector Rotation").setValue(rI * 20 + (rI % 2) * 7);
        }
        TR(rays, "ADBE Rotate Z").expression = "time * 4";
        rays.blendingMode = BlendingMode.ADD; TR(rays, "ADBE Opacity").setValue(16);
        var rb2 = rays.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2"); try { rb2.property("ADBE Gaussian Blur 2-0001").setValue(25); } catch (e) {}
        var rmk = rays.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); var rs = new Shape(), kk = 0.5523, R = 760;
        rs.vertices = [[0, -R], [R, 0], [0, R], [-R, 0]]; rs.inTangents = [[-kk * R, 0], [0, -kk * R], [kk * R, 0], [0, kk * R]]; rs.outTangents = [[kk * R, 0], [0, kk * R], [-kk * R, 0], [0, -kk * R]]; rs.closed = true;
        rmk.property("ADBE Mask Shape").setValue(rs); rmk.property("ADBE Mask Feather").setValue([600, 600]);
        // particulas de polvo luminoso
        for (var pI = 0; pI < 46; pI++) {
            var pt = shp(cA, "polvo" + pI, [0, 0]); var pg2 = grp(pt, "p"); var sz2 = 4 + (pI % 5) * 3;
            ell(pg2, [sz2, sz2]); fill(pg2, (pI % 3 == 0) ? C.violetL : C.white);
            TR(pt, "ADBE Position").expression = "seedRandom(" + pI + ", true); var x = random(40, 1040), sp = random(18, 55), y0 = random(0, 2000); var y = (y0 - time * sp) % 2000; if (y < 0) y += 2000; [x + Math.sin(time * random(0.4, 1.2) + " + pI + ") * 26, y];";
            TR(pt, "ADBE Opacity").expression = "seedRandom(" + pI + ", true); var b = random(35, 95); b * (0.55 + 0.45 * Math.sin(time * random(1, 3) + " + pI + "));";
            if (pI % 4 == 0) { var pb = pt.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2"); try { pb.property("ADBE Gaussian Blur 2-0001").setValue(6); } catch (e) {} }
            pt.blendingMode = BlendingMode.ADD;
        }
        var aL = main.layers.add(cA); aL.name = "AURA";
    }

    // escenas con solape: entran/salen con fundido + desenfoque + leve escala (transicion suave)
    for (var n = 0; n < SC.length; n++) {
        var s = SC[n]; var L = main.layers.add(scenes[s.key]); L.name = s.key;
        var a = (n == 0) ? 0 : s.t - PAD / 2, b = Math.min(TOTAL, s.t + s.d + PAD / 2);
        L.startTime = a; L.inPoint = a; L.outPoint = b;
        var bl = L.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
        try { bl.property("ADBE Gaussian Blur 2-0003").setValue(1); } catch (e) {}
        var BL = bl.property("ADBE Gaussian Blur 2-0001"), OP = TR(L, "ADBE Opacity"), SCL = TR(L, "ADBE Scale");
        if (n > 0) { K(OP, [[a + PAD * 0.35, 0], [a + PAD, 100]], 70); K(BL, [[a + PAD * 0.35, 45], [a + PAD + 0.1, 0]], 70); K(SCL, [[a + PAD * 0.35, [94, 94]], [a + PAD + 0.25, [100, 100]]], 85); }
        if (n < SC.length - 1) { K(OP, [[b - PAD, 100], [b - PAD * 0.35, 0]], 70); K(BL, [[b - PAD - 0.05, 0], [b - PAD * 0.35, 45]], 70); K(SCL, [[b - PAD - 0.05, [100, 100]], [b - PAD * 0.35, [106, 106]]], 70); }
    }
    // logo fijo arriba (todas menos CTA), sale con fundido suave
    var haloT = glowSolidC(main, "HALO_LOGO", C.white, [540, 300], 280, 95, 150, 80); haloT.outPoint = 16.8;
    K(TR(haloT, "ADBE Opacity"), [[16.3, 80], [16.7, 0]], 70);
    var lgTop = main.layers.add(logoItem); lgTop.name = "LOGO_TOP"; logoVivo(lgTop); var lsT = 360 / logoItem.width * 100;
    TR(lgTop, "ADBE Position").setValue([540, 300]); K(TR(lgTop, "ADBE Scale"), [[0, [lsT * 0.85, lsT * 0.85]], [0.16, [lsT * 1.04, lsT * 1.04]], [0.28, [lsT, lsT]]], 80);
    K(TR(lgTop, "ADBE Opacity"), [[16.3, 100], [16.7, 0]], 70); lgTop.outPoint = 16.8;
    // barrido de luz suave en cada corte (sin cubrir la pantalla)
    var cuts = [2.5, 6.0, 9.5, 13.0, 16.5];
    for (var u = 0; u < cuts.length; u++) {
        var tc = cuts[u];
        var sw2 = main.layers.addSolid(C.white, "LUZ_" + (u + 1), 4000, 2000, 1, TOTAL);
        var mk = sw2.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); var ms = new Shape();
        ms.vertices = [[300, 840], [3700, 840], [3700, 1160], [300, 1160]]; ms.closed = true;
        mk.property("ADBE Mask Shape").setValue(ms); mk.property("ADBE Mask Feather").setValue([600, 300]);
        TR(sw2, "ADBE Anchor Point").setValue([2000, 1000]); TR(sw2, "ADBE Rotate Z").setValue(-35);
        K(TR(sw2, "ADBE Position"), [[tc - 0.35, [540 - 700, 960 + 1000]], [tc + 0.35, [540 + 700, 960 - 1000]]], 60);
        K(TR(sw2, "ADBE Opacity"), [[tc - 0.35, 0], [tc, 32], [tc + 0.35, 0]], 60);
        sw2.blendingMode = BlendingMode.ADD; sw2.inPoint = tc - 0.36; sw2.outPoint = tc + 0.36;
        var tint = sw2.property("ADBE Effect Parade").addProperty("ADBE Fill"); try { tint.property("ADBE Fill-0002").setValue([0.78, 0.66, 1.0]); } catch (e) {}
    }
    // guia de zona segura
    var sz = shp(main, "SAFE_ZONE", [0, 0]); var szg = grp(sz, "caja"); rect(szg, [1010, 1280], [540, 860], 0); stroke(szg, [0.8, 0.9, 0.2], 4); sz.guideLayer = true;

    // sin openInViewer: no cambiar la vista de AE mientras el usuario trabaja
    return "ok";
})();
