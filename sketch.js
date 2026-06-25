// === ПЕРЕМЕННЫЕ ===
let managers = [];
let currentManager = null;
let showAddForm = false;
let newTaskType = 'weekly';
let newTaskAssignee = null;
let activeView = 'personal';
let calendarManager = null;
let notifications = [];
let showNotifications = false;
let hoveredTask = null;
let hoveredTaskX = 0;
let hoveredTaskY = 0;

// === ЦВЕТА ===
let colors = {
  bg: '#f5f6fa', card: '#ffffff', weekly: '#6c5ce7', monthly: '#e17055',
  onetime: '#00b894', done: '#b2bec3', completed: '#636e72', text: '#2d3436',
  danger: '#d63031', warning: '#fdcb6e', ok: '#00b894', accent: '#0984e3',
  lightWeekly: '#a29bfe', lightMonthly: '#fab1a0', lightOnetime: '#55efc4', boss: '#e17055'
};

// === ЗАПУСК ===
function setup() {
  let canvas = createCanvas(1200, 850);
  canvas.parent('app-container');
  textFont('Arial');
  
  loadData();
  
  currentManager = managers[0];
  calendarManager = managers[0];
  newTaskAssignee = currentManager;
  updateAssigneeButtons();
  checkNotifications();
}

function draw() {
  background(colors.bg);
  hoveredTask = null;
  
  drawHeader();
  drawViewToggle();
  drawNotificationBell();
  
  if (showNotifications) drawNotificationsPanel();
  
  if (activeView === 'personal') drawPersonalView();
  else if (activeView === 'team') drawTeamDashboard();
  else if (activeView === 'calendar') drawCalendarView();
  
  updateTooltip();
}

// === ТУЛТИП ===
function updateTooltip() {
  let t = document.getElementById('description-tooltip');
  if (hoveredTask && hoveredTask.description) {
    t.style.display = 'block';
    t.style.left = (hoveredTaskX + 15) + 'px';
    t.style.top = (hoveredTaskY - 10) + 'px';
    t.textContent = hoveredTask.description;
  } else {
    t.style.display = 'none';
  }
}

// === ШАПКА ===
function drawHeader() {
  fill(colors.text); textSize(28); textStyle(BOLD); text('📋 Таск Менеджер', 30, 45);
  textSize(14); textStyle(NORMAL); fill('#636e72');
  text('Рабочая неделя: 40 часов | Рабочий месяц: 160 часов', 30, 70);
}

function drawNotificationBell() {
  let x = 1100, y = 30;
  fill(notifications.length > 0 ? colors.danger : '#636e72');
  textSize(28); text('🔔', x, y);
  if (notifications.length > 0) {
    fill(colors.danger); circle(x + 22, y - 8, 22);
    fill('#fff'); textSize(12); textStyle(BOLD); textAlign(CENTER);
    text(notifications.length, x + 22, y - 3); textAlign(LEFT); textStyle(NORMAL);
  }
}

function drawNotificationsPanel() {
  let x = 900, y = 65, w = 280, h = 250;
  fill(0,0,0,10); noStroke(); rect(x+3, y+3, w, h, 8);
  fill(colors.card); stroke('#e0e0e0'); rect(x, y, w, h, 8);
  fill(colors.text); textSize(16); textStyle(BOLD); text('🔔 Уведомления', x+15, y+28); textStyle(NORMAL);
  if (notifications.length === 0) {
    fill('#636e72'); textSize(13); text('Нет уведомлений', x+15, y+60);
  } else {
    for (let i = 0; i < min(notifications.length, 8); i++) {
      let ny = y + 50 + i * 23;
      fill(notifications[i].type === 'overdue' ? colors.danger : colors.warning);
      textSize(12); text(notifications[i].message, x+15, ny+10);
    }
    fill('#dfe6e9'); rect(x+15, y+h-40, 250, 28, 6);
    fill(colors.text); textSize(12); textAlign(CENTER); text('Очистить', x+140, y+h-22); textAlign(LEFT);
  }
}

