/*
  INEDITO | REEL "SITIOS WEB PREMIUM CON IA" 9x16 — propuesta A "La vitrina escondida" (v2: copy gancho -> situación -> solución -> CTA, menos efectos)
  Método reels-3d-parallax: un solo espacio 3D, cámara colgada de una cadena de nulls (solo X/Y),
  objetos recortados de Nano Banana a distinta Z con compensación de perspectiva, texto por niveles,
  fondo topográfico con CC RepeTile, remate CC Radial Blur. Genérico: sin clientes concretos.

  Re-ejecutable: borra la carpeta "INEDITO REEL WEB 3D" y la vuelve a crear. ExtendScript ES3.
*/
(function BUILD_INEDITO_WEB3D() {
    var FPS = 30, W = 1080, H = 1920, ZOOM = 1500;
    $.global.PASO = "inicio";
    var _AQUI = File($.fileName).parent; // .../clientes/INEDITO/05_proyectos-ae/scripts
    var ROOT = _AQUI.parent.parent.fsName.replace(/\\/g, "/") + "/";
    var RAIZ = _AQUI.parent.parent.parent.parent.fsName.replace(/\\/g, "/") + "/";
    var A3D = ROOT + "03_assets/3d/";
    var BIB = RAIZ + "_biblioteca/";

    // ---------- paleta (solo marca) / fuentes
    var C = { black: [0, 0, 0], white: [1, 1, 1], violet: [0.361, 0.239, 0.569], gray: [0.718, 0.718, 0.718] };
    var F = { H: "HansonBold", L: "Gilroy-Light", R: "Gilroy-Regular", M: "Gilroy-Medium", SB: "Gilroy-SemiBold", B: "Gilroy-Bold" };

    // ---------- guion: tiempo de lectura (R) = 0.5 s + 0.35 s/palabra, con margen
    // v3: viajes de cámara sincronizados con los golpes de la música (Bright Future Ahead, short): 120 bpm, golpes cada 0.5 s en la pista
    var BP = 0.5, B0 = 0, MOFF = 0.35;        // periodo del pulso (s), un golpe en el segundo 0 de la pista, inicio de la pista en el reel (s)
    var MD = 3 * BP;                      // cada viaje dura 3 pulsos (1.5 s): arranca y llega sobre un golpe
    function beatAt(t) { var kk = Math.ceil((t - MOFF - B0) / BP - 1e-6); return B0 + MOFF + kk * BP; }
    // v2: gancho (dolor) -> situación -> situación -> Inédito lo resuelve -> resultado -> CTA
    var SC = [
        { key: "GANCHO",   R: 3.0, del: [0, 0] },
        { key: "BUSCAN",   R: 3.7, del: [0, 2300] },
        { key: "OTRO",     R: 3.4, del: [2400, 0] },
        { key: "INEDITO",  R: 3.4, del: [0, -2300] },
        { key: "PRIMERO",  R: 3.7, del: [2400, 0] },
        { key: "CTA",      R: 4.2, del: [0, 2300] }
    ];
    var DRIFT = [[-30, -45], [40, -35], [-40, 35], [35, 40], [-40, -35], [0, -35]];
    // horario
    var i, k;
    SC[0].arr = 0; SC[0].rs = 0.45; SC[0].re = SC[0].rs + SC[0].R;
    for (i = 1; i < SC.length; i++) {
        SC[i].mv = beatAt(SC[i - 1].re - 0.1);
        if (i == 5) SC[i].mv = Math.max(SC[i].mv - 0.5, MOFF + 23.75, SC[i - 1].re - 0.1);   // a partir del seg 24 la pista se adelgaza: el ultimo viaje cae en el ultimo golpe fuerte (23.75 de la pista)
        SC[i].arr = SC[i].mv + MD;
        SC[i].rs = SC[i].arr + 0.1;
        SC[i].re = SC[i].rs + SC[i].R;
    }
    var TOTAL = Math.ceil((SC[SC.length - 1].re + 0.1) * FPS) / FPS;
    // centro de cámara (mundo) a mitad de lectura de cada escena
    var acc = [0, 0], accD = [0, 0];
    for (i = 0; i < SC.length; i++) {
        acc = [acc[0] + SC[i].del[0], acc[1] + SC[i].del[1]];
        SC[i].cw = [540 + acc[0] + accD[0] + DRIFT[i][0] * 0.5, 960 + acc[1] + accD[1] + DRIFT[i][1] * 0.5];
        accD = [accD[0] + DRIFT[i][0], accD[1] + DRIFT[i][1]];
    }

    // ---------- utilidades
    function findItem(name) { for (var q = 1; q <= app.project.numItems; q++) { var it = app.project.item(q); if (it.name == name) return it; } return null; }
    var old = findItem("INEDITO REEL WEB 3D");
    if (old) {
        for (var a1 = app.project.numItems; a1 >= 1; a1--) { var it1 = app.project.item(a1); if (it1.parentFolder == old && it1 instanceof CompItem) it1.remove(); }
        for (var a2 = app.project.numItems; a2 >= 1; a2--) { var it2 = app.project.item(a2); if (it2.parentFolder == old) it2.remove(); }
        old.remove();
    }
    var FOLDER = app.project.items.addFolder("INEDITO REEL WEB 3D");
    var FA = app.project.items.addFolder("ASSETS"); FA.parentFolder = FOLDER;

    var CACHE = {}, BASE = {};
    function imp(path) {
        if (CACHE[path]) return CACHE[path];
        var io = new ImportOptions(new File(path)); var it = app.project.importFile(io); it.parentFolder = FA; CACHE[path] = it; return it;
    }
    function TR(L, n) { if (!L) throw Error("TR sin capa " + n); var p = L.property("ADBE Transform Group").property(n); if (!p) throw Error("TR sin propiedad " + n + " en " + L.name); return p; }
    function dimOf(v) { return (v instanceof Array) ? v.length : 1; }
    function setEase(prop, idx, inInf, outInf) {
        var d = prop.isSpatial ? 1 : dimOf(prop.keyValue(idx));
        var ei = [], eo = []; for (var q = 0; q < d; q++) { ei.push(new KeyframeEase(0, inInf)); eo.push(new KeyframeEase(0, outInf)); }
        try { prop.setTemporalEaseAtKey(idx, ei, eo); } catch (e) {}
    }
    // keys: [[t, v], ...]; firma del estilo: k1 sale (out) y k2 frena largo (in)
    function K2(prop, t0, v0, t1, v1, out1, in2) {
        var a = prop.addKey(t0); prop.setValueAtKey(a, v0);
        var b = prop.addKey(t1); prop.setValueAtKey(b, v1);
        a = prop.nearestKeyIndex(t0); b = prop.nearestKeyIndex(t1);
        setEase(prop, a, 16.67, out1); setEase(prop, b, in2, 16.67);
    }
    function Kn(prop, list, inf) { for (var q = 0; q < list.length; q++) { var x = prop.addKey(list[q][0]); prop.setValueAtKey(x, list[q][1]); } for (var r = 1; r <= prop.numKeys; r++) setEase(prop, r, inf || 70, inf || 70); }
    function fx(L, m) { return L.property("ADBE Effect Parade").addProperty(m); }
    function setByName(e, name, v) { try { e.property(name).setValue(v); return true; } catch (er) { return false; } }

    // ---------- comp principal
    var main = app.project.items.addComp("INEDITO | REEL SITIOS WEB IA 3D 9x16", W, H, 1, TOTAL, FPS);
    main.parentFolder = FOLDER; main.bgColor = [0.894, 0.898, 0.918];
    main.renderer = "ADBE Advanced 3d";
    main.motionBlur = true;
    main.shutterAngle = 45;

    // ---------- textos
    function txt(c, name, str, font, size, color, just, pos, leading) {
        var L = c.layers.addText(str); L.name = name;
        var sp = L.property("ADBE Text Properties").property("ADBE Text Document");
        var td = sp.value; td.resetCharStyle(); td.font = font; td.fontSize = size; td.fillColor = color;
        td.applyFill = true; td.applyStroke = false; td.tracking = 0;
        if (leading) { td.autoLeading = false; td.leading = leading; }
        td.justification = (just == "c") ? ParagraphJustification.CENTER_JUSTIFY : (just == "r" ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.LEFT_JUSTIFY);
        sp.setValue(td);
        TR(L, "ADBE Position").setValue(pos);
        return L;
    }
    // revelado por caracteres (selector de rango Inicio 0 -> 100) con la firma 48 / 100
    function revealChars(L, t0, dur, mode) {
        var anims = L.property("ADBE Text Properties").property("ADBE Text Animators");
        var an = anims.addProperty("ADBE Text Animator"); an.name = "ENTRADA";
        var idx = an.propertyIndex;
        var ap = L.property("ADBE Text Properties").property("ADBE Text Animators").property(idx).property("ADBE Text Animator Properties");
        if (mode == "escala") {
            ap.addProperty("ADBE Text Scale 3D");
            ap = L.property("ADBE Text Properties").property("ADBE Text Animators").property(idx).property("ADBE Text Animator Properties");
            ap.property("ADBE Text Scale 3D").setValue([0, 0, 100]);
        } else {
            ap.addProperty("ADBE Text Position 3D");
            ap = L.property("ADBE Text Properties").property("ADBE Text Animators").property(idx).property("ADBE Text Animator Properties");
            ap.property("ADBE Text Position 3D").setValue([0, 55, 0]);
        }
        ap.addProperty("ADBE Text Opacity");
        ap = L.property("ADBE Text Properties").property("ADBE Text Animators").property(idx).property("ADBE Text Animator Properties");
        ap.property("ADBE Text Opacity").setValue(0);
        var sels = L.property("ADBE Text Properties").property("ADBE Text Animators").property(idx).property("ADBE Text Selectors");
        sels.addProperty("ADBE Text Selector");
        var st = L.property("ADBE Text Properties").property("ADBE Text Animators").property(idx).property("ADBE Text Selectors").property(1).property("ADBE Text Percent Start");
        K2(st, t0, 0, t0 + dur, 100, 48, 100);
    }

    // ---------- shapes
    function shp(c, name, pos) { var L = c.layers.addShape(); L.name = name; TR(L, "ADBE Position").setValue(pos || [0, 0]); return L; }
    function grp(L, name) { var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); g.name = name || "g"; return g; }
    function gc(g) { return g.property("ADBE Vectors Group"); }
    function rect(g, size, pos, r) { var p = gc(g).addProperty("ADBE Vector Shape - Rect"); p.property("ADBE Vector Rect Size").setValue(size); p.property("ADBE Vector Rect Position").setValue(pos || [0, 0]); p.property("ADBE Vector Rect Roundness").setValue(r || 0); return p; }
    function ell(g, size, pos) { var p = gc(g).addProperty("ADBE Vector Shape - Ellipse"); p.property("ADBE Vector Ellipse Size").setValue(size); p.property("ADBE Vector Ellipse Position").setValue(pos || [0, 0]); return p; }
    function fill(g, col, op) { var f = gc(g).addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(col); if (op != null) f.property("ADBE Vector Fill Opacity").setValue(op); return f; }
    function stroke(g, col, w, op) { var s = gc(g).addProperty("ADBE Vector Graphic - Stroke"); s.property("ADBE Vector Stroke Color").setValue(col); s.property("ADBE Vector Stroke Width").setValue(w); if (op != null) s.property("ADBE Vector Stroke Opacity").setValue(op); return s; }

    // ---------- ilustraciones en AE (tema claro: blanco/negro con opacidad + gris y violeta de marca)
    function path(g, verts, closed) { var p = gc(g).addProperty("ADBE Vector Shape - Group"); var s = new Shape(); s.vertices = verts; s.closed = !!closed; p.property("ADBE Vector Shape").setValue(s); return p; }
    function roundedShape(x0, y0, w, h, r) {
        var s = new Shape(), q = r * 0.5523;
        s.vertices = [[x0 + r, y0], [x0 + w - r, y0], [x0 + w, y0 + r], [x0 + w, y0 + h - r], [x0 + w - r, y0 + h], [x0 + r, y0 + h], [x0, y0 + h - r], [x0, y0 + r]];
        s.inTangents = [[-q, 0], [0, 0], [0, -q], [0, 0], [q, 0], [0, 0], [0, q], [0, 0]];
        s.outTangents = [[0, 0], [q, 0], [0, 0], [0, q], [0, 0], [-q, 0], [0, 0], [0, -q]];
        s.closed = true; return s;
    }
    function newComp(name, w, h) { var c = app.project.items.addComp(name, w, h, 1, TOTAL, FPS); c.parentFolder = FOLDER; c.bgColor = C.white; return c; }
    function ink(L, op) { TR(L, "ADBE Opacity").setValue(op); return L; }          // texto negro atenuado por opacidad
    function box(c, name, cx, cy, w, h, r, col, op, scol, sw, sop) {                 // rectángulo redondeado centrado en (cx,cy)
        var L = shp(c, name, [cx, cy]);
        if (scol) { var g2 = grp(L, "borde"); rect(g2, [w, h], [0, 0], r); stroke(g2, scol, sw, sop); }
        var g = grp(L, "relleno"); rect(g, [w, h], [0, 0], r); fill(g, col, op);
        return L;
    }
    function popIn(L, t0, dur) { K2(TR(L, "ADBE Scale"), t0, [0, 0], t0 + (dur || 0.45), [100, 100], 41, 78); K2(TR(L, "ADBE Opacity"), t0, 0, t0 + 0.2, 100, 40, 90); }
    function fadeUp(L, t0, op) { var P = TR(L, "ADBE Position"), p = P.value; K2(P, t0, [p[0], p[1] + 14], t0 + 0.4, p, 41, 78); K2(TR(L, "ADBE Opacity"), t0, 0, t0 + 0.3, op == null ? 100 : op, 40, 90); }
    function shade(L, op, dist, soft) {                                              // sombra sutil (tema claro; Shadow Studio no instalado)
        var e = fx(L, "ADBE Drop Shadow");
        try { e.property(1).setValue(C.black); e.property(2).setValue(op); e.property(3).setValue(160); e.property(4).setValue(dist); e.property(5).setValue(soft); } catch (er) {}
        return e;
    }
    function iaFile(f) { return imp(ROOT + "03_assets/logos-ia/" + f); }

    // sitio web genérico "Tu marca" 1000x700. o.gray = sitio sin vida; o.chat = con asistente de IA (aparece desde o.t0)
    function webLight(name, o) {
        var c = newComp(name, 1000, 700);
        c.layers.addSolid(C.white, "PAGINA", 1000, 700, 1);
        var ph = c.layers.add(imp(A3D + "web-foto-interior.jpg")); ph.name = "FOTO";
        var s0 = Math.max(400 / ph.source.width, 420 / ph.source.height);
        TR(ph, "ADBE Scale").setValue([s0 * 100, s0 * 100]); TR(ph, "ADBE Position").setValue([760, 372]);
        var mw = 400 / s0, mh = 420 / s0;
        ph.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        ph.property("ADBE Mask Parade").property(1).property("ADBE Mask Shape").setValue(roundedShape((ph.source.width - mw) / 2, (ph.source.height - mh) / 2, mw, mh, 28 / s0));
        // barra del navegador
        var bar = shp(c, "BARRA", [0, 0]);
        var gd = grp(bar, "puntos"); ell(gd, [16, 16], [34, 30]); ell(gd, [16, 16], [60, 30]); ell(gd, [16, 16], [86, 30]); fill(gd, C.gray, 100);
        var gu = grp(bar, "url"); rect(gu, [440, 34], [500, 30], 17); fill(gu, C.black, 8);
        var gb = grp(bar, "fondo"); rect(gb, [1000, 60], [500, 30], 0); fill(gb, C.black, 5);
        ink(txt(c, "URL", "tumarca.com", F.M, 20, C.black, "c", [500, 37]), 55);
        // menú y titular
        txt(c, "MARCA", "TU MARCA", F.H, 28, C.black, "l", [56, 126]);
        var nav = shp(c, "MENU", [0, 0]); var gn = grp(nav, "links");
        rect(gn, [70, 8], [600, 112], 4); rect(gn, [70, 8], [690, 112], 4); rect(gn, [70, 8], [780, 112], 4); fill(gn, C.black, 18);
        box(c, "NAV_BOTON", 905, 112, 110, 38, 19, C.white, 0, C.violet, 3, 100);
        txt(c, "TITULAR", "Tu negocio,\ral siguiente nivel", F.B, 50, C.black, "l", [56, 262], 58);
        box(c, "SUB1", 206, 352, 300, 10, 5, C.black, 12); box(c, "SUB2", 166, 376, 220, 10, 5, C.black, 12);
        box(c, "BOTON", 171, 450, 230, 62, 31, C.violet, 100);
        txt(c, "BOTON_TXT", "Cotiza ahora", F.B, 24, C.white, "c", [171, 459]);
        // tres tarjetas de servicios
        for (var j = 0; j < 3; j++) {
            var fx0 = 140 + j * 185;
            box(c, "SERV_" + j, fx0, 626, 165, 88, 18, C.white, 100, C.gray, 2, 70);
            box(c, "SERV_ICO_" + j, fx0 - 46, 614, 34, 34, 17, C.violet, 30);
            box(c, "SERV_L1_" + j, fx0 + 12, 640, 90, 8, 4, C.black, 14);
        }
        if (o.chat) {
            var t0 = o.t0;
            var card = box(c, "CHAT", 810, 505, 330, 290, 26, C.white, 100, C.gray, 2, 80); shade(card, 28, 10, 30); popIn(card, t0 + 0.3, 0.5);
            var head = box(c, "CHAT_CABEZA", 810, 392, 300, 44, 22, C.violet, 100); popIn(head, t0 + 0.4, 0.45);
            var hT = txt(c, "CHAT_TIT", "Asistente IA", F.B, 22, C.white, "l", [678, 400]); fadeUp(hT, t0 + 0.5);
            var star = shp(c, "CHAT_DESTELLO", [944, 392]); var gs = grp(star, "e");
            path(gs, [[0, -13], [3.5, -3.5], [13, 0], [3.5, 3.5], [0, 13], [-3.5, 3.5], [-13, 0], [-3.5, -3.5]], true); fill(gs, C.white, 100);
            popIn(star, t0 + 0.55, 0.45);
            var b1 = box(c, "CHAT_B1", 765, 452, 250, 44, 22, C.black, 7); popIn(b1, t0 + 0.9, 0.4);
            ink(txt(c, "CHAT_B1T", "¿Qué servicio buscas?", F.M, 19, C.black, "l", [652, 459]), 80); fadeUp(c.layer("CHAT_B1T"), t0 + 1.0, 80);
            var b2 = box(c, "CHAT_B2", 868, 510, 180, 44, 22, C.violet, 100); popIn(b2, t0 + 1.7, 0.4);
            var b2t = txt(c, "CHAT_B2T", "Quiero cotizar", F.M, 19, C.white, "c", [868, 517]); fadeUp(b2t, t0 + 1.8);
            var b3 = box(c, "CHAT_B3", 775, 568, 270, 44, 22, C.black, 7); popIn(b3, t0 + 2.5, 0.4);
            var b3t = txt(c, "CHAT_B3T", "¡Claro! Te cotizo ahora", F.M, 19, C.black, "l", [652, 575]); fadeUp(b3t, t0 + 2.6, 80);
        }
        if (o.gray) {
            var adj = c.layers.addSolid(C.white, "SIN_VIDA", 1000, 700, 1); adj.adjustmentLayer = true;
            var hs = fx(adj, "ADBE HUE SATURATION"); try { hs.property(4).setValue(-100); } catch (e) {}
        }
        return c;
    }

    // tarjeta "Clientes nuevos hoy: 0"
    function statCard(name) {
        var c = newComp(name, 520, 330);
        box(c, "TARJETA", 260, 165, 500, 310, 30, C.white, 100, C.gray, 2, 70);
        ink(txt(c, "TITULO", "Clientes nuevos hoy", F.SB, 28, C.black, "l", [44, 72]), 55);
        txt(c, "CERO", "0", F.B, 210, C.violet, "l", [44, 262]);
        var ln = shp(c, "LINEA", [0, 0]); var gl = grp(ln, "l"); path(gl, [[236, 218], [466, 218]], false); stroke(gl, C.gray, 5, 100);
        var dot = shp(c, "PUNTO", [466, 218]); var gp = grp(dot, "p"); ell(gp, [24, 24], [0, 0]); fill(gp, C.violet, 100);
        return c;
    }

    // buscador tipo Google con la pregunta escribiéndose (genérica: sirve para cualquier giro)
    function searchBar(name, t0) {
        var c = newComp(name, 1000, 200);
        ink(txt(c, "ETIQUETA", "Google", F.SB, 30, C.black, "l", [34, 46]), 55);
        box(c, "BARRA", 500, 128, 960, 120, 60, C.white, 100, C.gray, 3, 80);
        var ic = shp(c, "LUPA_ICONO", [86, 126]); var gi = grp(ic, "aro"); ell(gi, [34, 34], [0, 0]); stroke(gi, C.violet, 7, 100);
        var gm = grp(ic, "mango"); path(gm, [[13, 13], [30, 30]], false); stroke(gm, C.violet, 7, 100);
        var q = txt(c, "CONSULTA", "x", F.M, 42, C.black, "l", [150, 143]);
        q.property("ADBE Text Properties").property("ADBE Text Document").expression =
            'var s = "el mejor cerca de m\\u00ED"; var n = Math.max(0, Math.min(s.length, Math.floor((time - ' + (t0 + 0.4).toFixed(2) + ') * 14))); s.substr(0, n) + ((Math.floor(time * 2) % 2 == 0) ? "|" : "");';
        return c;
    }

    // chat de IA: mode "buscan" (pregunta + la IA piensa) | "recomienda" (la IA recomienda a "Tu negocio")
    function chatPanel(name, mode, t0) {
        var c = newComp(name, 1000, 340);
        box(c, "PANEL", 500, 170, 960, 316, 34, C.white, 100, C.gray, 2, 80);
        var files = ["openai_web.png", "gemini_web.png", "perplexity_web.png", "claude_web.png"], x = 66;
        for (var j = 0; j < files.length; j++) {
            if (!new File(ROOT + "03_assets/logos-ia/" + files[j]).exists) continue; // logos de terceros: cada quien pone los suyos
            var it = iaFile(files[j]), L = c.layers.add(it); L.name = "IA_" + files[j];
            var s = 40 / it.height * 100, w = it.width * s / 100;
            TR(L, "ADBE Scale").setValue([s, s]); TR(L, "ADBE Position").setValue([x + w / 2, 60]);
            var fe = fx(L, "ADBE Fill"); try { fe.property("ADBE Fill-0002").setValue(C.black); } catch (e) {}
            TR(L, "ADBE Opacity").setValue(80);
            x += w + 34;
        }
        var ub = box(c, "PREGUNTA", 644, 142, 590, 64, 32, C.violet, 100); popIn(ub, t0 + 0.2, 0.45);
        var ut = txt(c, "PREGUNTA_TXT", "¿Quién es el mejor cerca de mí?", F.M, 32, C.white, "l", [370, 153]); fadeUp(ut, t0 + 0.3);
        if (mode == "buscan") {
            var db = box(c, "IA_PENSANDO", 146, 236, 156, 64, 32, C.black, 7); popIn(db, t0 + 1.0, 0.4);
            for (var d = 0; d < 3; d++) {
                var dt = shp(c, "PUNTO_" + d, [106 + d * 40, 236]); var gd = grp(dt, "p"); ell(gd, [16, 16], [0, 0]); fill(gd, C.black, 100);
                TR(dt, "ADBE Opacity").expression = "var t = time - " + (t0 + 1.2).toFixed(2) + "; t < 0 ? 0 : 35 + 45 * (0.5 + 0.5 * Math.sin(t * 6 - " + d + " * 0.9));";
            }
        } else {
            var rb = box(c, "IA_RESPUESTA", 380, 240, 640, 76, 38, C.black, 7); popIn(rb, t0 + 1.0, 0.45);
            var rt = txt(c, "IA_TXT", "Te recomiendo", F.M, 32, C.black, "l", [76, 251]); fadeUp(rt, t0 + 1.2, 85);
            var pl = box(c, "IA_PILDORA", 482, 240, 214, 52, 26, C.violet, 100); popIn(pl, t0 + 1.35, 0.4);
            var pt = txt(c, "IA_PILDORA_TXT", "Tu negocio", F.B, 28, C.white, "c", [482, 250]); fadeUp(pt, t0 + 1.45);
            var ck = shp(c, "IA_CHECK", [640, 240]); var gk = grp(ck, "c"); ell(gk, [46, 46], [0, 0]); fill(gk, C.violet, 100);
            var gc2 = grp(ck, "v"); path(gc2, [[-10, 0], [-3, 8], [11, -8]], false); stroke(gc2, C.white, 6, 100);
            popIn(ck, t0 + 1.7, 0.4);
        }
        return c;
    }

    // resultados de búsqueda. cards: [{kind:"rival"|"yours"|"ghost", url, title, sel}] ; sel -> se elige (borde violet + check) en selT
    function serp(name, cards, selT) {
        var h = cards.length * 150 + 10, c = newComp(name, 1000, h);
        for (var j = 0; j < cards.length; j++) {
            var cd = cards[j], y = 80 + j * 150, ghost = (cd.kind == "ghost"), mine = (cd.kind == "yours");
            var bx = box(c, "CARD_" + j, 500, y, 940, 130, 26, C.white, 100, mine ? C.violet : C.gray, mine ? 6 : 2, mine ? 100 : 70);
            var u = ink(txt(c, "URL_" + j, cd.url, F.M, 22, C.black, "l", [56, y - 22]), 45);
            var t = txt(c, "TIT_" + j, cd.title, F.B, 34, C.black, "l", [56, y + 12]);
            var b1 = box(c, "L1_" + j, 56 + 280, y + 38, 560, 10, 5, C.black, 10), b2 = box(c, "L2_" + j, 56 + 190, y + 56, 380, 10, 5, C.black, 10);
            var parts = [bx, u, t, b1, b2];
            if (ghost) {
                var ch = box(c, "CHIP_" + j, 850, y - 28, 120, 38, 19, C.black, 8); var cht = txt(c, "CHIP_T_" + j, "Página 5", F.SB, 22, C.black, "c", [850, y - 20]);
                parts.push(ch, cht);
                for (var q = 0; q < parts.length; q++) TR(parts[q], "ADBE Opacity").setValue(q == 1 ? 25 : 45);
            }
            if (cd.sel) {
                var sb = box(c, "SEL_BORDE", 500, y, 940, 130, 26, C.black, 0, C.violet, 6, 100);
                K2(TR(sb, "ADBE Opacity"), selT, 0, selT + 0.3, 100, 40, 90);
                var ck = shp(c, "SEL_CHECK", [880, y]); var gk = grp(ck, "c"); ell(gk, [52, 52], [0, 0]); fill(gk, C.violet, 100);
                var gv = grp(ck, "v"); path(gv, [[-11, 0], [-3, 9], [12, -9]], false); stroke(gv, C.white, 6, 100);
                popIn(ck, selT + 0.15, 0.4);
            }
        }
        return c;
    }

    // capa 3D en el espacio del reel, diseñada en "espacio aparente" (sx, sy) de la escena k y compensada por Z
    function put(item, name, k, sx, sy, z, appH, isW) {
        var L = main.layers.add(item); L.name = name; L.threeDLayer = true;
        var f = (ZOOM + z) / ZOOM, cw = SC[k].cw;
        TR(L, "ADBE Position").setValue([cw[0] + (sx - 540) * f, cw[1] + (sy - 960) * f, z]);
        var src = isW ? item.width : item.height;
        var s = appH / src * 100 * f;
        TR(L, "ADBE Scale").setValue([s, s, s]);
        L.motionBlur = true;
        BASE[name] = s;
        return L;
    }
    function textAt(name, k, str, font, size, color, just, sx, sy, leading) {
        var L = txt(main, name, str, font, size, color, just, [0, 0], leading);
        L.threeDLayer = true; L.motionBlur = false;
        TR(L, "ADBE Position").setValue([SC[k].cw[0] + (sx - 540), SC[k].cw[1] + (sy - 960), 0]);
        return L;
    }
    function shpAt(name, k, sx, sy, z) {
        var L = shp(main, name, [0, 0]); L.threeDLayer = true; L.motionBlur = true;
        var f = (ZOOM + z) / ZOOM;
        TR(L, "ADBE Position").setValue([SC[k].cw[0] + (sx - 540) * f, SC[k].cw[1] + (sy - 960) * f, z]);
        TR(L, "ADBE Scale").setValue([100 * f, 100 * f, 100 * f]);
        return L;
    }
    // el ancla entra: escala 0 -> final en 0.9 s (78/41 -> 78/16.67)
    function growIn(L, t0, dur) {
        var s = BASE[L.name] || TR(L, "ADBE Scale").value[0]; dur = dur || 0.9;
        K2(TR(L, "ADBE Scale"), t0, [0, 0, 0], t0 + dur, [s, s, s], 41, 78);
    }
    function floatExpr(L, amp, seed, rot) {
        TR(L, "ADBE Position").expression = "value + [Math.sin(time*1.1+" + seed + ")*" + amp + ", Math.cos(time*0.9+" + seed + ")*" + amp + ", 0];";
        if (rot) TR(L, "ADBE Rotate Z").expression = "value + Math.sin(time*0.8+" + seed + ")*" + rot + ";";
    }
    // aparece y se va con fundido (nada entra ni sale de golpe)
    function fadeExpr(L, t0, t1) {
        TR(L, "ADBE Opacity").expression = "var a = " + t0.toFixed(3) + ", b = " + t1.toFixed(3) + "; value * Math.min(linear(time, a, a + 0.5, 0, 1), linear(time, b - 0.5, b, 1, 0));";
    }
    function life(L, k) {
        var t0 = (k == 0) ? -1 : SC[k].mv - 0.3;
        var t1 = (k == SC.length - 1) ? TOTAL + 1 : SC[k + 1].arr + 0.3;
        L.inPoint = Math.max(0, t0); L.outPoint = Math.min(TOTAL, t1);
        fadeExpr(L, t0, t1);
    }
    function blur(L, v) { var e = fx(L, "ADBE Gaussian Blur 2"); try { e.property(1).setValue(v); e.property(3).setValue(1); } catch (er) {} return e; }
    function glowBehind(name, k, sx, sy, size, op, col) { // resplandor lejano (solido grande con mascara calada); col blanco = luz, violeta = marca
        var z = 2200, f = (ZOOM + z) / ZOOM;
        var L = main.layers.addSolid(col || C.violet, name, 2400, 2400, 1); L.threeDLayer = true;
        TR(L, "ADBE Position").setValue([SC[k].cw[0] + (sx - 540) * f, SC[k].cw[1] + (sy - 960) * f, z]);
        TR(L, "ADBE Scale").setValue([size * f, size * f, 100]);
        L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        var e = new Shape(), r = 700, kk = 0.5523 * r;
        e.vertices = [[1200, 1200 - r], [1200 + r, 1200], [1200, 1200 + r], [1200 - r, 1200]];
        e.inTangents = [[-kk, 0], [0, -kk], [kk, 0], [0, kk]]; e.outTangents = [[kk, 0], [0, kk], [-kk, 0], [0, -kk]]; e.closed = true;
        L.property("ADBE Mask Parade").property(1).property("ADBE Mask Shape").setValue(e);
        L.property("ADBE Mask Parade").property(1).property("ADBE Mask Feather").setValue([520, 520]);
        TR(L, "ADBE Opacity").setValue(op);
        return L;
    }
    function lightSweep(L, t0, dur) { // brillo sobre la palabra de acento
        var e = fx(L, "CC Light Sweep");
        var r = L.sourceRectAtTime(t0 + dur, false);
        setByName(e, "Direction", -88); setByName(e, "Shape", 3); setByName(e, "Width", 50);
        setByName(e, "Sweep Intensity", 25); setByName(e, "Edge Intensity", 50); setByName(e, "Edge Thickness", 4);
        setByName(e, "Light Color", [1, 0.98, 0.94]);
        var cy = r.top + r.height / 2;
        try { K2(e.property("Center"), t0, [r.left - 120, cy], t0 + dur, [r.left + r.width + 120, cy], 40, 80); } catch (er) {}
        return e;
    }

    // ---------- assets
    var IMG = {
        cursor: imp(A3D + "cursor.png"), chat: imp(A3D + "burbuja-chat.png"), uno: imp(A3D + "numero-1.png"), lupa: imp(A3D + "lupa.png")
    };
    var logoIt = imp(ROOT + "03_assets/logos/inedito-negro_2400.png");
    function wp(k, sx, sy, z) { var f = (ZOOM + z) / ZOOM; return [SC[k].cw[0] + (sx - 540) * f, SC[k].cw[1] + (sy - 960) * f, z]; }
    function compAt(comp, name, k, sx, sy, z, appW, ry, rx, round) {
        var L = put(comp, name, k, sx, sy, z, appW, true);
        TR(L, "ADBE Rotate Y").setValue(ry || 0); TR(L, "ADBE Rotate X").setValue(rx || 0);
        if (round) {
            L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
            L.property("ADBE Mask Parade").property(1).property("ADBE Mask Shape").setValue(roundedShape(0, 0, comp.width, comp.height, round));
        }
        return L;
    }
    function popScale(L, t0, dur, from) { var b = BASE[L.name]; K2(TR(L, "ADBE Scale"), t0, [b * from, b * from, b], t0 + dur, [b, b, b], 60, 85); }
    function ctxText(name, k, str, sy) { var L = textAt(name, k, str, F.M, 54, C.black, "l", 96, sy); ink(L, 62); return L; }

    // comps de ilustración (los tiempos de entrada salen del horario de lectura)
    var WEB_G = webLight("WEB | TU MARCA (sin clientes)", { gray: true, chat: false, t0: 0 });
    var STAT = statCard("TARJETA | CLIENTES HOY");
    var BAR = searchBar("BUSCADOR | CONSULTA", SC[1].arr);
    var CHAT_Q = chatPanel("CHAT IA | PREGUNTA", "buscan", SC[1].arr + 0.6);
    var SERP2 = serp("RESULTADOS | ELIGEN OTRO", [
        { kind: "rival", url: "competencia.com", title: "Empresa competidora", sel: true },
        { kind: "rival", url: "otraempresa.com", title: "Otra empresa del giro" },
        { kind: "ghost", url: "tunegocio.com", title: "Tu negocio" }], SC[2].arr + 1.9);
    var WEB_IA = webLight("WEB | TU MARCA (premium + IA)", { gray: false, chat: true, t0: SC[3].arr });
    var SERP4 = serp("RESULTADOS | PRIMERO", [
        { kind: "yours", url: "tunegocio.com", title: "Tu negocio · lo que buscas" },
        { kind: "rival", url: "competencia.com", title: "Empresa competidora" }], 0);
    var CHAT_R = chatPanel("CHAT IA | RECOMIENDA", "recomienda", SC[4].arr + 0.9);

    // ================= FONDO CLARO DE INÉDITO: gris #E4E5EA + topografía suave (multiplicada) + destellos diagonales blancos
    var zBG = 4200, fBG = (ZOOM + zBG) / ZOOM;
    var xs = [], ys = [];
    for (i = 0; i < SC.length; i++) { xs.push(SC[i].cw[0]); ys.push(SC[i].cw[1]); }
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    // fondo topográfico de la biblioteca; si no está (no se distribuye), se usa un sólido gris claro de reemplazo
    var bgItem, topoF = new File(BIB + "04_fondos-loops/fondo ondas topo.mp4");
    if (topoF.exists) bgItem = imp(topoF.fsName);
    else { bgItem = app.project.items.addComp("BG_REEMPLAZO (pon tu fondo en _biblioteca/04_fondos-loops)", 1920, 1080, 1, 10, FPS); bgItem.parentFolder = FOLDER; bgItem.layers.addSolid([0.93, 0.93, 0.95], "BG", 1920, 1080, 1); }
    var BG = main.layers.add(bgItem); BG.name = "BG_topo"; BG.threeDLayer = true;
    var bgS = Math.max(W / bgItem.width, H / bgItem.height) * 100 * fBG * 1.15;
    TR(BG, "ADBE Position").setValue([cx, cy, zBG]); TR(BG, "ADBE Scale").setValue([bgS, bgS, 100]);
    try { BG.timeRemapEnabled = true; BG.property("ADBE Time Remapping").expression = "loopOut('cycle');"; } catch (eL) {}
    BG.outPoint = TOTAL;
    var rt = fx(BG, "CC RepeTile");
    setByName(rt, "Expand Right", 1400); setByName(rt, "Expand Left", 1400); setByName(rt, "Expand Down", 1400); setByName(rt, "Expand Up", 1400);
    setByName(rt, "Tiling", 4);
    BG.blendingMode = BlendingMode.MULTIPLY; TR(BG, "ADBE Opacity").setValue(85);
    var BGS = main.layers.addSolid([0.894, 0.898, 0.918], "BG_base", W, H, 1); BGS.threeDLayer = true;
    TR(BGS, "ADBE Position").setValue([cx, cy, zBG + 400]); TR(BGS, "ADBE Scale").setValue([fBG * 700, fBG * 700, 100]);
    BGS.moveToEnd();
    // destellos diagonales blancos a distinta profundidad (se mueven con el parallax y derivan lento)
    var gw = [10, 4, 18, 6, 26, 3, 12, 8, 30, 5, 14, 7, 9, 16, 22, 5, 11, 6, 20, 8];
    for (var gl = 0; gl < gw.length; gl++) {
        var gz = 1400 + (gl % 4) * 500, gf = (ZOOM + gz) / ZOOM;
        var st = main.layers.addShape(); st.name = "DESTELLO_" + gl; st.threeDLayer = true;
        var sg = grp(st, "s"); rect(sg, [2400, gw[gl]], [0, 0], gw[gl] / 2); fill(sg, C.white, 70 + (gl % 4) * 10);
        TR(st, "ADBE Rotate Z").setValue(-35); TR(st, "ADBE Scale").setValue([gf * 100, gf * 100, 100]);
        var px = (minX - 900) + ((gl * 0.6180339) % 1) * (maxX - minX + 1800), py = (minY - 1100) + ((gl * 0.3819661 + 0.2) % 1) * (maxY - minY + 2200);
        TR(st, "ADBE Position").setValue([px, py, gz]);
        TR(st, "ADBE Position").expression = "value + [0.819, -0.574, 0] * Math.sin(time * 0.18 + " + gl + ") * 260;";
    }

    // ================= ESCENA 0 — GANCHO: "Tienes página web, pero... ¿TE TRAE CLIENTES?"  (web sin vida + contador en 0)
    glowBehind("GLOW_blanco_0", 0, 540, 1150, 95, 42, C.white);
    var web0 = compAt(WEB_G, "IMG_web_sin_vida", 0, 520, 1130, 0, 800, -9, 3, 26); shade(web0, 30, 24, 60);
    popScale(web0, 0, 0.5, 0.92); floatExpr(web0, 4, 1.3, 0); life(web0, 0);
    var st0 = compAt(STAT, "IMG_tarjeta_cero", 0, 750, 1350, -100, 440, 0, 0, 0); shade(st0, 32, 20, 50);
    popScale(st0, 0.1, 0.55, 0.8); floatExpr(st0, 4, 2.2, 0); life(st0, 0);
    var cur0 = put(IMG.cursor, "IMG_cursor_quieto", 0, 290, 1405, -220, 200); TR(cur0, "ADBE Rotate Z").setValue(-8); shade(cur0, 30, 16, 36);
    growIn(cur0, 0.15, 0.6); floatExpr(cur0, 5, 2.1, 2); life(cur0, 0);
    var h0b = ctxText("TXT_gancho_contexto", 0, "Tienes página web, pero...", 470);
    var h0 = textAt("TXT_gancho_clave", 0, "¿TE TRAE\rCLIENTES?", F.H, 112, C.black, "l", 92, 610, 122);
    K2(TR(h0, "ADBE Scale"), 0, [106, 106, 100], 0.42, [100, 100, 100], 60, 100);
    life(h0, 0); life(h0b, 0);

    // ================= ESCENA 1 — "Tus clientes te buscan en GOOGLE Y LA IA"  (buscador escribiendo + chat de IA)
    var a1t = SC[1].arr;
    glowBehind("GLOW_blanco_1", 1, 540, 1200, 95, 42, C.white);
    var bar1 = compAt(BAR, "IMG_buscador", 1, 540, 1015, 0, 860, 0, 0, 0); shade(bar1, 22, 14, 40);
    growIn(bar1, a1t - 0.7, 0.7); life(bar1, 1);
    var chat1 = compAt(CHAT_Q, "IMG_chat_pregunta", 1, 540, 1295, 0, 860, 0, 0, 0); shade(chat1, 22, 14, 40);
    growIn(chat1, a1t - 0.45, 0.7); life(chat1, 1);
    var lupa = put(IMG.lupa, "IMG_lupa", 1, 885, 985, -120, 290); TR(lupa, "ADBE Rotate Z").setValue(8); shade(lupa, 30, 16, 36);
    growIn(lupa, a1t - 0.2, 0.7); floatExpr(lupa, 5, 0.7, 2); life(lupa, 1);
    var t1b = ctxText("TXT_buscan_contexto", 1, "Tus clientes te buscan en", 470);
    var t1a = textAt("TXT_buscan_clave", 1, "GOOGLE\rY LA IA", F.H, 130, C.black, "l", 92, 610, 138);
    revealChars(t1b, a1t - 0.8, 0.6, "subir"); revealChars(t1a, a1t - 0.45, 0.5, "escala");
    life(t1a, 1); life(t1b, 1);

    // ================= ESCENA 2 — "Si tu web no aparece, ELIGEN A OTRO"  (resultados: el cursor elige al competidor)
    var a2t = SC[2].arr;
    glowBehind("GLOW_blanco_2", 2, 540, 1160, 95, 42, C.white);
    var serp2 = compAt(SERP2, "IMG_resultados_otro", 2, 540, 1175, 0, 860, 0, 0, 0); shade(serp2, 22, 14, 40);
    growIn(serp2, a2t - 0.7, 0.7); life(serp2, 2);
    var cur2 = put(IMG.cursor, "IMG_cursor_elige", 2, 900, 1400, -200, 200); TR(cur2, "ADBE Rotate Z").setValue(-6); shade(cur2, 30, 16, 36);
    growIn(cur2, a2t - 0.3, 0.5);
    var P2 = TR(cur2, "ADBE Position");
    K2(P2, a2t + 0.4, wp(2, 900, 1400, -200), a2t + 1.7, wp(2, 712, 1148, -200), 45, 85);
    TR(cur2, "ADBE Scale").expression = "var t = time - " + (a2t + 1.85).toFixed(2) + "; var s = (t > 0 && t < 0.3) ? 1 - 0.14 * Math.sin(t / 0.3 * Math.PI) : 1; value * s;";
    life(cur2, 2);
    var t2b = ctxText("TXT_otro_contexto", 2, "Si tu web no aparece,", 470);
    var t2a = textAt("TXT_otro_clave", 2, "ELIGEN\rA OTRO", F.H, 140, C.black, "l", 92, 615, 146);
    revealChars(t2b, a2t - 0.8, 0.6, "subir"); revealChars(t2a, a2t - 0.45, 0.5, "escala");
    life(t2a, 2); life(t2b, 2);

    // ================= ESCENA 3 — "En Inédito creamos tu web PREMIUM CON IA"  (web premium con asistente de IA atendiendo)
    var a3t = SC[3].arr;
    glowBehind("GLOW_blanco_3", 3, 540, 1200, 95, 42, C.white);
    glowBehind("GLOW_violeta_3", 3, 700, 1250, 60, 14, C.violet);
    var web3 = compAt(WEB_IA, "IMG_web_premium_ia", 3, 540, 1195, 0, 860, 6, 2, 26); shade(web3, 28, 24, 60);
    growIn(web3, a3t - 0.9, 0.9); floatExpr(web3, 4, 0.2, 0); life(web3, 3);
    var chat3 = put(IMG.chat, "IMG_burbuja_ia_web", 3, 915, 930, -130, 200); TR(chat3, "ADBE Rotate Z").setValue(-6); shade(chat3, 28, 16, 36);
    growIn(chat3, a3t - 0.2, 0.7); floatExpr(chat3, 5, 1.9, 2); life(chat3, 3);
    var t3b = ctxText("TXT_inedito_contexto", 3, "En Inédito creamos tu web", 470);
    var t3a = textAt("TXT_inedito_clave", 3, "PREMIUM\rCON IA", F.H, 130, C.black, "l", 92, 615, 138);
    revealChars(t3b, a3t - 0.8, 0.6, "subir"); revealChars(t3a, a3t - 0.45, 0.5, "escala");
    life(t3a, 3); life(t3b, 3);

    // ================= ESCENA 4 — "Te posicionamos PRIMERO en Google y en la IA"  (tú primero en resultados + la IA te recomienda)
    var a4t = SC[4].arr;
    glowBehind("GLOW_blanco_4", 4, 540, 1180, 95, 42, C.white);
    glowBehind("GLOW_violeta_4", 4, 540, 1100, 60, 12, C.violet);
    var serp4 = compAt(SERP4, "IMG_resultados_primero", 4, 540, 1040, 0, 860, 0, 0, 0); shade(serp4, 22, 14, 40);
    growIn(serp4, a4t - 0.7, 0.7); life(serp4, 4);
    var chat4 = compAt(CHAT_R, "IMG_chat_recomienda", 4, 540, 1345, 0, 860, 0, 0, 0); shade(chat4, 22, 14, 40);
    growIn(chat4, a4t - 0.45, 0.7); life(chat4, 4);
    var uno = put(IMG.uno, "IMG_numero_1", 4, 835, 985, -130, 300); TR(uno, "ADBE Rotate Z").setValue(-3); shade(uno, 30, 18, 40);
    growIn(uno, a4t - 0.2, 0.8); floatExpr(uno, 5, 0.9, 1.5); life(uno, 4);
    var t4a = ctxText("TXT_primero_ctx1", 4, "Te posicionamos", 470);
    var t4k = textAt("TXT_primero_clave", 4, "PRIMERO", F.H, 120, C.white, "l", 128, 610);
    var rk = t4k.sourceRectAtTime(a4t + 0.5, false);
    var pill = shpAt("SHAPE_pill_primero", 4, 128 + rk.left + rk.width / 2, 610 + rk.top + rk.height / 2, 3);
    var gpl = grp(pill, "p"); rect(gpl, [rk.width + 70, rk.height + 46], [0, 0], (rk.height + 46) / 2); fill(gpl, C.violet, 100);
    TR(pill, "ADBE Anchor Point").setValue([-(rk.width + 70) / 2, 0, 0]);
    TR(pill, "ADBE Position").setValue([TR(pill, "ADBE Position").value[0] - (rk.width + 70) / 2, TR(pill, "ADBE Position").value[1], 3]);
    K2(TR(pill, "ADBE Scale"), a4t - 0.55, [0, 100, 100], a4t - 0.05, [100, 100, 100], 48, 100);
    var t4c = ctxText("TXT_primero_ctx2", 4, "en Google y en la IA", 745);
    revealChars(t4a, a4t - 0.85, 0.45, "subir"); revealChars(t4k, a4t - 0.45, 0.5, "escala"); revealChars(t4c, a4t - 0.15, 0.55, "subir");
    lightSweep(t4k, a4t + 0.45, 1.1);
    life(t4a, 4); life(t4k, 4); life(t4c, 4); life(pill, 4);

    // ================= ESCENA 5 — CTA: "HAZ QUE TU WEB VENDA" + WhatsApp
    var a5t = SC[5].arr;
    glowBehind("GLOW_blanco_5", 5, 540, 900, 95, 42, C.white);
    var lg = put(logoIt, "IMG_logo_cta", 5, 540, 560, 0, 600, true);
    growIn(lg, a5t - 0.9); life(lg, 5);
    var t5a = textAt("TXT_cta_clave", 5, "HAZ QUE TU\rWEB VENDA", F.H, 108, C.black, "c", 540, 815, 118);
    revealChars(t5a, a5t - 0.5, 0.55, "escala"); life(t5a, 5);
    var wpl = shpAt("SHAPE_pill_whatsapp", 5, 540, 1110, 0); var gw2 = grp(wpl, "p"); rect(gw2, [700, 112], [0, 0], 56); fill(gw2, C.violet, 100);
    K2(TR(wpl, "ADBE Scale"), a5t + 0.1, [0, 100, 100], a5t + 0.5, [100, 100, 100], 48, 100);
    TR(wpl, "ADBE Scale").expression = "var t = Math.max(0, time - " + (a5t + 1.4) + "); value * (1 + 0.02 * Math.sin(t * 5));";
    life(wpl, 5);
    var t5b = textAt("TXT_cta_whatsapp", 5, "WhatsApp 449 120 4353", F.B, 50, C.white, "c", 540, 1128);
    K2(TR(t5b, "ADBE Opacity"), a5t + 0.35, 0, a5t + 0.6, 100, 40, 90); life(t5b, 5);
    var t5c = textAt("TXT_cta_web", 5, "escíbenos · inedito.digital", F.M, 42, C.black, "c", 540, 1246); ink(t5c, 62);
    revealChars(t5c, a5t + 0.5, 0.6, "subir"); life(t5c, 5);
    var cur5 = put(IMG.cursor, "IMG_cursor_clic", 5, 935, 1225, -200, 200); TR(cur5, "ADBE Rotate Z").setValue(-12); shade(cur5, 30, 16, 36);
    growIn(cur5, a5t + 0.4, 0.6); life(cur5, 5);
    TR(cur5, "ADBE Scale").expression = "var t = time - " + (a5t + 1.6) + "; var s = (t > 0 && t < 0.3) ? 1 - 0.12 * Math.sin(t / 0.3 * Math.PI) : 1; value * s;";

    // ================= DECORATIVOS DE RECORRIDO (uno por viaje, nítidos, con fundido)
    function putMid(item, name, i, ox, oy, z, appH, op, rot) {
        var a = SC[i - 1].cw, b = SC[i].cw, f = (ZOOM + z) / ZOOM;
        var L = main.layers.add(item); L.name = name; L.threeDLayer = true; L.motionBlur = true;
        TR(L, "ADBE Position").setValue([(a[0] + b[0]) / 2 + ox * f, (a[1] + b[1]) / 2 + oy * f, z]);
        var s = appH / item.height * 100 * f; TR(L, "ADBE Scale").setValue([s, s, s]);
        TR(L, "ADBE Rotate Z").setValue(rot || 0); TR(L, "ADBE Opacity").setValue(op); shade(L, 26, 14, 34);
        floatExpr(L, 8, i * 1.7, 5);
        var t0 = SC[i].mv - 0.1, t1 = SC[i].arr + 0.4;
        L.inPoint = Math.max(0, t0); L.outPoint = Math.min(TOTAL, t1);
        fadeExpr(L, t0, t1);
        return L;
    }
    putMid(IMG.lupa, "DECO_viaje_1", 1, -240, -120, 500, 300, 90, 10);
    putMid(IMG.cursor, "DECO_viaje_2", 2, 250, -300, 500, 280, 90, -20);
    putMid(IMG.chat, "DECO_viaje_3", 3, -260, 160, 500, 280, 90, 8);
    putMid(IMG.cursor, "DECO_viaje_4", 4, 200, 380, 500, 260, 90, 15);
    putMid(IMG.chat, "DECO_viaje_5", 5, -280, -40, 500, 300, 90, -8);

    // ================= CÁMARA + CADENA DE NULLS (solo X/Y, solape)
    $.global.PASO = '= CÁMARA + CADENA DE NULLS (solo X/Y, sol';
    var MOVES = [];
    var lastI = SC.length - 1;
    for (i = 0; i < SC.length; i++) {
        if (i > 0) MOVES.push({ n: "mov", t0: SC[i].mv, t1: SC[i].arr, d: SC[i].del, o: 30, in2: 88 });
        var d0 = (i == 0) ? 0 : SC[i].arr - 0.35;
        var d1 = (i < lastI) ? SC[i + 1].mv + 0.35 : TOTAL;
        MOVES.push({ n: "deriva", t0: d0, t1: d1, d: DRIFT[i], o: 33, in2: 40 });
    }
    MOVES.sort(function (a, b) { return a.t0 - b.t0; });
    var cam = main.layers.addCamera("CAM_principal", [540, 960]);
    cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
    TR(cam, "ADBE Position").setValue([540, 960, -ZOOM]);
    var co = cam.property("ADBE Camera Options Group");
    co.property("ADBE Camera Zoom").setValue(ZOOM);
    co.property("ADBE Camera Depth of Field").setValue(0);   // sin profundidad de campo: todo nítido
    co.property("ADBE Camera Focus Distance").setValue(ZOOM);
    co.property("ADBE Camera Aperture").setValue(5);
    co.property("ADBE Camera Blur Level").setValue(100);
    var NUL = [];
    for (i = 0; i < MOVES.length; i++) {
        var nl = main.layers.addNull(TOTAL); nl.name = "NULL_cam_" + (i < 9 ? "0" : "") + (i + 1) + "_" + MOVES[i].n;
        nl.threeDLayer = true; TR(nl, "ADBE Anchor Point").setValue([0, 0, 0]); TR(nl, "ADBE Position").setValue([0, 0, 0]);
        NUL.push(nl);
    }
    for (i = 0; i < NUL.length - 1; i++) NUL[i].parent = NUL[i + 1];
    cam.parent = NUL[0];
    for (i = 0; i < NUL.length; i++) {
        var P = TR(NUL[i], "ADBE Position"), v = P.value, m = MOVES[i];
        K2(P, m.t0, v, m.t1, [v[0] + m.d[0], v[1] + m.d[1], v[2]], m.o, m.in2);
    }
    // orden en la timeline: cámara y nulls arriba
    for (i = NUL.length - 1; i >= 0; i--) NUL[i].moveToBeginning();
    cam.moveToBeginning();

    // ================= LOGO FIJO (2D, marca desde el frame 0) — se va antes del CTA
    $.global.PASO = '= LOGO FIJO (2D, marca desde el frame 0) ';
    var lgF = main.layers.add(logoIt); lgF.name = "LOGO_fijo";
    var ls = 250 / logoIt.width * 100; TR(lgF, "ADBE Scale").setValue([ls, ls]); TR(lgF, "ADBE Position").setValue([540, 300]);
    var hsf = fx(lgF, "ADBE HUE SATURATION"); try { hsf.property(4).setValue(30); } catch (e6) {}
    K2(TR(lgF, "ADBE Opacity"), SC[5].mv, 100, SC[5].mv + 0.6, 0, 40, 80);
    lgF.outPoint = SC[5].arr;
    lgF.moveToBeginning();

    // ================= REMATE: capa de ajuste con CC Radial Blur enmascarado (valores fijos)
    $.global.PASO = '= REMATE: capa de ajuste con CC Radial Bl';
    var adj = main.layers.addSolid(C.white, "AJUSTE_radial_blur", W, H, 1); adj.adjustmentLayer = true;
    var rb = fx(adj, "CC Radial Blur");
    setByName(rb, "Type", 6); setByName(rb, "Amount", 0.9); setByName(rb, "Quality", 50); setByName(rb, "Center", [540, 960]);
    var mk = adj.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    var el = new Shape(), rx = 362, ry = 802, kx = 0.5523 * rx, ky = 0.5523 * ry, ex = 521.6, ey = 951.25;
    el.vertices = [[ex, ey - ry], [ex + rx, ey], [ex, ey + ry], [ex - rx, ey]];
    el.inTangents = [[-kx, 0], [0, -ky], [kx, 0], [0, ky]]; el.outTangents = [[kx, 0], [0, ky], [-kx, 0], [0, -ky]]; el.closed = true;
    mk.property("ADBE Mask Shape").setValue(el);
    mk = adj.property("ADBE Mask Parade").property(1); mk.inverted = true;
    mk = adj.property("ADBE Mask Parade").property(1);
    mk.property("ADBE Mask Feather").setValue([1128, 1128]); mk.property("ADBE Mask Offset").setValue(79);
    adj.moveToBeginning();
    adj.enabled = false;   // remate radial desactivado: el productor prefiere todo nítido
    // textos y logo por encima del remate: el radial blur unifica objetos y fondo, el texto queda nítido
    var tops = [];
    for (i = 1; i <= main.numLayers; i++) { var nm = main.layer(i).name; if (nm.indexOf("TXT_") == 0 || nm.indexOf("LOGO_") == 0 || nm.indexOf("SHAPE_pill") == 0 || nm.indexOf("SHAPE_msg") == 0) tops.push(main.layer(i)); }
    for (i = tops.length - 1; i >= 0; i--) tops[i].moveToBeginning();

    // ================= guía de zona segura
    $.global.PASO = '= guía de zona segura';
    var sz = shp(main, "SAFE_ZONE", [0, 0]); var szg = grp(sz, "caja"); rect(szg, [1010, 1280], [540, 860], 0); stroke(szg, [0.8, 0.9, 0.2], 4); sz.guideLayer = true;
    sz.moveToBeginning();

    // ================= MUSICA (biblioteca): Bright Future Ahead (short, 30 s); su final natural cae con el final del CTA
    var mf = new File(BIB + "06_musica/BrightFutureAhead_short_30s.wav");
    if (mf.exists) {
        var au = imp(BIB + "06_musica/BrightFutureAhead_short_30s.wav"), ML = main.layers.add(au); ML.name = "MUSICA_BrightFutureAhead";
        var moff = MOFF; ML.startTime = moff;
        var mlv = ML.property("ADBE Audio Group").property("ADBE Audio Levels");
        mlv.setValueAtTime(moff, [-48, -48]); mlv.setValueAtTime(moff + 0.6, [-8, -8]);
        mlv.setValueAtTime(TOTAL - 1.6, [-8, -8]); mlv.setValueAtTime(TOTAL - 0.1, [-48, -48]);
        ML.moveToEnd();
    }

    main.workAreaStart = 0; main.workAreaDuration = TOTAL;
    var info = [];
    for (i = 0; i < SC.length; i++) info.push(SC[i].key + " llega " + SC[i].arr.toFixed(2) + " lee " + SC[i].rs.toFixed(2) + "-" + SC[i].re.toFixed(2));
    return "TOTAL " + TOTAL.toFixed(2) + " | " + info.join(" | ");
})();
