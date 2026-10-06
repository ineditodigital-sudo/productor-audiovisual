// ============================================================
//  INSPECTOR DE PROYECTO - After Effects
//  SOLO LEE. No modifica, no crea, no borra nada.
//  Genera un reporte de texto en el Escritorio.
// ============================================================

(function () {

    var MAX_KEYS_POR_PROP = 40;
    var out = [];

    function w(s) { out.push(s); }

    function r(n, c) {
        var s = "";
        for (var i = 0; i < n; i++) { s += c; }
        return s;
    }

    function ind(n) { return r(n * 2, " "); }

    function num(v) {
        if (typeof v !== "number") { return String(v); }
        var x = Math.round(v * 100) / 100;
        return String(x);
    }

    function val(v) {
        if (v === null || v === undefined) { return "-"; }
        if (v instanceof Array) {
            var a = [];
            for (var i = 0; i < v.length; i++) { a.push(num(v[i])); }
            return "[" + a.join(", ") + "]";
        }
        if (typeof v === "number") { return num(v); }
        if (typeof v === "boolean") { return v ? "si" : "no"; }
        if (typeof v === "object") { return "(objeto)"; }
        return String(v);
    }

    function interpName(t) {
        try {
            if (t === KeyframeInterpolationType.LINEAR) { return "lineal"; }
            if (t === KeyframeInterpolationType.BEZIER) { return "bezier"; }
            if (t === KeyframeInterpolationType.HOLD) { return "hold"; }
        } catch (e) {}
        return "?";
    }

    // --- keyframes con easing (lo mas importante para entender el estilo) ---
    function dumpKeys(p, level) {
        var n = p.numKeys;
        w(ind(level) + "KEYFRAMES: " + n);
        var lim = n < MAX_KEYS_POR_PROP ? n : MAX_KEYS_POR_PROP;
        for (var k = 1; k <= lim; k++) {
            var line = ind(level + 1) + "k" + k +
                       "  t=" + num(p.keyTime(k)) + "s" +
                       "  v=" + val(p.keyValue(k));
            try {
                line += "  in=" + interpName(p.keyInInterpolationType(k)) +
                        "/out=" + interpName(p.keyOutInterpolationType(k));
            } catch (e) {}
            try {
                var ei = p.keyInTemporalEase(k);
                var eo = p.keyOutTemporalEase(k);
                if (ei && ei.length > 0) {
                    line += "  easeIn(inf=" + num(ei[0].influence) + " vel=" + num(ei[0].speed) + ")";
                }
                if (eo && eo.length > 0) {
                    line += "  easeOut(inf=" + num(eo[0].influence) + " vel=" + num(eo[0].speed) + ")";
                }
            } catch (e) {}
            w(line);
        }
        if (n > lim) { w(ind(level + 1) + "... (" + (n - lim) + " keyframes mas)"); }
    }

    function dumpProp(p, level, forzarValor) {
        var tieneKeys = false;
        try { tieneKeys = (p.numKeys > 0); } catch (e) {}

        var tieneExpr = false;
        try { tieneExpr = (p.expressionEnabled && p.expression !== ""); } catch (e) {}

        var modificada = false;
        try { modificada = !p.isTimeVarying && p.value !== undefined; } catch (e) {}

        if (!tieneKeys && !tieneExpr && !forzarValor) { return; }

        var etiqueta = ind(level) + "- " + p.name;
        if (!tieneKeys) {
            try { etiqueta += " = " + val(p.value); } catch (e) {}
        }
        w(etiqueta);

        if (tieneKeys) { dumpKeys(p, level + 1); }
        if (tieneExpr) {
            w(ind(level + 1) + "EXPRESION: " + p.expression.replace(/\n/g, " | "));
        }
    }

    function dumpGrupo(g, level, forzarValor) {
        for (var i = 1; i <= g.numProperties; i++) {
            var p;
            try { p = g.property(i); } catch (e) { continue; }
            if (!p) { continue; }
            try {
                if (p.propertyType === PropertyType.PROPERTY) {
                    dumpProp(p, level, forzarValor);
                } else {
                    var hijos = 0;
                    try { hijos = p.numProperties; } catch (e) {}
                    if (hijos > 0) {
                        var antes = out.length;
                        w(ind(level) + "[" + p.name + "]");
                        dumpGrupo(p, level + 1, forzarValor);
                        if (out.length === antes + 1) { out.pop(); }
                    }
                }
            } catch (e) {}
        }
    }

    function dumpCapa(L, level) {
        var tipo = "capa";
        try {
            if (L instanceof CameraLayer) { tipo = "CAMARA"; }
            else if (L instanceof LightLayer) { tipo = "LUZ"; }
            else if (L instanceof TextLayer) { tipo = "TEXTO"; }
            else if (L instanceof ShapeLayer) { tipo = "FORMA"; }
            else if (L.nullLayer) { tipo = "NULL"; }
            else if (L.source && L.source instanceof CompItem) { tipo = "PRECOMP"; }
            else if (L.source) { tipo = "MEDIA"; }
        } catch (e) {}

        w("");
        w(ind(level) + r(56, "-"));
        w(ind(level) + "#" + L.index + "  " + L.name + "   <" + tipo + ">");

        var meta = ind(level) + "   ";
        try { meta += "3D=" + (L.threeDLayer ? "SI" : "no"); } catch (e) {}
        try { meta += "  in=" + num(L.inPoint) + "s  out=" + num(L.outPoint) + "s"; } catch (e) {}
        try { if (L.parent) { meta += "  padre=" + L.parent.name; } } catch (e) {}
        try { if (L.blendingMode !== BlendingMode.NORMAL) { meta += "  blend=" + L.blendingMode; } } catch (e) {}
        w(meta);

        // texto
        try {
            if (L instanceof TextLayer) {
                var td = L.property("ADBE Text Properties").property("ADBE Text Document").value;
                w(ind(level) + "   TEXTO: \"" + td.text.replace(/\r/g, " / ") + "\"");
                w(ind(level) + "   FUENTE: " + td.font + "  size=" + num(td.fontSize));
                var anim = L.property("ADBE Text Properties").property("ADBE Text Animators");
                if (anim && anim.numProperties > 0) {
                    w(ind(level) + "   ANIMADORES DE TEXTO: " + anim.numProperties);
                    dumpGrupo(anim, level + 2, false);
                }
            }
        } catch (e) {}

        // transform — SIEMPRE los valores base, tengan keyframes o no.
        // Sin esto no se puede comparar una composición contra otra.
        try {
            var tr = L.property("ADBE Transform Group");
            if (tr) {
                w(ind(level) + "   TRANSFORM:");
                var claves = ["ADBE Anchor Point", "ADBE Position", "ADBE Scale",
                              "ADBE Rotate Z", "ADBE Orientation", "ADBE Opacity"];
                for (var ti = 0; ti < claves.length; ti++) {
                    var pp;
                    try { pp = tr.property(claves[ti]); } catch (e) { continue; }
                    if (!pp) { continue; }
                    try {
                        if (pp.numKeys > 0) {
                            w(ind(level + 2) + "- " + pp.name + "  (animada)");
                            dumpKeys(pp, level + 3);
                        } else {
                            w(ind(level + 2) + "- " + pp.name + " = " + val(pp.value));
                        }
                    } catch (e) {}
                }
            }
        } catch (e) {}

        // opciones de camara
        try {
            if (L instanceof CameraLayer) {
                var co = L.property("ADBE Camera Options Group");
                if (co) {
                    w(ind(level) + "   OPCIONES DE CAMARA:");
                    dumpGrupo(co, level + 2, true);
                }
            }
        } catch (e) {}

        // opciones de material 3D
        try {
            if (L.threeDLayer) {
                var mo = L.property("ADBE Material Options Group");
                if (mo) {
                    var a2 = out.length;
                    w(ind(level) + "   MATERIAL 3D:");
                    dumpGrupo(mo, level + 2, false);
                    if (out.length === a2 + 1) { out.pop(); }
                }
            }
        } catch (e) {}

        // efectos: TODOS los valores (aca esta Shadow Studio)
        try {
            var fx = L.property("ADBE Effect Parade");
            if (fx && fx.numProperties > 0) {
                w(ind(level) + "   EFECTOS (" + fx.numProperties + "):");
                for (var e2 = 1; e2 <= fx.numProperties; e2++) {
                    var ef = fx.property(e2);
                    w(ind(level + 2) + "* " + ef.name + "   [matchName: " + ef.matchName + "]");
                    dumpGrupo(ef, level + 3, true);
                }
            }
        } catch (e) {}

        // mascaras — con todos los detalles
        try {
            var mk = L.property("ADBE Mask Parade");
            if (mk && mk.numProperties > 0) {
                w(ind(level) + "   MASCARAS (" + mk.numProperties + "):");
                for (var mi = 1; mi <= mk.numProperties; mi++) {
                    var mm = mk.property(mi);
                    var linea = ind(level + 2) + "* " + mm.name;
                    try { linea += "   invertida=" + (mm.inverted ? "SI" : "no"); } catch (e) {}
                    try { linea += "   modo=" + mm.maskMode; } catch (e) {}
                    w(linea);
                    try {
                        var mf = mm.property("ADBE Mask Feather");
                        if (mf) { w(ind(level + 3) + "- Calado = " + val(mf.value)); }
                    } catch (e) {}
                    try {
                        var mo = mm.property("ADBE Mask Opacity");
                        if (mo) { w(ind(level + 3) + "- Opacidad = " + val(mo.value)); }
                    } catch (e) {}
                    try {
                        var mx = mm.property("ADBE Mask Offset");
                        if (mx) { w(ind(level + 3) + "- Expansión = " + val(mx.value)); }
                    } catch (e) {}
                    try {
                        var ms = mm.property("ADBE Mask Shape").value;
                        var vs = ms.vertices;
                        w(ind(level + 3) + "- Vértices (" + vs.length + "):");
                        for (var vi = 0; vi < vs.length && vi < 12; vi++) {
                            w(ind(level + 4) + val(vs[vi]));
                        }
                    } catch (e) {}
                }
            }
        } catch (e) {}

        // capa de ajuste
        try {
            if (L.adjustmentLayer) { w(ind(level) + "   >>> ES CAPA DE AJUSTE <<<"); }
        } catch (e) {}
    }

    function dumpComp(c, level) {
        w("");
        w(r(70, "="));
        w("COMP: " + c.name);
        w(r(70, "="));
        w("  " + c.width + "x" + c.height + "   " + num(c.frameRate) + " fps   dur=" + num(c.duration) + "s   capas=" + c.numLayers);
        try {
            if (c.renderer) { w("  renderer: " + c.renderer); }
        } catch (e) {}
        try {
            if (c.markerProperty && c.markerProperty.numKeys > 0) {
                w("  MARCADORES: " + c.markerProperty.numKeys);
                for (var m = 1; m <= c.markerProperty.numKeys; m++) {
                    w("    t=" + num(c.markerProperty.keyTime(m)) + "s  " + c.markerProperty.keyValue(m).comment);
                }
            }
        } catch (e) {}

        for (var i = 1; i <= c.numLayers; i++) {
            try { dumpCapa(c.layer(i), level + 1); } catch (e) {}
        }
    }

    // ---------------- MAIN ----------------

    if (!app.project) {
        alert("No hay ningun proyecto abierto.");
        return;
    }

    var comps = [];
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof CompItem) { comps.push(it); }
    }

    if (comps.length === 0) {
        alert("El proyecto no tiene composiciones.");
        return;
    }

    w("REPORTE DE PROYECTO - After Effects");
    w("Proyecto: " + (app.project.file ? app.project.file.name : "(sin guardar)"));
    w("Version AE: " + app.version);
    w("Composiciones: " + comps.length);
    w("");

    for (var j = 0; j < comps.length; j++) {
        dumpComp(comps[j], 0);
    }

    var texto = out.join("\n");

    var f = new File(Folder.desktop.fsName + "/REPORTE_AE.txt");
    f.encoding = "UTF-8";
    if (f.open("w")) {
        f.write(texto);
        f.close();
        alert("Listo.\n\nSe guardo en el Escritorio:\nREPORTE_AE.txt\n\n" +
              comps.length + " composiciones analizadas.\n" +
              out.length + " lineas.\n\nNo se modifico nada del proyecto.");
    } else {
        alert("No se pudo escribir el archivo en el Escritorio.");
    }

})();