// === ВКЛАДКИ ===
function drawViewToggle() {
  let views = [
    { id: 'personal', label: '👤 Мои задачи' },
    { id: 'team', label: '👥 Дашборд' },
    { id: 'calendar', label: '📅 Календарь' }
  ];
  for (let i = 0; i < views.length; i++) {
    let bx = 30 + i * 150;
    fill(activeView === views[i].id ? colors.accent : '#dfe6e9');
    noStroke(); rect(bx, 95, 140, 34, 8);
    fill(activeView === views[i].id ? '#fff' : colors.text);
    textSize(14); textAlign(CENTER); text(views[i].label, bx+70, 117); textAlign(LEFT);
  }
  fill(colors.ok); noStroke(); rect(500, 95, 140, 34, 8);
  fill('#fff'); textSize(14); textAlign(CENTER); text('📥 Экспорт XLS', 570, 117); textAlign(LEFT);
}

// === ЛИЧНЫЙ ВИД ===
function drawPersonalView() {
  drawManagerSelector();
  if (currentManager) {
    drawTaskBlock('Еженедельные', currentManager.getWeeklyTasks(), 30, 180, colors.weekly);
    drawTaskBlock('Ежемесячные', currentManager.getMonthlyTasks(), 380, 180, colors.monthly);
    drawTaskBlock('Разовые', currentManager.getOnetimeTasks(), 730, 180, colors.onetime);
    drawCompletedBlock(currentManager.getCompletedTasks(), 30, 420);
    drawStats();
  }
  drawAddButton();
}

function drawManagerSelector() {
  fill('#636e72'); textSize(14); text('Сотрудник:', 30, 155);
  for (let i = 0; i < managers.length; i++) {
    let bx = 130 + i * 200, bw = 185, isActive = (managers[i] === currentManager);
    fill(isActive ? colors.weekly : '#dfe6e9'); noStroke(); rect(bx, 140, bw, 30, 6);
    fill(isActive ? '#fff' : colors.text); textSize(11); textAlign(CENTER);
    text(managers[i].name.split('(')[0].trim(), bx+bw/2, 160); textAlign(LEFT);
  }
}

function drawTaskBlock(title, tasks, x, y, color) {
  fill(color); noStroke(); rect(x, y, 340, 36, 8);
  fill('#fff'); textSize(15); textStyle(BOLD); text(title, x+15, y+24); textStyle(NORMAL);
  let active = tasks.filter(t => t.status !== 'done');
  fill(colors.card); stroke('#e0e0e0'); rect(x, y+36, 340, 190, 0,0,8,8);
  if (active.length === 0) { fill('#b2bec3'); textSize(13); text('Нет задач', x+15, y+65); return; }
  for (let i = 0; i < min(active.length, 5); i++) {
    let t = active[i], ty = y + 50 + i * 36;
    if (mouseX > x+38 && mouseX < x+300 && mouseY > ty && mouseY < ty+30 && t.description) {
      hoveredTask = t; hoveredTaskX = mouseX; hoveredTaskY = mouseY;
    }
    fill('#fff'); stroke('#b2bec3'); strokeWeight(2); rect(x+12, ty+2, 18, 18, 4);
    noStroke(); fill(colors.text); textSize(12); text(t.title, x+38, ty+12);
    fill('#636e72'); textSize(10);
    let an = t.assignee ? t.assignee.name.split('(')[0].trim() : '-';
    text(t.hours + 'ч | ' + t.deadline + ' | ' + an, x+38, ty+28);
    if (t.description) { fill('#74b9ff'); noStroke(); circle(x+325, ty+8, 10); }
    fill('#e74c3c'); noStroke(); rect(x+308, ty+2, 22, 22, 4);
    fill('#fff'); textSize(14); textAlign(CENTER); text('×', x+319, ty+19); textAlign(LEFT);
  }
}

