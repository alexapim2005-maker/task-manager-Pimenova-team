let managers = [];
let currentManager = null;
let activeView = 'personal';
let calendarManager = null;
let notifications = [];
let showNotifications = false;
let showAddForm = false;
let newTaskType = 'weekly';
let newTaskAssignee = null;
let hoveredTask = null;
let hoveredTaskX = 0;
let hoveredTaskY = 0;

let colors = {
  bg: '#f5f6fa', card: '#ffffff', weekly: '#6c5ce7', monthly: '#e17055',
  onetime: '#00b894', done: '#b2bec3', completed: '#636e72', text: '#2d3436',
  danger: '#d63031', warning: '#fdcb6e', ok: '#00b894', accent: '#0984e3',
  lightWeekly: '#a29bfe', lightMonthly: '#fab1a0', lightOnetime: '#55efc4'
};

function setup() {
  let canvas = createCanvas(1200, 850);
  canvas.parent('app-container');
  textFont('Arial');
  
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
      }
    } catch(e) {}
  }
  
  if (managers.length === 0) {
    managers = [];
    let a = new Manager('Александра Пименова (Руководитель)');
    let v = new Manager('Вера Гусева (Менеджер)');
    let va = new Manager('Варвара Андреева (Менеджер)');
    managers.push(a, v, va);
    a.addTask(new Task('Стратегическое планирование', 'weekly', 4, 'ПН', a, 'Определить цели на квартал'));
    a.addTask(new Task('Совещание с командой', 'weekly', 2, 'СР', a, 'Обсудить результаты недели'));
    v.addTask(new Task('Отчёт по продажам', 'weekly', 3, 'ПН', v, 'Собрать данные из CRM'));
    v.addTask(new Task('Презентация для клиента', 'onetime', 6, '28.06.2026', v, 'Для встречи с Петровым'));
    va.addTask(new Task('Анализ рынка', 'weekly', 4, 'ПН', va, 'Мониторинг конкурентов'));
    va.addTask(new Task('Обновление базы', 'onetime', 8, '27.06.2026', va, 'Перенести данные в новую CRM'));
    saveData();
  }
  
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
  drawViewTabs();
  drawNotificationBell();
  if (showNotifications) drawNotificationsPanel();
  if (activeView === 'personal') drawPersonalView();
  else if (activeView === 'team') drawTeamView();
  else if (activeView === 'calendar') drawCalendarView();
  updateTooltip();
}

function updateTooltip() {
  let t = document.getElementById('description-tooltip');
  if (hoveredTask && hoveredTask.description) {
    t.style.display = 'block'; t.style.left = (hoveredTaskX+15)+'px'; t.style.top = (hoveredTaskY-10)+'px';
    t.textContent = hoveredTask.description;
  } else { t.style.display = 'none'; }
}

function drawHeader() {
  fill(colors.text); textSize(26); textStyle(BOLD); text('📋 Таск Менеджер', 30, 42); textStyle(NORMAL);
  textSize(13); fill('#636e72'); text('Рабочая неделя: 40 часов | Рабочий месяц: 160 часов', 30, 65);
}

function drawNotificationBell() {
  if (notifications.length > 0) {
    fill(colors.danger); noStroke(); circle(1145, 25, 20);
    fill('#fff'); textSize(12); textStyle(BOLD); textAlign(CENTER); text(notifications.length, 1145, 30); textAlign(LEFT); textStyle(NORMAL);
  }
  fill(notifications.length > 0 ? colors.danger : '#636e72'); textSize(26); text('🔔', 1100, 40);
}

function drawNotificationsPanel() {
  let x = 900, y = 55;
  fill('#fff'); stroke('#636e72'); strokeWeight(2); rect(x, y, 260, 220, 10);
  fill(colors.text); textSize(15); textStyle(BOLD); text('Уведомления', x+15, y+28); textStyle(NORMAL);
  if (notifications.length === 0) { fill('#636e72'); textSize(12); text('Нет уведомлений', x+15, y+55); }
  else { for (let i = 0; i < min(notifications.length, 7); i++) { fill(notifications[i].type==='overdue'?colors.danger:colors.warning); textSize(11); text(notifications[i].message, x+15, y+55+i*22); } }
  fill('#dfe6e9'); noStroke(); rect(x+15, y+180, 230, 25, 5);
  fill(colors.text); textSize(12); textAlign(CENTER); text('Очистить', x+130, y+198); textAlign(LEFT);
}

