// Configuración de Colores
const COLORS = {
  H: "#34C759",
  S: "#FF3B30",
  D: "#30B0C7",
  SP: "#FFCC00"
};

const DEALER_CARDS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];

// Uso de Map para garantizar el orden de inserción vertical
const HARD = new Map([
  ["17–21", Array(10).fill("S")],
  ["16",    [...Array(5).fill("S"), "H", "H", "Uh", "Uh", "Uh"]],
  ["15",    [...Array(5).fill("S"), "H", "H", "H", "Uh", "Uh"]],
  ["14",    [...Array(5).fill("S"), ...Array(5).fill("H")]],
  ["13",    [...Array(5).fill("S"), ...Array(5).fill("H")]],
  ["12",    ["H", "H", "S", "S", "S", "H", "H", "H", "H", "H"]],
  ["11",    Array(10).fill("Dh")],
  ["10",    [...Array(8).fill("Dh"), "H", "H"]],
  ["9",     ["H", "Dh", "Dh", "Dh", "Dh", "H", "H", "H", "H", "H"]],
  ["8",     Array(10).fill("H")],
  ["5–7",   Array(10).fill("H")]
]);

const SOFT = {
  "A,9": Array(10).fill("S"),
  "A,8": ["S", "S", "S", "S", "Ds", "S", "S", "S", "S", "S"],
  "A,7": ["Ds", "Ds", "Ds", "Ds", "Ds", "S", "S", "H", "H", "H"],
  "A,6": ["H", "Dh", "Dh", "Dh", "Dh", "H", "H", "H", "H", "H"],
  "A,4–A,5": ["H", "H", "Dh", "Dh", "Dh", "H", "H", "H", "H", "H"],
  "A,2–A,3": ["H", "H", "H", "Dh", "Dh", "H", "H", "H", "H", "H"],
  "A,A*": ["H", "H", "H", "H", "Dh", "H", "H", "H", "H", "H"]
};

const PAIRS = {
  "A,A": Array(10).fill("SP"),
  "10,10": Array(10).fill("S"),
  "9,9": ["SP", "SP", "SP", "SP", "SP", "S", "SP", "SP", "S", "S"],
  "8,8": [...Array(9).fill("SP"), "Usp"],
  "7,7": [...Array(7).fill("SP"), "H", "H", "H"],
  "6,6": [...Array(5).fill("SP"), ...Array(5).fill("H")],
  "5,5": [...Array(7).fill("Dh"), "H", "H", "H"],
  "4,4": ["H", "H", "H", "SP", "SP", "H", "H", "H", "H", "H"],
  "2,2–3,3": [...Array(7).fill("SP"), "H", "H", "H"]
};

// Estado global
let currentAction = 'H';
let isMouseDown = false;
const cellStore = [];

function getActionColor(action) {
  if (["H", "Uh", "Usp"].includes(action)) return COLORS.H;
  if (["S", "Us"].includes(action)) return COLORS.S;
  if (["Dh", "Ds"].includes(action)) return COLORS.D;
  if (action === "SP") return COLORS.SP;
  return "#FFFFFF";
}

// Construcción de Tablas
function buildTable(containerId, strategyData) {
  const container = document.getElementById(containerId);
  const table = document.createElement("div");
  table.className = "strategy-table";

  // Esquina superior izquierda
  table.appendChild(createCell("Mano", "header"));

  // Encabezados Dealer
  DEALER_CARDS.forEach(card => {
    table.appendChild(createCell(card, "header"));
  });

  // Iteración compatible con Map y Objeto
  const entries = strategyData instanceof Map 
    ? strategyData.entries() 
    : Object.entries(strategyData);

  // Filas
  for (const [hand, actions] of entries) {
    table.appendChild(createCell(hand, "header"));

    actions.forEach(expectedAction => {
      const cell = createCell("", "playable");
      cellStore.push({ element: cell, expected: expectedAction, userColor: null });

      // Eventos Drag to Paint
      cell.addEventListener("mousedown", () => {
        isMouseDown = true;
        paintCell(cell);
      });

      cell.addEventListener("mouseenter", () => {
        if (isMouseDown) paintCell(cell);
      });

      table.appendChild(cell);
    });
  }

  container.appendChild(table);
}

function createCell(text, className) {
  const div = document.createElement("div");
  div.className = `cell ${className}`;
  div.textContent = text;
  return div;
}

function paintCell(cellElement) {
  const record = cellStore.find(item => item.element === cellElement);
  if (record) {
    record.userColor = COLORS[currentAction];
    cellElement.style.backgroundColor = record.userColor;
    resetStatus();
  }
}

// Control global del mouse
document.addEventListener("mouseup", () => { isMouseDown = false; });

// Botones de paleta
document.querySelectorAll(".palette-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".palette-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentAction = btn.dataset.action;
  });
});

// Navegación entre pestañas
document.querySelectorAll(".tab-btn").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});

// Revisión de respuestas
document.getElementById("check-btn").addEventListener("click", () => {
  let correct = 0;
  let errors = 0;

  cellStore.forEach(item => {
    const expectedColor = getActionColor(item.expected);
    if (item.userColor === expectedColor) {
      correct++;
    } else {
      errors++;
      item.element.style.backgroundColor = "#94A3B8"; // Gris de error
    }
  });

  const total = cellStore.length;
  const percentage = ((correct / total) * 100).toFixed(1);
  const statusLbl = document.getElementById("result-status");
  
  statusLbl.textContent = `${percentage}%`;
  statusLbl.style.color = percentage == 100 ? COLORS.H : percentage >= 70 ? "#D97706" : COLORS.S;

  document.getElementById("score-details").textContent = 
    `Correctas: ${correct}\nIncorrectas: ${errors}\nTotal: ${total}`;
});

// Limpieza de tablas
document.getElementById("clear-btn").addEventListener("click", () => {
  cellStore.forEach(item => {
    item.userColor = null;
    item.element.style.backgroundColor = "#FFFFFF";
  });
  resetStatus();
});

function resetStatus() {
  document.getElementById("result-status").textContent = "SIN REVISAR";
  document.getElementById("result-status").style.color = "#64748B";
  document.getElementById("score-details").textContent = "Completa las casillas y presiona revisar";
}

// Inicializar tablas
buildTable("tab-hard", HARD);
buildTable("tab-soft", SOFT);
buildTable("tab-pairs", PAIRS);