function drawCompletedBlock(tasks, x, y) {
  fill(colors.completed); noStroke(); rect(x, y, 1040, 36, 8);
  fill('#fff'); textSize(15); textStyle(BOLD); text('✅ Завершённые', x+15, y+24); textStyle(NORMAL);
  fill(colors.card); stroke('#e0e0e0'); rect(x, y+36, 1040, 145, 0,0,8,8);
  if (tasks.length === 0) { fill('#b2bec3'); textSize(13); text('Нет завершённых задач', x+15, y+65); return; }
  let sorted = tasks.slice().sort((a,b) => (b.completedDate||'').localeCompare(a.completedDate||''));
  for (let i = 0; i < min(sorted.length, 4); i++) {
    let t = sorted[i], ty = y + 48 + i * 32;
    if (mouseX > x+35 && mouseX < x+270 && mouseY > ty && mouseY < ty+24 && t.description) {
      hoveredTask = t; hoveredTaskX = mouseX; hoveredTaskY = mouseY;
    }
    fill(colors.ok); textSize(14); text('✓', x+15, ty+12);
    fill(colors.completed); textSize(12); textStyle(ITALIC); text(t.title, x+35, ty+12); textStyle(NORMAL);
    fill('#636e72'); textSize(9);
    text(t.hours + 'ч | Вып: ' + (t.completedDate||'?') + ' | ' + (t.assignee ? t.assignee.name.split('(')[0].trim() : ''), x+35, ty+26);
    fill('#dfe6e9'); noStroke(); rect(x+270, ty+2, 40, 22, 3);
    fill(colors.text); textSize(10); textAlign(CENTER); text('↩', x+290, ty+18); textAlign(LEFT);
    fill('#e74c3c'); rect(x+320, ty+2, 28, 22, 3);
    fill('#fff'); textSize(12); textAlign(CENTER); text('×', x+334, ty+18); textAlign(LEFT);
  }
}

function drawStats() {
  fill(colors.card); stroke('#e0e0e0'); rect(30, 610, 1040, 75, 8);
  fill(colors.text); textSize(16); textStyle(BOLD);
  text('📊 ' + currentManager.name.split('(')[0].trim(), 50, 638); textStyle(NORMAL);
  let wh = currentManager.getWeeklyHours(), mh = currentManager.getMonthlyHours();
  drawBar(50, 652, 300, 'Неделя', wh, 40, wh > 40 ? colors.danger : wh > 35 ? colors.warning : colors.ok);
  drawBar(400, 652, 300, 'Месяц', mh, 160, mh > 160 ? colors.danger : mh > 140 ? colors.warning : colors.ok);
  fill(colors.text); textSize(13);
  text('Разовые: ' + currentManager.getOnetimeHours() + 'ч | Свободно: ' + max(0,40-wh) + 'ч', 750, 665);
}

function drawBar(x, y, w, label, val, max, color) {
  fill('#636e72'); textSize(12); text(label + ': ' + val + '/' + max + 'ч', x, y-5);
  fill('#dfe6e9'); noStroke(); rect(x, y+8, w, 20, 10);
  fill(color); rect(x, y+8, w * min(val/max, 1.5), 20, 10);
}

function drawAddButton() {
  fill(showAddForm ? colors.danger : colors.weekly); noStroke(); rect(850, 705, 220, 44, 22);
  fill('#fff'); textSize(16); textAlign(CENTER); text(showAddForm ? '✕ Отмена' : '+ Новая задача', 960, 734); textAlign(LEFT);
}