function drawViewTabs() {
  let tabs = [
    { id: 'personal', label: '👤 Мои задачи', x: 30 },
    { id: 'team', label: '👥 Дашборд', x: 175 },
    { id: 'calendar', label: '📅 Календарь', x: 320 }
  ];
  for (let t of tabs) {
    fill(activeView === t.id ? colors.accent : '#dfe6e9'); noStroke(); rect(t.x, 88, 140, 32, 7);
    fill(activeView === t.id ? '#fff' : colors.text); textSize(13); textAlign(CENTER); text(t.label, t.x+70, 109); textAlign(LEFT);
  }
  fill(colors.ok); noStroke(); rect(480, 88, 130, 32, 7);
  fill('#fff'); textSize(13); textAlign(CENTER); text('📥 Экспорт', 545, 109); textAlign(LEFT);
  fill('#0984e3'); noStroke(); rect(620, 88, 130, 32, 7);
  fill('#fff'); textSize(13); textAlign(CENTER); text('💾 Сохранить', 685, 109); textAlign(LEFT);
}

function drawPersonalView() {
  fill('#636e72'); textSize(13); text('Сотрудник:', 30, 150);
  for (let i = 0; i < managers.length; i++) {
    let bx = 120 + i * 180;
    fill(managers[i] === currentManager ? colors.weekly : '#dfe6e9'); noStroke(); rect(bx, 136, 165, 28, 5);
    fill(managers[i] === currentManager ? '#fff' : colors.text); textSize(11); textAlign(CENTER); text(managers[i].name.split('(')[0].trim(), bx+82, 155); textAlign(LEFT);
  }
  drawBlock('Еженедельные', currentManager.getWeeklyTasks(), 30, 180, colors.weekly);
  drawBlock('Ежемесячные', currentManager.getMonthlyTasks(), 380, 180, colors.monthly);
  drawBlock('Разовые', currentManager.getOnetimeTasks(), 730, 180, colors.onetime);
  drawCompletedBlock(currentManager.getCompletedTasks(), 30, 420);
  drawStats();
  fill('#00b894'); noStroke(); rect(850, 710, 200, 40, 20);
  fill('#fff'); textSize(15); textAlign(CENTER); text('+ Новая задача', 950, 736); textAlign(LEFT);
}

function drawBlock(title, tasks, x, y, color) {
  fill(color); noStroke(); rect(x, y, 340, 34, 7);
  fill('#fff'); textSize(14); textStyle(BOLD); text(title, x+12, y+23); textStyle(NORMAL);
  fill('#fff'); stroke('#e0e0e0'); strokeWeight(1); rect(x, y+34, 340, 185, 0, 0, 7, 7);
  let active = tasks.filter(t => t.status !== 'done');
  if (active.length === 0) { fill('#b2bec3'); noStroke(); textSize(12); text('Нет задач', x+12, y+60); return; }
  for (let i = 0; i < min(active.length, 5); i++) {
    let t = active[i]; let ty = y + 46 + i * 34;
    if (mouseX > x+32 && mouseX < x+305 && mouseY > ty && mouseY < ty+32 && t.description) { hoveredTask = t; hoveredTaskX = mouseX; hoveredTaskY = mouseY; }
    fill('#fff'); stroke('#b2bec3'); strokeWeight(2); rect(x+10, ty+6, 16, 16, 3); noStroke();
    if (t.description) { fill('#74b9ff'); noStroke(); circle(x+32, ty+22, 9); fill('#fff'); textSize(7); textAlign(CENTER); text('i', x+32, ty+25); textAlign(LEFT); }
    fill(colors.text); textSize(12); text(t.title, x+44, ty+13);
    fill('#636e72'); textSize(9); text(t.hours + 'ч | ' + t.deadline + ' | ' + (t.assignee ? t.assignee.name.split('(')[0].trim() : ''), x+44, ty+27);
    fill('#e74c3c'); noStroke(); rect(x+308, ty+6, 22, 20, 3);
    fill('#fff'); textSize(14); textAlign(CENTER); text('×', x+319, ty+21); textAlign(LEFT);
  }
}

