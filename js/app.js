/**
 * Planificador Semanal – lógica principal
 *  - Carga datos JSON
 *  - Gestiona filas, selects, competencias y copia a Docs
 *  - Permite redimensionar columnas arrastrando la cabecera
 */

document.addEventListener("DOMContentLoaded", () => {
  /* ---------------- Variable global con la información -------- */
  let planData = {};

  /* ---------------- Referencias DOM --------------------------- */
  const btnAddActivity = document.getElementById("btn-add-activity");
  const btnCopyDocs   = document.getElementById("btn-copy-docs");
  const tableBody     = document.getElementById("cuerpo-tabla");
  const table         = document.getElementById("tabla-planificacion");

  /* ---------------- Carga de JSON ----------------------------- */
  async function loadData() {
    const subjects = {
      "Biología":                    "Biología.json",
      "Física y Química":            "Fisica Química.json",
      "Formación para la Ciudadanía":"Formación para la ciudadanía.json",
      "Geografía":                   "Geografía.json",
      "Geología y Astronomía":       "Geología Astronomía.json",
      "Historia":                    "Historia.json",
      "Lengua Española":             "Lengua española.json",
      "Matemática":                  "Matemática.json"
    };

    const data = {};
    for (const key in subjects) {
      try {
        const res = await fetch(`js/data/${subjects[key]}`);
        if (!res.ok) throw new Error(`Error al cargar ${subjects[key]}`);
        const json  = await res.json();
        const espacioKey = Object.keys(json)[0];
        const unidadKey  = Object.keys(json[espacioKey])[0];
        data[key] = json[espacioKey][unidadKey];
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  }

  /* ---------------- Utilidades de tabla ----------------------- */
  function updateActivityNumbers() {
    tableBody.querySelectorAll(".activity-row").forEach((row, i) => {
      row.cells[0].textContent = i + 1;
    });
  }

  function subjectOptionsHTML() {
    return (
      `<option value="">Seleccione...</option>` +
      Object.keys(planData)
        .map((s) => `<option value="${s}">${s}</option>`)
        .join("")
    );
  }

  function createActivityRow() {
    const tr = document.createElement("tr");
    tr.classList.add("activity-row");
    tr.innerHTML = `
      <td></td>
      <td><select class="select-unidad">${subjectOptionsHTML()}</select></td>
      <td><select class="select-contenido" disabled><option>Seleccione Unidad</option></select></td>
      <td><select class="select-criterio"  disabled><option>Seleccione Unidad</option></select></td>
      <td class="competencia-cell">---</td>
      <td><textarea placeholder="Meta específica..."></textarea></td>
      <td><textarea placeholder="Descripción, recursos..."></textarea></td>
      <td class="row-actions-cell">
        <div class="row-actions">
          <button class="btn-row-add"    title="Añadir fila abajo"><i class="fa-solid fa-plus"></i></button>
          <button class="btn-row-delete" title="Eliminar fila"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    `;
    return tr;
  }

  function populateDropdowns(row, subject) {
    const data = planData[subject];
    const selContenido = row.querySelector(".select-contenido");
    const selCriterio  = row.querySelector(".select-criterio");

    if (!data) {
      selContenido.disabled = selCriterio.disabled = true;
      selContenido.innerHTML = selCriterio.innerHTML =
        "<option>Error</option>";
      return;
    }

    selContenido.innerHTML =
      `<option value="">Seleccione Contenido...</option>` +
      data.contenidos.map((c) => `<option value="${c}">${c}</option>`).join("");
    selContenido.disabled = false;

    let criterioOpts = `<option value="">Seleccione Criterio...</option>`;
    Object.entries(data.criterios_de_logro).forEach(([ce, array]) => {
      array.forEach((crit) => {
        criterioOpts += `<option value="${crit}" data-ce-code="${ce}">${crit}</option>`;
      });
    });
    selCriterio.innerHTML = criterioOpts;
    selCriterio.disabled  = false;
  }

  function updateCompetencia(row, subject, option) {
    const cell = row.querySelector(".competencia-cell");
    if (!option || !option.dataset.ceCode) {
      cell.textContent = "---";
      cell.title = "Seleccione un criterio para ver la competencia";
      return;
    }

    const ceCode = option.dataset.ceCode;
    const comp   = planData[subject].competencias.find(
      (c) => c.codigo === ceCode
    );

    if (comp) {
      /* mostramos código + descriptor */
      cell.textContent = `${comp.codigo}\n${comp.descriptor}`;
      cell.title       = comp.descriptor;
    } else {
      cell.textContent = "Error";
      cell.title       = "Competencia no encontrada";
    }
  }

  /* ---------------- Copiar tabla a portapapeles -------------- */
  function copyTableToClipboard() {
    const header = `
      <thead>
        <tr>
          <th>Actividad Nº</th><th>Unidad Curricular</th><th>Contenido</th>
          <th>Criterio de Logro</th><th>Competencia Específica</th>
          <th>Meta de Aprendizaje</th><th>Desarrollo</th>
        </tr>
      </thead>`;

    let body = "<tbody>";
    tableBody.querySelectorAll(".activity-row").forEach((r) => {
      body += `
        <tr>
          <td>${r.cells[0].textContent}</td>
          <td>${r.querySelector(".select-unidad").value}</td>
          <td>${r.querySelector(".select-contenido").value}</td>
          <td>${r.querySelector(".select-criterio").value}</td>
          <td>${r.querySelector(".competencia-cell").textContent}</td>
          <td>${r.querySelector('textarea[placeholder*="Meta"]').value.replace(/\n/g,"<br>")}</td>
          <td>${r.querySelector('textarea[placeholder*="Descripción"]').value.replace(/\n/g,"<br>")}</td>
        </tr>`;
    });
    body += "</tbody>";

    const html = `<meta charset="UTF-8">
      <style>table{border-collapse:collapse;width:100%;font-family:sans-serif}
      th,td{border:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}
      thead th{background:#f2f2f2}</style><table>${header}${body}</table>`;

    navigator.clipboard
      .write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" })
        })
      ])
      .then(
        () => showToast("¡Tabla copiada!"),
        () => showToast("Error al copiar la tabla", "error")
      );
  }

  /* ---------------- Toast pequeño --------------------------- */
  function showToast(msg, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: type === "error" ? "#dc3545" : "#28a745",
      color: "#fff",
      padding: "10px 18px",
      borderRadius: "4px",
      opacity: "0",
      transition: "opacity 0.3s"
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => (toast.style.opacity = "1"));
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  }

  /* ---------------- Columnas redimensionables --------------- */
  function makeResizableColumns(tbl) {
    const ths = tbl.querySelectorAll("thead th");

    /* Aseguramos que exista un <colgroup> con la misma cantidad de <col> */
    let colgroup = tbl.querySelector("colgroup");
    if (!colgroup) {
      colgroup = document.createElement("colgroup");
      tbl.insertBefore(colgroup, tbl.firstChild);
    }

    // completamos o creamos los <col> que falten
    while (colgroup.children.length < ths.length) {
      colgroup.appendChild(document.createElement("col"));
    }

    const cols = colgroup.querySelectorAll("col");

    ths.forEach((th, i) => {
      if (i === ths.length - 1) return; // última no se redimensiona

      const grip = document.createElement("div");
      grip.className = "col-grip";
      th.style.position = "relative";
      th.appendChild(grip);

      grip.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const startX = e.pageX;
        const startW = th.offsetWidth;

        function onMove(ev) {
          const diff = ev.pageX - startX;
          const newW = Math.max(60, startW + diff);
          th.style.width = newW + "px";
          if (cols[i]) cols[i].style.width = newW + "px";
        }
        function onUp() {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        }
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });
    });
  }

  /* ---------------- Eventos de la tabla --------------------- */
  btnAddActivity.addEventListener("click", () => {
    tableBody.appendChild(createActivityRow());
    updateActivityNumbers();
  });

  btnCopyDocs.addEventListener("click", copyTableToClipboard);

  tableBody.addEventListener("click", (e) => {
    const row = e.target.closest(".activity-row");
    if (!row) return;

    if (e.target.closest(".btn-row-delete")) {
      row.remove();
      updateActivityNumbers();
    } else if (e.target.closest(".btn-row-add")) {
      row.after(createActivityRow());
      updateActivityNumbers();
    }
  });

  tableBody.addEventListener("change", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;

    if (e.target.classList.contains("select-unidad")) {
      const subject = e.target.value;
      if (subject) populateDropdowns(row, subject);
    } else if (e.target.classList.contains("select-criterio")) {
      const subject = row.querySelector(".select-unidad").value;
      const option  = e.target.options[e.target.selectedIndex];
      if (subject) updateCompetencia(row, subject, option);
    }
  });

  /* ---------------- Inicialización -------------------------- */
  async function init() {
    btnAddActivity.disabled = true;
    btnAddActivity.textContent = "Cargando...";

    planData = await loadData();

    btnAddActivity.disabled = false;
    btnAddActivity.textContent = "➕ Añadir Actividad";

    if (tableBody.rows.length === 0) {
      tableBody.appendChild(createActivityRow());
    }

    makeResizableColumns(table);
  }

  init();
});
