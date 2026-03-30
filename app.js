const API = "https://pocord-production.up.railway.app/";

// -------------------
// UPLOAD AUDIO
// -------------------
async function upload() {
  const file = document.getElementById("fileInput").files[0];

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API}/upload`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  alert("Meeting ID: " + data.id);

  loadMeetings();
}

// -------------------
// LOAD MEETINGS
// -------------------
async function loadMeetings() {
  const res = await fetch(`${API}/search?query=`);
  const meetings = await res.json();

  const container = document.getElementById("meetings");
  container.innerHTML = "";

  meetings.forEach(m => {
    const div = document.createElement("div");

    div.innerHTML = `
      <b>${m.summary || "Sin resumen"}</b>
      <button onclick="openMeeting('${m.id}')">Ver</button>
    `;

    container.appendChild(div);
  });
}

// -------------------
// OPEN MEETING
// -------------------
async function openMeeting(id) {
  const res = await fetch(`${API}/meeting/${id}`);
  const m = await res.json();

  alert(
    "Resumen:\n" + m.summary +
    "\n\nTareas:\n" +
    m.tasks.map(t => "- " + t.task).join("\n")
  );
}

// -------------------
// LOAD TASKS
// -------------------
async function loadTasks() {
  const res = await fetch(`${API}/tasks`);
  const tasks = await res.json();

  const container = document.getElementById("tasks");
  container.innerHTML = "";

  tasks.forEach(t => {
    const div = document.createElement("div");

    div.innerHTML = `
      ${t.task} (${t.owner})
    `;

    container.appendChild(div);
  });
}

// INIT
loadMeetings();
loadTasks();