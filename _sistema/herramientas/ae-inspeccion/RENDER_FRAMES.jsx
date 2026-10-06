// ============================================================
//  RENDER DE FOTOGRAMAS — exporta PNGs de la comp activa
//  SOLO LEE. No modifica ni rearma nada.
// ============================================================

(function () {

    var CANTIDAD = 9;

    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) {
        alert("Abrí y seleccioná la composición que querés exportar,\ny volvé a correr el script.");
        return;
    }
    if (typeof comp.saveFrameToPng !== "function") {
        alert("Esta versión de After no soporta saveFrameToPng.");
        return;
    }

    var destino = new Folder(Folder.desktop.fsName + "/FRAMES_AE");
    if (!destino.exists) { destino.create(); }
    var viejos = destino.getFiles("*.png");
    for (var v = 0; v < viejos.length; v++) { viejos[v].remove(); }

    var dur = comp.duration, hechos = 0;
    for (var i = 0; i < CANTIDAD; i++) {
        var t = (dur - 0.1) * (i / (CANTIDAD - 1));
        var et = String(Math.round(t * 100) / 100);
        var f = new File(destino.fsName + "/f0" + i + "_t" + et + "s.png");
        try { comp.saveFrameToPng(t, f); hechos++; }
        catch (e) { alert("Error en t=" + et + "s\n\n" + e.toString()); return; }
    }

    alert("Listo.\n\n" + hechos + " fotogramas de \"" + comp.name + "\"\nen Escritorio/FRAMES_AE");

})();
