/*
  INEDITO | REEL POSICIONAMIENTO EN IA 9x16  (v1) — propuesta B "Invisible en el mapa"
  Base de funciones heredada de build_reel_auditoria.jsx (texto, formas, rigs de laptop con seguimiento, dashboards).
  Construye el reel completo en el proyecto abierto: fondo, 6 escenas, pantallas de dashboard,
  tarjetas, logo y transiciones. Las laptops son PLACEHOLDERS vectoriales hasta que lleguen los
  clips de Flow (se reemplazan luego por el clip con key + corner pin de la pantalla).

  Re-ejecutable: borra lo que creó antes (carpeta "INEDITO REEL IA") y lo vuelve a crear.
  ExtendScript ES3.
*/
(function BUILD_INEDITO_IA() {
    var FPS = 24, W = 1080, H = 1920;
    var _AQUI = File($.fileName).parent; // .../clientes/INEDITO/05_proyectos-ae/scripts
    var ROOT = _AQUI.parent.parent.fsName.replace(/\\/g, "/") + "/";
    var RAIZ = _AQUI.parent.parent.parent.parent.fsName.replace(/\\/g, "/") + "/";
    var LOGO_FILE = ROOT + "03_assets/logos/inedito-blanco_2400.png";
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
    // modo oscuro: "ink" es el color de texto principal (casi blanco), "card" el cristal oscuro de las tarjetas
    var C = {
        bg: [0, 0, 0], black: [0, 0, 0], white: [1, 1, 1], ink: [1, 1, 1],
        violet: [0.361, 0.239, 0.569], violetL: [1, 1, 1], violetD: [0.361, 0.239, 0.569],   // #5C3D91 ; violetL = blanco (lineas y brillos)
        gray: [0.718, 0.718, 0.718], grayT: [0.718, 0.718, 0.718], dim: [0.718, 0.718, 0.718], // #B7B7B7
        card: [0, 0, 0], panel: [0, 0, 0], silver: [0.718, 0.718, 0.718], lid: [0.12, 0.12, 0.12], logo: [0.47, 0, 0.812]
    };    var F = { H: "HansonBold", B: "Gilroy-ExtraBold", SB: "Gilroy-SemiBold", M: "Gilroy-Medium", BD: "Gilroy-Bold" };

    // ---------- escenas (tiempos en el reel)
    var SC = [
        { key: "HOOK", t: 0.0, d: 3.6 },
        { key: "S1_PREGUNTAN", t: 3.6, d: 4.6 },
        { key: "S2_NO_EXISTES", t: 8.2, d: 4.0 },
        { key: "S3_INEDITO", t: 12.2, d: 4.4 },
        { key: "S4_TE_ENCUENTRAN", t: 16.6, d: 4.2 },
        { key: "CTA", t: 20.8, d: 4.6 }
    ];
    var TOTAL = 25.4;

    // ---------- utilidades
    function findItem(name) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it.name == name) return it; } return null; }
    var old = findItem("INEDITO REEL IA");
    if (old) { // borrar todo lo de la carpeta (comps y subcarpetas)
        for (var i = app.project.numItems; i >= 1; i--) { var it = app.project.item(i); if (it.parentFolder == old && it instanceof CompItem) it.remove(); }
        for (var j = app.project.numItems; j >= 1; j--) { var it2 = app.project.item(j); if (it2.parentFolder == old) it2.remove(); }
        old.remove();
    }
    var FOLDER = app.project.items.addFolder("INEDITO REEL IA");
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
        try { e.property(1).setValue([0.361, 0.239, 0.569]); e.property(2).setValue(op == null ? 45 : op); e.property(3).setValue(160); e.property(4).setValue(dist == null ? 14 : dist); e.property(5).setValue(soft == null ? 40 : soft); } catch (er) {}
        return e;
    }
    function card(c, name, size, pos, r) { var L = shp(c, name, pos); var g = grp(L, "card"); rect(g, size, [0, 0], r == null ? 24 : r); fill(g, C.card, 90); var g2 = grp(L, "borde"); rect(g2, size, [0, 0], r == null ? 24 : r); stroke(g2, C.violet, 3, 85); shadow(L, 70, 0, 45); return L; }
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
    var DASH_TITLE = "Visibilidad en IA";
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
        var c = screenBase(name, DASH_TITLE, null);
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

    // ================= HERRAMIENTAS DE ESTE REEL =================
    var PAD = 0.4;
    function sceneComp(key, d) { return comp("ESCENA | " + key, W, H, d + PAD, FOLDER); }
    function slam(L, t0, base) { // golpe del titular; con t0 = 0 ya se ve desde el frame 0
        base = base || 100;
        K(TR(L, "ADBE Scale"), [[t0, [base * 1.12, base * 1.12]], [t0 + 0.16, [base * 0.96, base * 0.96]], [t0 + 0.28, [base, base]]], 80);
        if (t0 > 0) K(TR(L, "ADBE Opacity"), [[t0 - 0.04, 0], [t0 + 0.02, 100]], 60);
        var bz = L.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
        K(bz.property("ADBE Gaussian Blur 2-0001"), [[t0, t0 == 0 ? 5 : 14], [t0 + 0.14, 0]], 70);
    }
    function logoVivo(L) {
        var hs = L.property("ADBE Effect Parade").addProperty("ADBE HUE SATURATION");
        try { hs.property(4).setValue(30); } catch (e) {}
        var bc = L.property("ADBE Effect Parade").addProperty("ADBE Brightness & Contrast 2");
        try { bc.property(2).setValue(20); } catch (e) {}
    }
    function neon(L, radius, intensity) {
        var g = L.property("ADBE Effect Parade").addProperty("ADBE Glo2");
        try { g.property("ADBE Glo2-0002").setValue(35); g.property("ADBE Glo2-0003").setValue(radius || 30); g.property("ADBE Glo2-0004").setValue(intensity || 0.8); } catch (e) {}
        return g;
    }
    function aura(L, size, op) { // resplandor violeta de marca (#5C3D91) por sombra sin desplazamiento
        var e = L.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
        try { e.property(1).setValue(C.violet); e.property(2).setValue(op == null ? 90 : op); e.property(4).setValue(0); e.property(5).setValue(size || 40); } catch (er) {}
    }
    var DEG = Math.PI / 180;
    // PUNTO DE RADAR: nucleo + anillo blanco que late. lit=false -> apagado
    function blip(c, name, pos, col, t0, size, lit) {
        var L = shp(c, name, pos); size = size || 26;
        var gR = grp(L, "anillo"); ell(gR, [size * 1.9, size * 1.9]); stroke(gR, C.white, 3, 90);
        if (lit !== false) {
            gt(gR, "ADBE Vector Scale").expression = "var t = time - " + t0 + "; if (t < 0) [100, 100]; else { var p = (t % 1.3) / 1.3; [100 + p * 230, 100 + p * 230]; }";
            gt(gR, "ADBE Vector Group Opacity").expression = "var t = time - " + t0 + "; if (t < 0) 0; else { var p = (t % 1.3) / 1.3; 100 * (1 - p); }";
        } else { gt(gR, "ADBE Vector Group Opacity").setValue(0); }
        var gN = grp(L, "nucleo"); ell(gN, [size, size]); fill(gN, col);
        if (lit !== false) aura(L, 30, 90);
        K(TR(L, "ADBE Scale"), [[t0, [0, 0]], [t0 + 0.18, [130, 130]], [t0 + 0.32, [100, 100]]], 75);
        return L;
    }
    // RADAR: anillos + barrido con estela. Devuelve f(punto) = instante en que el borde del barrido lo cruza.
    function radar(c, name, center, R, t0, start, speed, fadeIn) {
        var rg = shp(c, name + "_anillos", center);
        for (var i = 3; i >= 1; i--) { var g = grp(rg, "a" + i); ell(g, [2 * R * i / 3, 2 * R * i / 3]); stroke(g, C.white, 2, 22); }
        var gx = grp(rg, "cruz"); path(gx, [[-R, 0], [R, 0]], false); stroke(gx, C.white, 1.5, 14);
        var gy = grp(rg, "cruz2"); path(gy, [[0, -R], [0, R]], false); stroke(gy, C.white, 1.5, 14);
        var sw = shp(c, name + "_barrido", center);
        var ge = grp(sw, "borde"); path(ge, [[0, 0], [R, 0]], false); stroke(ge, C.white, 4, 95);
        var trails = [[0, -18, 36], [-18, -45, 20], [-45, -90, 9]];
        for (var k = 0; k < trails.length; k++) {
            var tw = grp(sw, "estela" + k), pts = [[0, 0]];
            for (var a = trails[k][0]; a >= trails[k][1]; a -= 3) pts.push([R * Math.cos(a * DEG), R * Math.sin(a * DEG)]);
            path(tw, pts, true); fill(tw, C.violet, trails[k][2] + 25);
        }
        TR(sw, "ADBE Rotate Z").expression = start + " + (time - " + t0 + ") * " + speed + ";";
        sw.blendingMode = BlendingMode.ADD; aura(sw, 40, 80);
        var cd = shp(c, name + "_centro", center); var gc0 = grp(cd, "c"); ell(gc0, [14, 14]); fill(gc0, C.white); aura(cd, 25, 100);
        if (fadeIn) { var ls = [rg, sw, cd]; for (var j = 0; j < ls.length; j++) K(TR(ls[j], "ADBE Opacity"), [[t0, 0], [t0 + 0.3, 100]], 60); }
        return function (p) {
            var a = Math.atan2(p[1] - center[1], p[0] - center[0]) / DEG;
            var d = ((a - start) % 360 + 360) % 360;
            return t0 + d / speed;
        };
    }
    // LINEA CURVA EN S entre dos puntos (sale y llega en vertical): sin codos ni cruces si los puntos van ordenados
    function curveS(c, name, a, b, t0, dur, col, w) {
        var L = shp(c, name, [0, 0]); var g = grp(L, "l");
        var p = gc(g).addProperty("ADBE Vector Shape - Group"); var sh = new Shape();
        var dy = Math.max(40, Math.abs(b[1] - a[1]) * 0.45) * (b[1] >= a[1] ? 1 : -1);
        sh.vertices = [a, b]; sh.outTangents = [[0, dy], [0, 0]]; sh.inTangents = [[0, 0], [0, -dy]]; sh.closed = false;
        p.property("ADBE Vector Shape").setValue(sh);
        stroke(g, col || C.white, w || 4, 85); trim(g, t0, t0 + (dur || 0.6));
        aura(L, 18, 80); return L;
    }
    // TITULARES: blanco; la palabra/linea de enfasis va sobre una PILDORA de color de marca (#5C3D91)
    function accentPill(c, tl, t0, padX, padY) {
        var r = tl.sourceRectAtTime(0, false), PP = TR(tl, "ADBE Position"), P = PP.numKeys > 0 ? PP.keyValue(PP.numKeys) : PP.value; // posicion FINAL (tras la animacion de entrada)
        var w = r.width + padX * 2, h = r.height + padY * 2;
        var cx = P[0] + r.left + r.width / 2, cy = P[1] + r.top + r.height / 2;
        var pl = shp(c, tl.name + "_PILDORA", [cx, cy]); var g = grp(pl, "p"); rect(g, [w, h], [0, 0], h / 2); fill(g, C.violet);
        aura(pl, 40, 70);
        K(TR(pl, "ADBE Scale"), [[t0, [0, 100]], [t0 + 0.35, [100, 100]]], 85);
        pl.moveAfter(tl); return pl;
    }
    function HL(c, lines, t0) { // lines: [texto, enfasis, tamano, y]
        for (var i = 0; i < lines.length; i++) {
            var ln = lines[i], tt = t0 + i * 0.12;
            var L = txt(c, "TIT_" + i, ln[0], F.H, ln[2], C.white, "c", [540, ln[3]], 900);
            rise(L, tt, 60);
            if (ln[1]) accentPill(c, L, tt + 0.15, 38, 16);
        }
    }
    function sub(c, name, str, y, t0, size) { var L = txt(c, name, str, F.M, size || 40, C.gray, "c", [540, y], 900); rise(L, t0, 30); return L; }
    // logos de IAs (PNG blancos del sitio de Inedito)
    var logoIA = {};
    function iaItem(f) {
        if (logoIA[f]) return logoIA[f];
        var ff = new File(ROOT + "03_assets/logos-ia/" + f); if (!ff.exists) return null;
        var it = app.project.importFile(new ImportOptions(ff)); it.parentFolder = FA; logoIA[f] = it; return it;
    }
    function iaLogo(c, f, pos, h, t0) {
        var it = iaItem(f); if (!it) return null;
        var L = c.layers.add(it); L.name = "IA_" + f; var s = h / it.height * 100;
        TR(L, "ADBE Position").setValue(pos); pop(L, t0, s); return L;
    }
    function bubbleNum(c, n, pos, t0) { // circulo de marca con numero
        var L = shp(c, "NUM" + n, pos); var g = grp(L, "n"); ell(g, [50, 50]); fill(g, C.violet); pop(L, t0);
        var T = txt(c, "NUM_T" + n, String(n), F.B, 28, C.white, "c", add(pos, [0, 10])); pop(T, t0); return [L, T];
    }
    function equis(c, name, pos, s, col, t0) {
        var L = shp(c, name, pos); var g = grp(L, "x"); path(g, [[-s, -s], [s, s]], false); stroke(g, col, 7, 100);
        var g2 = grp(L, "x2"); path(g2, [[-s, s], [s, -s]], false); stroke(g2, col, 7, 100); pop(L, t0); return L;
    }

    // ================= PANTALLA (dashboard oscuro) =================
    var scrIA = screenDash("PANTALLA | VISIBILIDAD IA", ["Menciones en IA", "Recomendaciones", "Visibilidad", "Fuentes optimizadas"], [68, 41, 92]);

    // ================= HOOK (0-3.6 s): TU EMPRESA ES INVISIBLE PARA LA IA =================
    var cH = sceneComp("HOOK", SC[0].d);
    var RC = [540, 1185], RR = 320;
    var hit = radar(cH, "RADAR", RC, RR, 0, -150, 210, false);
    var comps = [[[RC[0] - 200, RC[1] - 130], "Competidor A"], [[RC[0] + 215, RC[1] - 40], "Competidor B"], [[RC[0] - 120, RC[1] + 190], "Competidor C"]];
    for (var i = 0; i < comps.length; i++) {
        var p = comps[i][0], th = hit(p);
        var dimL = blip(cH, "COMP_DIM" + i, p, C.gray, 0, 18, false); TR(dimL, "ADBE Opacity").setValue(40);
        blip(cH, "COMP" + i, p, C.white, th, 26, true);
        var ct = txt(cH, "COMP_TXT" + i, comps[i][1], F.SB, 26, C.white, "l", add(p, [26, 9])); pop(ct, th + 0.05);
    }
    var you = [RC[0] + 150, RC[1] + 175];
    var yb = blip(cH, "TU_EMPRESA", you, C.gray, 0.05, 30, false);
    TR(yb, "ADBE Opacity").expression = "50 + 25 * Math.sin(time * 6)";
    var yc = card(cH, "TU_CARD", [330, 92], add(you, [-20, 105]), 46);
    var yt1 = txt(cH, "TU_TXT1", "Tu empresa", F.BD, 30, C.white, "c", add(you, [-20, 98]));
    var yt2 = txt(cH, "TU_TXT2", "No encontrado", F.SB, 24, C.gray, "c", add(you, [-20, 130]));
    var yl = [yc, yt1, yt2], tY = 1.0;
    for (var j = 0; j < yl.length; j++) { pop(yl[j], tY + j * 0.03); TR(yl[j], "ADBE Position").expression = "var t = time - " + (tY + 0.45) + "; var sx = (t > 0 && t < 0.45) ? Math.sin(t * 55) * 10 * (1 - t / 0.45) : 0; value + [sx, 0]"; }
    var h1 = txt(cH, "TIT_0", "TU EMPRESA ES", F.H, 92, C.white, "c", [540, 520], 880); slam(h1, 0);
    var h2 = txt(cH, "TIT_1", "INVISIBLE", F.H, 150, C.white, "c", [540, 680], 900); slam(h2, 0.06); accentPill(cH, h2, 0.1, 44, 22);
    var h3 = txt(cH, "TIT_2", "PARA LA IA", F.H, 92, C.white, "c", [540, 790], 880); slam(h3, 0.16);

    // ================= S1 (3.6-8.2 s): UNA SOLA PREGUNTA, UNA SOLA RESPUESTA =================
    var c1 = sceneComp("S1_PREGUNTAN", SC[1].d);
    HL(c1, [["CADA D\u00CDA MILES", false, 96, 500], ["LE PREGUNTAN A LA IA", true, 74, 610]], 0.05);
    var chat = card(c1, "CHAT", [900, 660], [540, 1085], 36); pop(chat, 0.7);
    iaLogo(c1, "openai_web.png", [245, 805], 54, 0.95);
    var qB = pill(c1, "PREG", [640, 84], [690, 905], C.violet); pop(qB, 1.15);
    var qT = txt(c1, "PREG_T", "\u00BFQu\u00E9 agencia me recomiendas?", F.SB, 31, C.white, "c", [690, 916], 600); pop(qT, 1.2);
    var rec = ["Competidor A", "Competidor B", "Competidor C"];
    for (var r2 = 0; r2 < rec.length; r2++) {
        var ry = 1030 + r2 * 86, tR = 1.9 + r2 * 0.5;
        bubbleNum(c1, r2 + 1, [160, ry], tR);
        var rt = txt(c1, "RESP_TXT" + r2, rec[r2], F.BD, 38, C.white, "l", [220, ry + 13]); rise(rt, tR, 20);
    }
    // 4a fila: tu empresa NO esta (contorno gris + equis)
    var gh = shp(c1, "TU_FILA", [540, 1305]); var ggh = grp(gh, "f"); rect(ggh, [780, 70], [0, 0], 35); stroke(ggh, C.gray, 3, 70); pop(gh, 3.45);
    var ghT = txt(c1, "TU_TXT", "Tu empresa", F.BD, 36, C.gray, "l", [190, 1318]); rise(ghT, 3.5, 20);
    var ghX = equis(c1, "TU_X", [850, 1305], 18, C.white, 3.55);
    var shk = "var t = time - 3.65; var sx = (t > 0 && t < 0.45) ? Math.sin(t * 55) * 10 * (1 - t / 0.45) : 0; value + [sx, 0]";
    TR(gh, "ADBE Position").expression = shk; TR(ghT, "ADBE Position").expression = shk; TR(ghX, "ADBE Position").expression = shk;

    // ================= S2 (8.2-12.2 s): SI NO APARECES, NO EXISTES =================
    var c2 = sceneComp("S2_NO_EXISTES", SC[2].d);
    HL(c2, [["SI NO APARECES,", false, 90, 500], ["NO EXISTES", true, 130, 640]], 0.05);
    sub(c2, "SUB", "Tus clientes eligen a otro", 740, 0.45, 46);
    var YC = [540, 1130], CA = [235, 1000], CB = [845, 1000];
    var rutas = [CA, CB];
    for (var c3i = 0; c3i < rutas.length; c3i++) {
        var cmp = rutas[c3i];
        blip(c2, "COMP" + c3i, cmp, C.white, 0.4 + c3i * 0.15, 36, true);
        var lnk = shp(c2, "RUTA" + c3i, [0, 0]); var lg = grp(lnk, "l"); path(lg, [YC, cmp], false); stroke(lg, C.white, 3, 55);
        trim(lg, 0.7 + c3i * 0.15, 1.2 + c3i * 0.15);
        for (var dI = 0; dI < 3; dI++) { // clientes que se van con la competencia (de tu empresa hacia el competidor)
            var dt = shp(c2, "CLIENTE" + c3i + "_" + dI, YC); var dg = grp(dt, "d"); ell(dg, [14, 14]); fill(dg, C.white);
            var t1 = 1.4 + c3i * 0.25 + dI * 0.6;
            K(TR(dt, "ADBE Position"), [[t1, YC], [t1 + 0.8, cmp]], 60);
            K(TR(dt, "ADBE Opacity"), [[t1, 0], [t1 + 0.1, 100], [t1 + 0.7, 100], [t1 + 0.8, 0]], 60);
        }
    }
    blip(c2, "TU_EMPRESA", YC, C.gray, 0.2, 64, false);
    var bt2 = txt(c2, "TU_TXT", "Tu empresa", F.BD, 34, C.gray, "c", [540, 1250]); pop(bt2, 0.45);
    var zc = card(c2, "CERO_CARD", [470, 120], [540, 1395], 34); pop(zc, 1.6);
    var zt = txt(c2, "CERO", "0", F.B, 66, C.white, "c", [370, 1420]); pop(zt, 1.65);
    var zl = txt(c2, "CERO_T", "menciones en IA", F.SB, 32, C.gray, "l", [420, 1410]); pop(zl, 1.7);

    // ================= S3 (12.2-16.6 s): EN INEDITO TE PONEMOS EN EL MAPA DE LA IA =================
    var c3 = sceneComp("S3_INEDITO", SC[3].d);
    HL(c3, [["EN IN\u00C9DITO TE PONEMOS", false, 66, 500], ["EN EL MAPA DE LA IA", true, 80, 612]], 0.05);
    sub(c3, "SUB", "Optimizamos tus fuentes para que la IA te conozca", 700, 0.5, 34);
    var H3 = hero(c3, "S3 INEDITO", "lapFr", scrIA, [540, 1225], 760, 0.2, SC[3].d + PAD);
    var lapTop3 = screenToScene(H3, 0.5, 0.0);
    var src3 = [["Sitio web", "web"], ["Google", "store"], ["Rese\u00F1as", "chat"], ["Contenido", "search"]];
    for (var s3i = 0; s3i < 4; s3i++) {
        var tS = 1.0 + s3i * 0.25, cx3 = 165 + s3i * 250, cy3 = 800;
        var cd3 = card(c3, "fuente" + s3i, [232, 86], [cx3, cy3], 22); pop(cd3, tS);
        var ic3 = icon(c3, "fuente_ic" + s3i, src3[s3i][1], [cx3 - 80, cy3], 0.55, C.white); pop(ic3, tS + 0.05);
        var tx3 = txt(c3, "fuente_txt" + s3i, src3[s3i][0], F.SB, 25, C.white, "l", [cx3 - 48, cy3 + 9], 130); pop(tx3, tS + 0.05);
        // una curva por fuente, cada una a su punto del borde superior de la pantalla (orden de izquierda a derecha, sin cruces)
        var endX = lapTop3[0] + (s3i - 1.5) * 150;
        curveS(c3, "LINEA" + s3i, [cx3, cy3 + 43], [endX, lapTop3[1] + 6], tS + 0.3, 0.7, C.white, 4);
    }

    // ================= S4 (16.6-20.8 s): AHORA TE ENCUENTRAN =================
    var c4 = sceneComp("S4_TE_ENCUENTRAN", SC[4].d);
    HL(c4, [["AHORA", false, 100, 500], ["TE ENCUENTRAN", true, 104, 630]], 0.05);
    sub(c4, "SUB", "La IA ya te recomienda", 735, 0.5, 46);
    var R4C = [540, 1150], R4 = 300;
    var rg4 = shp(c4, "ANILLOS", R4C); // solo anillos (sin barrido): menos lineas que compitan con las conexiones
    for (var ri = 3; ri >= 1; ri--) { var rgi = grp(rg4, "a" + ri); ell(rgi, [2 * R4 * ri / 3, 2 * R4 * ri / 3]); stroke(rgi, C.white, 2, 22); }
    K(TR(rg4, "ADBE Opacity"), [[0, 0], [0.4, 100]], 60);
    var meL = blip(c4, "TU_EMPRESA", R4C, C.violet, 0.5, 74, true);
    var LOG4 = ["openai_web.png", "gemini_web.png", "claude_web.png", "perplexity_web.png"];
    var pos4 = [[300, 985], [780, 985], [300, 1315], [780, 1315]]; // X simetrica: 4 diagonales iguales hacia el centro
    for (var o = 0; o < 4; o++) {
        var tO = 0.9 + o * 0.2;
        var lnO = shp(c4, "RAYO" + o, [0, 0]); var lgO = grp(lnO, "l"); path(lgO, [pos4[o], R4C], false); stroke(lgO, C.white, 3, 75); trim(lgO, tO, tO + 0.45); aura(lnO, 15, 70);
        var lc = card(c4, "IA_CARD" + o, [220, 74], pos4[o], 37); pop(lc, tO);
        iaLogo(c4, LOG4[o], pos4[o], 30, tO + 0.04);
    }
    var mc = pill(c4, "TU_CARD", [500, 104], [540, 1455], C.violet); K(TR(mc, "ADBE Scale"), [[2.0, [0, 100]], [2.4, [100, 100]]], 85); aura(mc, 40, 80);
    var mt1 = txt(c4, "TU_TXT1", "Tu empresa \u00B7 Recomendada", F.B, 34, C.white, "c", [540, 1467], 460); rise(mt1, 2.2, 15);

    // ================= CTA (20.8-25.4 s) =================
    var c5 = sceneComp("CTA", SC[5].d);
    var logoItem = app.project.importFile(new ImportOptions(new File(LOGO_FILE))); logoItem.parentFolder = FA;
    glowSolidC(c5, "HALO_LOGO", C.violet, [540, 760], 520, 220, 260, 45);
    var lg5 = c5.layers.add(logoItem); lg5.name = "LOGO_GRANDE"; var lsc = 720 / logoItem.width * 100;
    TR(lg5, "ADBE Position").setValue([540, 760]); pop(lg5, 0.1, lsc); logoVivo(lg5);
    HL(c5, [["APARECE DONDE", false, 92, 975], ["TUS CLIENTES PREGUNTAN", true, 66, 1075]], 0.3);
    sub(c5, "CTA_SUB", "Posicionamiento en IA \u00B7 In\u00E9dito", 1160, 0.9, 40);
    var cpill = pill(c5, "CTA_PILL", [640, 104], [540, 1290], C.violet); aura(cpill, 40, 80);
    K(TR(cpill, "ADBE Scale"), [[1.2, [0, 100]], [1.6, [100, 100]]], 85);
    TR(cpill, "ADBE Scale").expression = "var t = Math.max(0, time - 2.0); value * (1 + 0.025 * Math.sin(t * 5));";
    var cpt = txt(c5, "CTA_PILL_TXT", "Escr\u00EDbenos por WhatsApp", F.SB, 42, C.white, "c", [540, 1305], 560); rise(cpt, 1.4, 20);
    var web = txt(c5, "CTA_WEB", "449 120 4353", F.B, 50, C.white, "c", [540, 1410]); rise(web, 1.7, 30);
    var web2 = txt(c5, "CTA_WEB2", "inedito.digital", F.M, 36, C.gray, "c", [540, 1465]); rise(web2, 1.9, 20);

    var scenes = { "HOOK": cH, "S1_PREGUNTAN": c1, "S2_NO_EXISTES": c2, "S3_INEDITO": c3, "S4_TE_ENCUENTRAN": c4, "CTA": c5 };

    // ================= FONDO: TOPOGRAFIA OSCURA (biblioteca) =================
    var BIB = RAIZ + "_biblioteca/04_fondos-loops/";
    var cBG = comp("FONDO | TOPO OSCURO", W, H, TOTAL, FOLDER);
    cBG.layers.addSolid(C.bg, "base", W, H, 1, TOTAL);
    var topoF = new File(BIB + "fondo ondas topo negras.mp4");
    if (topoF.exists) {
        var topoIt = app.project.importFile(new ImportOptions(topoF)); topoIt.parentFolder = FA;
        var mk = function (nm, op, sc, rot, speed) {
            var L = cBG.layers.add(topoIt); L.name = nm;
            L.timeRemapEnabled = true; L.property("ADBE Time Remapping").expression = "(time * " + speed + ") % " + (topoIt.duration - 0.05);
            L.outPoint = TOTAL;
            TR(L, "ADBE Rotate Z").setValue(rot); TR(L, "ADBE Scale").setValue([sc, sc]); TR(L, "ADBE Position").setValue([540, 960]);
            TR(L, "ADBE Scale").expression = "value * (1 + 0.04 * Math.sin(time * 0.3))";
            var tn = L.property("ADBE Effect Parade").addProperty("ADBE Tint");
            try { tn.property(1).setValue([0, 0, 0]); tn.property(2).setValue(C.violet); } catch (e) {}
            L.blendingMode = BlendingMode.SCREEN; TR(L, "ADBE Opacity").setValue(op);
            return L;
        };
        mk("TOPO", 85, 100, 90, 1);
        mk("TOPO_PROFUNDO", 30, 130, -90, 0.5);
    }
    glowSolidC(cBG, "glow_violeta", C.violet, [540, 1150], 520, 620, 520, 38);
    var vig = cBG.layers.addSolid(C.black, "vineta", W, H, 1, TOTAL);
    var vm = vig.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); var vs = new Shape(), kq = 0.5523, rx = 640, ry = 1050;
    vs.vertices = [[540, 960 - ry], [540 + rx, 960], [540, 960 + ry], [540 - rx, 960]];
    vs.inTangents = [[-kq * rx, 0], [0, -kq * ry], [kq * rx, 0], [0, kq * ry]]; vs.outTangents = [[kq * rx, 0], [0, kq * ry], [-kq * rx, 0], [0, -kq * ry]]; vs.closed = true;
    vm.property("ADBE Mask Shape").setValue(vs); vm.property("ADBE Mask Feather").setValue([500, 500]); vm.inverted = true; TR(vig, "ADBE Opacity").setValue(75);

    // ================= REEL PRINCIPAL =================
    var main = comp("INEDITO | REEL POSICIONAMIENTO IA 9x16", W, H, TOTAL, FOLDER);
    var bgL = main.layers.add(cBG); bgL.name = "FONDO";
    if (AURA) {
        var cA = comp("AURA | MARCA", W, H, TOTAL, FOLDER);
        var hz = [[300, 700, 520, 420, 30, 0], [820, 1300, 560, 460, 34, 2], [520, 1650, 620, 360, 26, 4]];
        for (var hI = 0; hI < hz.length; hI++) {
            var hh = hz[hI], hzL = glowSolidC(cA, "niebla" + hI, C.violet, [hh[0], hh[1]], hh[2], hh[3], hh[2] * 0.9, hh[4]);
            TR(hzL, "ADBE Position").expression = "value + [Math.sin(time * 0.35 + " + hh[5] + ") * 90, Math.cos(time * 0.28 + " + hh[5] + ") * 70];";
            hzL.blendingMode = BlendingMode.SCREEN;
        }
        for (var pI = 0; pI < 50; pI++) {
            var pt = shp(cA, "polvo" + pI, [0, 0]); var pg2 = grp(pt, "p"); var sz2 = 3 + (pI % 5) * 2;
            ell(pg2, [sz2, sz2]); fill(pg2, (pI % 3 == 0) ? C.gray : C.white);
            TR(pt, "ADBE Position").expression = "seedRandom(" + pI + ", true); var x = random(40, 1040), sp = random(15, 45), y0 = random(0, 2000); var y = (y0 - time * sp) % 2000; if (y < 0) y += 2000; [x + Math.sin(time * random(0.4, 1.2) + " + pI + ") * 24, y];";
            TR(pt, "ADBE Opacity").expression = "seedRandom(" + pI + ", true); var b = random(20, 70); b * (0.55 + 0.45 * Math.sin(time * random(1, 3) + " + pI + "));";
            pt.blendingMode = BlendingMode.ADD;
        }
        var aL = main.layers.add(cA); aL.name = "AURA";
    }
    for (var n = 0; n < SC.length; n++) {
        var sdef = SC[n]; var SL = main.layers.add(scenes[sdef.key]); SL.name = sdef.key;
        var a = (n == 0) ? 0 : sdef.t - PAD / 2, b = Math.min(TOTAL, sdef.t + sdef.d + PAD / 2);
        SL.startTime = a; SL.inPoint = a; SL.outPoint = b;
        var bl = SL.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
        try { bl.property("ADBE Gaussian Blur 2-0003").setValue(1); } catch (e) {}
        var BLp = bl.property("ADBE Gaussian Blur 2-0001"), OP = TR(SL, "ADBE Opacity"), SCL = TR(SL, "ADBE Scale");
        if (n > 0) { K(OP, [[a + PAD * 0.35, 0], [a + PAD, 100]], 70); K(BLp, [[a + PAD * 0.35, 45], [a + PAD + 0.1, 0]], 70); K(SCL, [[a + PAD * 0.35, [94, 94]], [a + PAD + 0.25, [100, 100]]], 85); }
        if (n < SC.length - 1) { K(OP, [[b - PAD, 100], [b - PAD * 0.35, 0]], 70); K(BLp, [[b - PAD - 0.05, 0], [b - PAD * 0.35, 45]], 70); K(SCL, [[b - PAD - 0.05, [100, 100]], [b - PAD * 0.35, [106, 106]]], 70); }
    }
    var ctaT = SC[5].t;
    var lgTop = main.layers.add(logoItem); lgTop.name = "LOGO_TOP"; logoVivo(lgTop); var lsT = 360 / logoItem.width * 100;
    TR(lgTop, "ADBE Position").setValue([540, 300]);
    K(TR(lgTop, "ADBE Scale"), [[0, [lsT * 0.85, lsT * 0.85]], [0.16, [lsT * 1.04, lsT * 1.04]], [0.28, [lsT, lsT]]], 80);
    K(TR(lgTop, "ADBE Opacity"), [[ctaT - 0.5, 100], [ctaT - 0.1, 0]], 70); lgTop.outPoint = ctaT;
    for (var u = 1; u < SC.length; u++) {
        var tc = SC[u].t;
        var sw2 = main.layers.addSolid(C.white, "LUZ_" + u, 4000, 2000, 1, TOTAL);
        var mk2 = sw2.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); var ms = new Shape();
        ms.vertices = [[300, 840], [3700, 840], [3700, 1160], [300, 1160]]; ms.closed = true;
        mk2.property("ADBE Mask Shape").setValue(ms); mk2.property("ADBE Mask Feather").setValue([600, 300]);
        TR(sw2, "ADBE Anchor Point").setValue([2000, 1000]); TR(sw2, "ADBE Rotate Z").setValue(-35);
        K(TR(sw2, "ADBE Position"), [[tc - 0.35, [540 - 700, 960 + 1000]], [tc + 0.35, [540 + 700, 960 - 1000]]], 60);
        K(TR(sw2, "ADBE Opacity"), [[tc - 0.35, 0], [tc, 22], [tc + 0.35, 0]], 60);
        sw2.blendingMode = BlendingMode.ADD; sw2.inPoint = tc - 0.36; sw2.outPoint = tc + 0.36;
    }
    var sz = shp(main, "SAFE_ZONE", [0, 0]); var szg = grp(sz, "caja"); rect(szg, [1010, 1280], [540, 860], 0); stroke(szg, [0.8, 0.9, 0.2], 4); sz.guideLayer = true;
    return "ok";
})();