// === ДАШБОРД ===
function drawTeamDashboard() {
  let x = 30, y = 150;
  fill(colors.text); textSize(20); textStyle(BOLD); text('📊 Сводка по команде', x, y); textStyle(NORMAL);
  y += 30;
  let cw = [250, 200, 120, 120, 120, 120, 120];
  fill(colors.accent); noStroke(); rect(x, y, 1050, 36, 8);
  fill('#fff'); textSize(12); textStyle(BOLD);
  let hx = x + 10;
  ['Сотрудник','Задачи','Занято нед','Своб нед','Занято мес','Своб мес','Загрузка'].forEach(h => {
    text(h, hx, y+23); hx += cw.shift();
  });
  textStyle(NORMAL);
  y += 40;
  for (let i = 0; i < managers.length; i++) {
    let m = managers[i], wh = m.getWeeklyHours(), mh = m.getMonthlyHours();
    let fw = max(0,40-wh), fm = max(0,160-mh), pct = (wh/40)*100;
    fill(i%2===0?'#fff':'#f8f9fa'); stroke('#e0e0e0'); rect(x, y, 1050, 50);
    noStroke(); fill(colors.text); textSize(14); textStyle(BOLD); text(m.name, x+10, y+22); textStyle(NORMAL);
    fill('#636e72'); textSize(11);
    text('Акт: ' + m.tasks.filter(t=>t.status!=='done').length + ' | Зав: ' + m.tasks.filter(t=>t.status==='done').length, x+10, y+40);
    textAlign(CENTER);
    fill(wh>40?colors.danger:colors.text); text(wh.toFixed(1)+'ч', x+450, y+30);
    fill(fw>0?colors.ok:'#636e72'); text(fw.toFixed(1)+'ч', x+570, y+30);
    fill(mh>160?colors.danger:colors.text); text(mh.toFixed(1)+'ч', x+690, y+30);
    fill(fm>0?colors.ok:'#636e72'); text(fm.toFixed(1)+'ч', x+810, y+30);
    textAlign(LEFT);
    fill('#dfe6e9'); rect(x+850, y+14, 200, 12, 6);
    let lc = pct>100?colors.danger:pct>80?colors.warning:colors.ok;
    fill(lc); rect(x+850, y+14, 200*min(pct/100,1.5), 12, 6);
    fill(colors.text); textSize(11); textAlign(CENTER); text(pct.toFixed(0)+'%', x+950, y+40); textAlign(LEFT);
    y += 54;
  }
}

// === КАЛЕНДАРЬ ===
function drawCalendarView() {
  let x = 30, y = 150;
  fill(colors.text); textSize(20); textStyle(BOLD); text('📅 Календарь', x, y); textStyle(NORMAL);
  for (let i = 0; i < managers.length; i++) {
    let bx = 380 + i * 200;
    fill(calendarManager === managers[i] ? colors.accent : '#dfe6e9'); noStroke();
    rect(bx, y-12, 180, 28, 4);
    fill(calendarManager === managers[i] ? '#fff' : colors.text); textSize(11); textAlign(CENTER);
    text(managers[i].name.split('(')[0].trim(), bx+90, y+7); textAlign(LEFT);
  }
  y += 40;
  let days = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
  for (let d = 0; d < 7; d++) {
    fill(colors.accent); noStroke(); rect(x+d*160, y, 155, 28, 4);
    fill('#fff'); textSize(13); textStyle(BOLD); textAlign(CENTER); text(days[d], x+d*160+77, y+19); textAlign(LEFT); textStyle(NORMAL);
  }
  y += 32;
  for (let w = 0; w < 4; w++) {
    for (let d = 0; d < 7; d++) {
      let cx = x + d*160, cy = y + w*135, dn = w*7+d+1;
      fill('#fff'); stroke('#e0e0e0'); rect(cx, cy, 155, 130, 6);
      noStroke(); fill(colors.text); textSize(12); textStyle(BOLD); text(dn, cx+10, cy+18); textStyle(NORMAL);
      let dt = getDayTasks(calendarManager, dn);
      for (let t = 0; t < min(dt.length, 4); t++) {
        let tc = dt[t].type==='weekly'?colors.lightWeekly:dt[t].type==='monthly'?colors.lightMonthly:colors.lightOnetime;
        fill(tc); noStroke(); rect(cx+8, cy+28+t*22, 139, 18, 3);
        fill(colors.text); textSize(10); text(dt[t].title.substring(0,14), cx+12, cy+41+t*22);
      }
    }
  }
}

function getDayTasks(manager, dayNum) {
  let tasks = [];
  for (let t of manager.tasks) {
    if (t.status === 'done') continue;
    let td = null, dl = t.deadline.toLowerCase();
    if (dl.includes('пн')) td=1; else if (dl.includes('вт')) td=2;
    else if (dl.includes('ср')) td=3; else if (dl.includes('чт')) td=4;
    else if (dl.includes('пт')) td=5; else if (dl.includes('сб')) td=6;
    else if (dl.includes('вс')) td=7;
    else td = ((t.title.length + t.hours) % 28) + 1;
    if (td === dayNum) tasks.push(t);
  }
  return tasks;
}