function drawCompletedBlock(tasks, x, y) {
  fill(colors.completed); noStroke(); rect(x, y, 1040, 34, 7);
  fill('#fff'); textSize(14); textStyle(BOLD); text('✅ Завершённые задачи', x+12, y+23); textStyle(NORMAL);
  fill('#fff'); stroke('#e0e0e0'); rect(x, y+34, 1040, 140, 0, 0, 7, 7);
  if (tasks.length === 0) { fill('#b2bec3'); noStroke(); textSize(12); text('Нет завершённых задач', x+12, y+60); return; }
  for (let i = 0; i < min(tasks.length, 4); i++) {
    let t = tasks[i]; let ty = y + 44 + i * 30;
    if (mouseX > x+30 && mouseX < x+255 && mouseY > ty && mouseY < ty+28 && t.description) { hoveredTask = t; hoveredTaskX = mouseX; hoveredTaskY = mouseY; }
    fill('#00b894'); noStroke(); textSize(13); text('✓', x+12, ty+12);
    fill(colors.completed); textSize(12); textStyle(ITALIC); text(t.title, x+30, ty+12); textStyle(NORMAL);
    fill('#636e72'); textSize(9); text(t.hours + 'ч | Вып: ' + (t.completedDate||'?') + ' | ' + (t.assignee?t.assignee.name.split('(')[0].trim():''), x+30, ty+25);
    fill('#dfe6e9'); noStroke(); rect(x+260, ty+3, 35, 20, 3);
    fill(colors.text); textSize(10); textAlign(CENTER); text('↩', x+277, ty+17); textAlign(LEFT);
    fill('#e74c3c'); noStroke(); rect(x+305, ty+3, 25, 20, 3);
    fill('#fff'); textSize(12); textAlign(CENTER); text('×', x+317, ty+17); textAlign(LEFT);
  }
}

function drawStats() {
  let y = 600;
  fill('#fff'); stroke('#e0e0e0'); rect(30, y, 1040, 65, 7);
  fill(colors.text); textSize(15); textStyle(BOLD); text('📊 Нагрузка: ' + currentManager.name, 48, y+25); textStyle(NORMAL);
  let wh = currentManager.getWeeklyHours(), mh = currentManager.getMonthlyHours();
  fill('#636e72'); textSize(11); text('Неделя: ' + wh + ' / 40ч', 48, y+45);
  fill('#dfe6e9'); noStroke(); rect(150, y+35, 200, 14, 7);
  fill(wh > 40 ? colors.danger : wh > 35 ? colors.warning : colors.ok); rect(150, y+35, 200 * min(wh/40, 1), 14, 7);
  fill('#636e72'); textSize(11); text('Месяц: ' + mh + ' / 160ч', 380, y+45);
  fill('#dfe6e9'); noStroke(); rect(480, y+35, 200, 14, 7);
  fill(mh > 160 ? colors.danger : mh > 140 ? colors.warning : colors.ok); rect(480, y+35, 200 * min(mh/160, 1), 14, 7);
  fill(colors.text); textSize(12); text('Разовые: ' + currentManager.getOnetimeHours() + 'ч | Свободно: ' + max(0, 40-wh) + 'ч', 720, y+45);
}

