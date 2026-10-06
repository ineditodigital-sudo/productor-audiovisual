/*
  exportar-ame.jsx — manda comps a Adobe Media Encoder con la plantilla H.264 de 15 Mbps (sin tocar la vista de AE).

  Uso por ae-bridge (ae_ejecutar):
    $.global.EXPORTAR = [
      { comp: "MARCA | REEL 1 9x16", archivo: "C:/ruta/clientes/MARCA/06_exports/MARCA_slug_9x16_v1.mp4" }
    ];
    $.evalFile(new File("<raíz>/_sistema/herramientas/exportar-ame.jsx"));

  Notas aprendidas:
  - El nombre de la plantilla viene traducido y con caracteres raros (acentos/NBSP): no se puede pasar por nombre.
    Se busca por fragmentos: contiene "264" y "15" (en español: "H.264: Ajustes de procesamiento de coincidencia, 15 Mbps").
    Cambia PISTAS si tu AE está en otro idioma o quieres otra plantilla.
  - Media Encoder NO sobrescribe: si el archivo existe escribe "<nombre>_1.mp4". Borra o renombra antes.
  - Después normaliza el audio a -14 LUFS con normalizar-audio.sh (Media Encoder no lo hace).
*/
(function EXPORTAR_AME() {
    var PISTAS = ["264", "15"];
    var lista = $.global.EXPORTAR || [];
    var rq = app.project.renderQueue, log = [];
    function compPorNombre(n) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var it = app.project.item(i);
            if (it instanceof CompItem && it.name == n) return it;
        }
        return null;
    }
    // desmarcar lo que ya hubiera en la cola de AE para no mandarlo también a Media Encoder
    for (var q = 1; q <= rq.numItems; q++) { try { if (rq.item(q).status == RQItemStatus.QUEUED) rq.item(q).render = false; } catch (e) {} }

    for (var k = 0; k < lista.length; k++) {
        var c = compPorNombre(lista[k].comp);
        if (!c) { log.push("NO EXISTE: " + lista[k].comp); continue; }
        var item = rq.items.add(c), om = item.outputModule(1), tpl = null;
        for (var t = 0; t < om.templates.length; t++) {
            var ok = true;
            for (var p = 0; p < PISTAS.length; p++) if (om.templates[t].indexOf(PISTAS[p]) < 0) ok = false;
            if (ok) { tpl = om.templates[t]; break; }
        }
        if (tpl) om.applyTemplate(tpl); else log.push("Sin plantilla con " + PISTAS.join("+") + "; se usa la de por defecto");
        om.file = new File(lista[k].archivo);
        log.push("OK " + c.name + " -> " + lista[k].archivo + (tpl ? " [" + tpl + "]" : ""));
    }
    if (rq.numItems > 0) rq.queueInAME(true); // true = arrancar la cola en Media Encoder
    $.global.EXPORTAR_LOG = log.join("\n");
    return $.global.EXPORTAR_LOG;
})();