// === КЛАССЫ ===
class Manager {
  constructor(name) { this.name = name; this.tasks = []; }
  addTask(t) { this.tasks.push(t); saveData(); checkNotifications(); }
  removeTask(t) { let i = this.tasks.indexOf(t); if(i>-1) { this.tasks.splice(i,1); saveData(); checkNotifications(); } }
  getWeeklyTasks() { return this.tasks.filter(t => t.type === 'weekly'); }
  getMonthlyTasks() { return this.tasks.filter(t => t.type === 'monthly'); }
  getOnetimeTasks() { return this.tasks.filter(t => t.type === 'onetime'); }
  getCompletedTasks() { return this.tasks.filter(t => t.status === 'done'); }
  getWeeklyHours() {
    let w = this.tasks.filter(t => t.type==='weekly' && t.status!=='done').reduce((s,t) => s+t.hours, 0);
    let m = this.tasks.filter(t => t.type==='monthly' && t.status!=='done').reduce((s,t) => s+t.hours/4, 0);
    return w + m;
  }
  getMonthlyHours() {
    return this.tasks.filter(t => t.status!=='done').reduce((s,t) => s + (t.type==='weekly'?t.hours*4:t.hours), 0);
  }
  getOnetimeHours() {
    return this.tasks.filter(t => t.type==='onetime' && t.status!=='done').reduce((s,t) => s+t.hours, 0);
  }
}

class Task {
  constructor(title, type, hours, deadline, assignee, desc) {
    this.title = title; this.type = type; this.hours = hours;
    this.deadline = deadline; this.assignee = assignee;
    this.description = desc || ''; this.status = 'todo'; this.completedDate = null;
  }
  complete() {
    this.status = 'done';
    let d = new Date();
    this.completedDate = String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + d.getFullYear();
  }
  reopen() { this.status = 'todo'; this.completedDate = null; }
}

// === УВЕДОМЛЕНИЯ ===
function checkNotifications() {
  notifications = [];
  for (let m of managers) {
    let wh = m.getWeeklyHours();
    if (wh > 40) notifications.push({ type: 'overload', message: m.name.split(' ')[0] + ': перегруз ' + wh.toFixed(1) + 'ч' });
    for (let t of m.tasks) {
      if (t.status !== 'done' && t.deadline.match(/(\d{2})\.(\d{2})\.(\d{4})/)) {
        let d = t.deadline.match(/(\d{2})\.(\d{2})\.(\d{4})/);
        let td = d[1]+'.'+d[2]+'.'+d[3];
        if (td < '25.06.2026') notifications.push({ type: 'overdue', message: m.name.split(' ')[0] + ': просрочена «' + t.title + '»' });
      }
    }
  }
}

// === ЭКСПОРТ ===
function exportToXLS() {
  let xls = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Задачи"><Table>';
  xls += '<Row><Cell><Data ss:Type="String">Сотрудник</Data></Cell><Cell><Data ss:Type="String">Задача</Data></Cell><Cell><Data ss:Type="String">Описание</Data></Cell><Cell><Data ss:Type="String">Тип</Data></Cell><Cell><Data ss:Type="String">Часы</Data></Cell><Cell><Data ss:Type="String">Дедлайн</Data></Cell><Cell><Data ss:Type="String">Статус</Data></Cell></Row>';
  for (let m of managers) {
    for (let t of m.tasks) {
      let type = t.type==='weekly'?'Еженедельная':t.type==='monthly'?'Ежемесячная':'Разовая';
      let status = t.status==='done'?'Выполнена':'В работе';
      xls += '<Row><Cell><Data ss:Type="String">'+m.name+'</Data></Cell><Cell><Data ss:Type="String">'+t.title+'</Data></Cell><Cell><Data ss:Type="String">'+(t.description||'')+'</Data></Cell><Cell><Data ss:Type="String">'+type+'</Data></Cell><Cell><Data ss:Type="Number">'+t.hours+'</Data></Cell><Cell><Data ss:Type="String">'+t.deadline+'</Data></Cell><Cell><Data ss:Type="String">'+status+'</Data></Cell></Row>';
    }
  }
  xls += '</Table></Worksheet></Workbook>';
  let blob = new Blob([xls], {type:'application/vnd.ms-excel'});
  let a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tasks.xls'; a.click();
}