function drawTeamView() {
  let y = 160;
  fill(colors.text); textSize(20); textStyle(BOLD); text('📊 Сводка по команде', 30, y); textStyle(NORMAL); y += 25;
  fill(colors.accent); noStroke(); rect(30, y, 1050, 32, 6);
  fill('#fff'); textSize(12); textStyle(BOLD);
  let hx = 45;
  ['Сотрудник', 'Активные', 'Завершено', 'Занято нед', 'Своб нед', 'Занято мес', 'Загрузка'].forEach(h => { text(h, hx, y+21); hx += 150; });
  textStyle(NORMAL); y += 36;
  for (let m of managers) {
    let wh = m.getWeeklyHours(), mh = m.getMonthlyHours(), pct = (wh/40)*100;
    fill('#fff'); stroke('#e0e0e0'); rect(30, y, 1050, 46); noStroke();
    fill(colors.text); textSize(13); textStyle(BOLD); text(m.name, 45, y+18); textStyle(NORMAL);
    fill('#636e72'); textSize(11); text(m.tasks.filter(t=>t.status!=='done').length + ' | ' + m.tasks.filter(t=>t.status==='done').length, 45, y+36);
    textAlign(CENTER);
    fill(wh>40?colors.danger:colors.text); text(wh.toFixed(1)+'ч', 345, y+28);
    fill(max(0,40-wh)>0?colors.ok:'#636e72'); text(max(0,40-wh).toFixed(1)+'ч', 495, y+28);
    fill(mh>160?colors.danger:colors.text); text(mh.toFixed(1)+'ч', 645, y+28); textAlign(LEFT);
    fill('#dfe6e9'); rect(750, y+14, 200, 12, 6);
    fill(pct>100?colors.danger:pct>80?colors.warning:colors.ok); rect(750, y+14, 200*min(pct/100,1.5), 12, 6);
    fill(colors.text); textSize(10); textAlign(CENTER); text(pct.toFixed(0)+'%', 850, y+36); textAlign(LEFT);
    y += 50;
  }
}

function drawCalendarView() {
  let y = 160;
  fill(colors.text); textSize(20); textStyle(BOLD); text('📅 Календарь загрузки', 30, y); textStyle(NORMAL);
  for (let i = 0; i < managers.length; i++) {
    let bx = 280 + i * 200;
    fill(calendarManager === managers[i] ? colors.accent : '#dfe6e9'); noStroke(); rect(bx, y-10, 180, 26, 4);
    fill(calendarManager === managers[i] ? '#fff' : colors.text); textSize(11); textAlign(CENTER); text(managers[i].name, bx+90, y+8); textAlign(LEFT);
  }
  y += 35;
  let days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
  for (let d = 0; d < 7; d++) {
    fill(colors.accent); noStroke(); rect(30+d*155+d*5, y, 155, 26, 4);
    fill('#fff'); textSize(12); textStyle(BOLD); textAlign(CENTER); text(days[d], 30+d*160+77, y+18); textAlign(LEFT); textStyle(NORMAL);
  }
  y += 30;
  for (let w = 0; w < 4; w++) for (let d = 0; d < 7; d++) {
    fill('#fff'); stroke('#e0e0e0'); rect(30+d*160, y+w*135, 155, 130, 5);
    noStroke(); fill(colors.text); textSize(12); textStyle(BOLD); text(w*7+d+1, 40+d*160, y+w*135+18); textStyle(NORMAL);
  }
}

