const API = "https://pocord-production.up.railway.app";
let currentMeeting = null;
function showStatus(message, type = "info") {
  const banner = document.getElementById("statusBanner");
  banner.classList.remove("hidden");
  banner.textContent = message;

  if (type === "error") {
    banner.style.borderColor = "#d64545";
  } else if (type === "success") {
    banner.style.borderColor = "#1f9d55";
  } else {
    banner.style.borderColor = "#2a3040";
  }
}

function hideStatus() {
  const banner = document.getElementById("statusBanner");
  banner.classList.add("hidden");
}

async function upload() {
document.getElementById("selectedFileName").textContent = "Ningún archivo seleccionado";
  const input = document.getElementById("fileInput");
  const file = input.files[0];

  if (!file) {
    showStatus("Selecciona un archivo antes de subirlo.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    showStatus("Subiendo y procesando audio...", "info");

    const res = await fetch(`${API}/upload`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || "No se pudo subir el audio");
    }

    showStatus(`Reunión creada correctamente. ID: ${data.id}`, "success");
    input.value = "";

    await loadMeetings();
    await loadTasks();
    await openMeeting(data.id);
  } catch (err) {
    console.error(err);
    showStatus(`Error: ${err.message}`, "error");
  }
}

async function loadMeetings() {
  const container = document.getElementById("meetings");
  container.innerHTML = `<div class="empty-state">Cargando reuniones...</div>`;

  try {
    const res = await fetch(`${API}/search?query=`);
    const meetings = await res.json();

    container.innerHTML = "";

    if (!meetings.length) {
      container.innerHTML = `<div class="empty-state">Todavía no hay reuniones.</div>`;
      return;
    }

    meetings.forEach((m) => {
      const div = document.createElement("div");
      div.className = "meeting-item";
      div.onclick = () => openMeeting(m.id);

      div.innerHTML = `
        <div class="item-title">${escapeHtml(m.summary || "Sin resumen")}</div>
        <div class="item-subtitle">ID: ${m.id}</div>
        <div class="badge">Ver detalle</div>
      `;

      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="empty-state">No se pudieron cargar las reuniones.</div>`;
  }
}

async function openMeeting(id) {
  const container = document.getElementById("meetingDetail");
  container.innerHTML = `<div class="empty-state">Cargando detalle...</div>`;

  try {
    const res = await fetch(`${API}/meeting/${id}`);
    const meeting = await res.json();

    if (!res.ok || meeting.error) {
      throw new Error(meeting.error || "No se pudo cargar la reunión");
    }

    currentMeeting = meeting;
    const topics = (meeting.topics || [])
      .map((topic) => `<li>${escapeHtml(topic)}</li>`)
      .join("");

    const tasks = (meeting.tasks || [])
      .map(
        (task) => `
          <li>
            <strong>${escapeHtml(task.task || "")}</strong>
            — ${escapeHtml(task.owner || "sin asignar")}
            ${task.priority ? `(${escapeHtml(task.priority)})` : ""}
          </li>
        `
      )
      .join("");

    container.innerHTML = `
      <div class="detail-section">
        <h3>Resumen</h3>
        <p>${escapeHtml(meeting.summary || "Sin resumen disponible.")}</p>
      </div>

      <div class="detail-section">
        <h3>Temas</h3>
        ${
          meeting.topics && meeting.topics.length
            ? `<ul class="topic-list">${topics}</ul>`
            : `<p class="empty-state">No hay temas detectados.</p>`
        }
      </div>

      <div class="detail-section">
        <h3>Tareas</h3>
        ${
          meeting.tasks && meeting.tasks.length
            ? `<ul class="task-list">${tasks}</ul>`
            : `<p class="empty-state">No hay tareas detectadas.</p>`
        }
      </div>

      <div class="detail-section">
        <h3>Transcript</h3>
        <div class="transcript-box">${escapeHtml(meeting.transcript || "Sin transcript todavía.")}</div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="empty-state">No se pudo cargar el detalle.</div>`;
  }
}

async function loadTasks() {
  const container = document.getElementById("tasks");
  container.innerHTML = `<div class="empty-state">Cargando tareas...</div>`;

  try {
    const res = await fetch(`${API}/tasks`);
    const tasks = await res.json();

    container.innerHTML = "";

    if (!tasks.length) {
      container.innerHTML = `<div class="empty-state">No hay tareas todavía.</div>`;
      return;
    }

    tasks.forEach((t) => {
      const div = document.createElement("div");
      div.className = "task-item";

      div.innerHTML = `
        <div class="item-title">${escapeHtml(t.task || "Tarea sin nombre")}</div>
        <div class="item-subtitle">
          Responsable: ${escapeHtml(t.owner || "sin asignar")}
        </div>
        <div class="badge">${escapeHtml(t.priority || "sin prioridad")}</div>
      `;

      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="empty-state">No se pudieron cargar las tareas.</div>`;
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadMeetings();
loadTasks();

function triggerFileSelect() {
  document.getElementById("fileInput").click();
}

function handleFileChange() {
  const input = document.getElementById("fileInput");
  const label = document.getElementById("selectedFileName");

  if (input.files && input.files.length > 0) {
    label.textContent = input.files[0].name;
  } else {
    label.textContent = "Ningún archivo seleccionado";
  }
}

async function copyMeetingDetail() {
  if (!currentMeeting) {
    showStatus("Primero selecciona una reunión.", "error");
    return;
  }

  const summary = currentMeeting.summary || "Sin resumen";
  const topics = (currentMeeting.topics || []).length
    ? currentMeeting.topics.map((t) => `- ${t}`).join("\n")
    : "- Sin temas";

  const tasks = (currentMeeting.tasks || []).length
    ? currentMeeting.tasks
        .map((t) => {
          const owner = t.owner || "sin asignar";
          const priority = t.priority ? ` [${t.priority}]` : "";
          return `- ${t.task} — ${owner}${priority}`;
        })
        .join("\n")
    : "- Sin tareas";

  const transcript = currentMeeting.transcript || "Sin transcript";

  const text = `RESUMEN
${summary}

TEMAS
${topics}

TAREAS
${tasks}

TRANSCRIPT
${transcript}`;

  try {
    await navigator.clipboard.writeText(text);
    showStatus("Detalle copiado al portapapeles.", "success");
  } catch (err) {
    console.error(err);
    showStatus("No se pudo copiar el detalle.", "error");
  }
}