// === ФОРМА ===
function updateAssigneeButtons() {
  let c = document.getElementById('assignee-btns'); if(!c) return; c.innerHTML = '';
  for (let m of managers) {
    let b = document.createElement('button'); b.className = 'assignee-btn'; b.textContent = m.name.split('(')[0].trim();
    b.onclick = function(){ newTaskAssignee = m; for(let x of c.children) x.classList.remove('active'); b.classList.add('active'); };
    if (m === newTaskAssignee) b.classList.add('active');
    c.appendChild(b);
  }
}
function setType(type) {
  newTaskType = type;
  for (let b of document.getElementsByClassName('type-btn')) { b.classList.remove('active'); if(b.classList.contains(type)) b.classList.add('active'); }
}
function saveTask() {
  let t = document.getElementById('task-title').value;
  let h = parseInt(document.getElementById('task-hours').value);
  let d = document.getElementById('task-deadline').value;
  let desc = document.getElementById('task-description').value;
  if (t && h && d && newTaskAssignee) {
    newTaskAssignee.addTask(new Task(t, newTaskType, h, d, newTaskAssignee, desc));
    document.getElementById('task-title').value = '';
    document.getElementById('task-hours').value = '';
    document.getElementById('task-deadline').value = '';
    document.getElementById('task-description').value = '';
    hideForm();
  }
}
function showForm() { showAddForm = true; newTaskAssignee = currentManager; document.getElementById('add-form').classList.add('visible'); setType('weekly'); updateAssigneeButtons(); }
function hideForm() { showAddForm = false; document.getElementById('add-form').classList.remove('visible'); }

// === КЛИКИ ===
function mousePressed() {
  console.log('Клик! X:', mouseX, 'Y:', mouseY);
  
  if (mouseX > 1090 && mouseX < 1130 && mouseY > 5 && mouseY < 45) { showNotifications = !showNotifications; return; }
  if (showNotifications) {
    if (mouseX < 900 || mouseX > 1180 || mouseY < 65 || mouseY > 315) showNotifications = false;
    if (mouseX > 915 && mouseX < 1165 && mouseY > 275 && mouseY < 303) { notifications = []; showNotifications = false; }
    return;
  }
  if (mouseY > 95 && mouseY < 129) {
    if (mouseX > 500 && mouseX < 640) { exportToXLS(); return; }
    if (mouseX > 30 && mouseX < 170) { activeView = 'personal'; hideForm(); return; }
    if (mouseX > 180 && mouseX < 320) { activeView = 'team'; hideForm(); return; }
    if (mouseX > 330 && mouseX < 470) { activeView = 'calendar'; hideForm(); return; }
  }
  if (activeView === 'calendar') {
    for (let i = 0; i < managers.length; i++) {
      if (mouseX > 380+i*200 && mouseX < 560+i*200 && mouseY > 138 && mouseY < 166) calendarManager = managers[i];
    }
    return;
  }
  if (activeView === 'team') return;
  for (let i = 0; i < managers.length; i++) {
    if (mouseX > 130+i*200 && mouseX < 315+i*200 && mouseY > 140 && mouseY < 170) { currentManager = managers[i]; hideForm(); }
  }
  if (mouseX > 850 && mouseX < 1070 && mouseY > 705 && mouseY < 749) { showAddForm ? hideForm() : showForm(); return; }
  
  if (currentManager && !showAddForm) {
    let blocks = [
      { tasks: currentManager.getWeeklyTasks(), x: 30, y: 216 },
      { tasks: currentManager.getMonthlyTasks(), x: 380, y: 216 },
      { tasks: currentManager.getOnetimeTasks(), x: 730, y: 216 }
    ];
    
    for (let b of blocks) {
      let active = b.tasks.filter(t => t.status !== 'done');
      for (let i = 0; i < min(active.length, 5); i++) {
        let ty = b.y + 50 + i * 36;
        
        // Проверка на удаление
        let delX1 = b.x + 308;
        let delX2 = b.x + 330;
        let delY1 = ty + 2;
        let delY2 = ty + 24;
        
        console.log('Задача:', active[i].title, 'Кнопка X:', delX1, '-', delX2, 'Y:', delY1, '-', delY2);
        console.log('Мышь X:', mouseX, 'Y:', mouseY);
        
        if (mouseX > delX1 && mouseX < delX2 && mouseY > delY1 && mouseY < delY2) {
          console.log('УДАЛЯЮ задачу:', active[i].title);
          currentManager.removeTask(active[i]);
          return;
        }
        
        // Чекбокс
        if (mouseX > b.x+12 && mouseX < b.x+30 && mouseY > ty+2 && mouseY < ty+20) {
          console.log('ЗАВЕРШАЮ задачу:', active[i].title);
          active[i].complete();
          saveData();
          checkNotifications();
          return;
        }
      }
    }
    
    let comp = currentManager.getCompletedTasks().sort((a,b) => (b.completedDate||'').localeCompare(a.completedDate||''));
    for (let i = 0; i < min(comp.length, 4); i++) {
      let ty = 468 + i * 32;
      if (mouseX > 350 && mouseX < 378 && mouseY > ty+2 && mouseY < ty+24) { currentManager.removeTask(comp[i]); return; }
      if (mouseX > 300 && mouseX < 340 && mouseY > ty+2 && mouseY < ty+24) { comp[i].reopen(); saveData(); checkNotifications(); return; }
    }
  }
}