class Manager {
  constructor(name) { this.name = name; this.tasks = []; }
  addTask(t) { this.tasks.push(t); saveData(); checkNotifications(); }
  removeTask(t) { let i = this.tasks.indexOf(t); if(i>-1) { this.tasks.splice(i,1); saveData(); checkNotifications(); } }
  getWeeklyTasks() { return this.tasks.filter(t => t.type === 'weekly'); }
  getMonthlyTasks() { return this.tasks.filter(t => t.type === 'monthly'); }
  getOnetimeTasks() { return this.tasks.filter(t => t.type === 'onetime'); }
  getCompletedTasks() { return this.tasks.filter(t => t.status === 'done'); }
  getWeeklyHours() { return this.tasks.filter(t=>t.type==='weekly'&&t.status!=='done').reduce((s,t)=>s+t.hours,0) + this.tasks.filter(t=>t.type==='monthly'&&t.status!=='done').reduce((s,t)=>s+t.hours/4,0); }
  getMonthlyHours() { return this.tasks.filter(t=>t.status!=='done').reduce((s,t)=>s+(t.type==='weekly'?t.hours*4:t.hours),0); }
  getOnetimeHours() { return this.tasks.filter(t=>t.type==='onetime'&&t.status!=='done').reduce((s,t)=>s+t.hours,0); }
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

function updateAssigneeButtons() {
  let c = document.getElementById('assignee-btns'); if(!c) return; c.innerHTML = '';
  for (let m of managers) {
    let b = document.createElement('button'); b.className = 'assignee-btn'; b.textContent = m.name.split('(')[0].trim();
    b.onclick = function(){ newTaskAssignee = m; for(let x of c.children) x.classList.remove('active'); b.classList.add('active'); };
    if (m === newTaskAssignee) b.classList.add('active');
    c.appendChild(b);
  }
}
function setType(type) { newTaskType = type; for(let b of document.getElementsByClassName('type-btn')){b.classList.remove('active'); if(b.classList.contains(type))b.classList.add('active');} }
function saveTaskFromForm() {
  let t = document.getElementById('task-title').value.trim();
  let h = parseInt(document.getElementById('task-hours').value);
  let d = document.getElementById('task-deadline').value.trim();
  let desc = document.getElementById('task-description').value.trim();
  if (t && h && d && newTaskAssignee) {
    newTaskAssignee.addTask(new Task(t, newTaskType, h, d, newTaskAssignee, desc));
    document.getElementById('task-title').value = '';
    document.getElementById('task-hours').value = '';
    document.getElementById('task-deadline').value = '';
    document.getElementById('task-description').value = '';
    hideForm();
  }
}
function showForm() { showAddForm = true; newTaskAssignee = currentManager; document.getElementById('add-form').classList.add('visible'); document.getElementById('overlay').classList.add('visible'); setType('weekly'); updateAssigneeButtons(); }
function hideForm() { showAddForm = false; document.getElementById('add-form').classList.remove('visible'); document.getElementById('overlay').classList.remove('visible'); }

function checkNotifications() { notifications = []; for(let m of managers){if(m.getWeeklyHours()>40)notifications.push({type:'overload',message:m.name+': перегруз '+m.getWeeklyHours().toFixed(1)+'ч'});} }

function saveData() {
  localStorage.setItem('taskManagerData', JSON.stringify(managers.map(m=>({
    name:m.name, tasks:m.tasks.map(t=>({
      title:t.title, type:t.type, hours:t.hours, deadline:t.deadline,
      description:t.description, status:t.status, completedDate:t.completedDate,
      assigneeName:t.assignee?t.assignee.name:null
    }))
  }))));
}

function mousePressed() {
  if(mouseX>1095&&mouseX<1130&&mouseY>10&&mouseY<45){showNotifications=!showNotifications;return;}
  if(showNotifications){if(mouseX<900||mouseX>1160||mouseY<55||mouseY>275)showNotifications=false;if(mouseX>915&&mouseX<1145&&mouseY>235&&mouseY<260){notifications=[];showNotifications=false;}return;}
  if(mouseY>88&&mouseY<120){if(mouseX>30&&mouseX<170){activeView='personal';hideForm();return;}if(mouseX>175&&mouseX<315){activeView='team';hideForm();return;}if(mouseX>320&&mouseX<460){activeView='calendar';hideForm();return;}if(mouseX>480&&mouseX<610){exportToXLS();return;}if(mouseX>620&&mouseX<750){saveData();return;}}
  if(activeView==='calendar'){for(let i=0;i<managers.length;i++){if(mouseX>280+i*200&&mouseX<460+i*200&&mouseY>150&&mouseY<176)calendarManager=managers[i];}return;}
  if(activeView==='team')return;
  for(let i=0;i<managers.length;i++){if(mouseX>120+i*180&&mouseX<285+i*180&&mouseY>136&&mouseY<164){currentManager=managers[i];hideForm();}}
  if(mouseX>850&&mouseX<1050&&mouseY>710&&mouseY<750){showForm();return;}
  if(currentManager&&!showAddForm){
    let blocks=[{tasks:currentManager.getWeeklyTasks(),x:30},{tasks:currentManager.getMonthlyTasks(),x:380},{tasks:currentManager.getOnetimeTasks(),x:730}];
    for(let b of blocks){let active=b.tasks.filter(t=>t.status!=='done');for(let i=0;i<min(active.length,5);i++){let ty=226+i*34;if(mouseX>b.x+308&&mouseX<b.x+330&&mouseY>ty+6&&mouseY<ty+26){currentManager.removeTask(active[i]);return;}if(mouseX>b.x+10&&mouseX<b.x+26&&mouseY>ty+6&&mouseY<ty+22){active[i].complete();saveData();checkNotifications();return;}}}
    for(let i=0;i<min(currentManager.getCompletedTasks().length,4);i++){let t=currentManager.getCompletedTasks()[i],ty=464+i*30;if(mouseX>335&&mouseX<