// === ДАННЫЕ ===
function saveData() {
  let data = managers.map(m => ({
    name: m.name,
    tasks: m.tasks.map(t => ({
      title: t.title, type: t.type, hours: t.hours, deadline: t.deadline,
      description: t.description, status: t.status, completedDate: t.completedDate,
      assigneeName: t.assignee ? t.assignee.name : null
    }))
  }));
  localStorage.setItem('taskManagerData', JSON.stringify(data));
}

function loadData() {
  let saved = localStorage.getItem('taskManagerData');
  if (saved) {
    try {
      let data = JSON.parse(saved);
      if (data && data.managers && data.managers.length > 0) {
        managers = [];
        let map = {};
        for (let m of data.managers) { let mgr = new Manager(m.name); map[m.name] = mgr; managers.push(mgr); }
        for (let m of data.managers) {
          let mgr = map[m.name];
          if (m.tasks) {
            for (let t of m.tasks) {
              if (t && t.title) {
                let assignee = t.assigneeName ? map[t.assigneeName] : mgr;
                let task = new Task(t.title, t.type||'weekly', t.hours||1, t.deadline||'ПН', assignee, t.description||'');
                task.status = t.status || 'todo';
                task.completedDate = t.completedDate || null;
                mgr.tasks.push(task);
              }
            }
          }
        }
        if (managers.length > 0 && managers[0].name.includes('Пименова')) { checkNotifications(); return; }
      }
    } catch(e) { console.log('Ошибка загрузки:', e); }
  }
  createTestData();
  checkNotifications();
}

function createTestData() {
  managers = [];
  let a = new Manager('Александра Пименова (Руководитель)');
  let v = new Manager('Вера Гусева (Менеджер)');
  let va = new Manager('Варвара Андреева (Менеджер)');
  managers.push(a, v, va);
  a.addTask(new Task('Стратегическое планирование', 'weekly', 4, 'ПН', a, 'Определить цели на квартал'));
  a.addTask(new Task('Совещание с командой', 'weekly', 2, 'СР', a, 'Обсудить результаты'));
  v.addTask(new Task('Отчёт по продажам', 'weekly', 3, 'ПН', v, 'Собрать данные из CRM'));
  v.addTask(new Task('Презентация для клиента', 'onetime', 6, '28.06.2026', v, 'Подготовить слайды'));
  va.addTask(new Task('Анализ рынка', 'weekly', 4, 'ПН', va, 'Мониторинг конкурентов'));
  va.addTask(new Task('Обновление базы данных', 'onetime', 8, '27.06.2026', va, 'Перенести в новую CRM'));
  saveData();
}
