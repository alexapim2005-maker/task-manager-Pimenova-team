// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
let managers = [];
let currentManager = null;
let activeView = 'personal';
let calendarManager = null;
let notifications = [];
let showNotifications = false;
let showAddForm = false;
let newTaskType = 'weekly';
let newTaskTitle = '';
let newTaskHours = '';
let newTaskDeadline = '';
let newTaskAssignee = null;

// === ЦВЕТА ===
let colors = {
  bg: '#f5f6fa', card: '#ffffff', weekly: '#6c5ce7', monthly: '#e17055',
  onetime: '#00b894', done: '#b2bec3', completed: '#636e72', text: '#2d3436',
  danger: '#d63031', warning: '#fdcb6e', ok: '#00b894', accent: '#0984e3',
  lightWeekly: '#a29bfe', lightMonthly: '#fab1a0', lightOnetime: '#55efc4'
};

// === ЗАПУСК ===
function setup() {
  createCanvas(1200, 850);
  textFont('Arial');
  
  // Загружаем или создаём данные
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
                let task = new Task(t.title, t.type||'weekly', t.hours||1, t.deadline||'ПН', assignee);
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
    a.addTask(new Task('Стратегическое планирование', 'weekly', 4, 'ПН', a));
    a.addTask(new Task('Совещание с командой', 'weekly', 2, 'СР', a));
    v.addTask(new Task('Отчёт по продажам', 'weekly', 3, 'ПН', v));
    v.addTask(new Task('Презентация для клиента', 'onetime', 6, '28.06.2026', v));
    va.addTask(new Task('Анализ рынка', 'weekly', 4, 'ПН', va));
    va.addTask(new Task('Обновление базы', 'onetime', 8, '27.06.2026', va));
    saveData();
  }
  
  currentManager = managers[0];
  calendarManager = managers[0];
  newTaskAssignee = currentManager;
  checkNotifications();
}

function draw() {
  background(colors.bg);
  drawHeader();
  drawViewTabs();
  drawNotificationBell();
  
  if (showNotifications) drawNotificationsPanel();
  
  if (activeView === 'personal') drawPersonalView();
  else if (activeView === 'team') drawTeamView();
  else if (activeView === 'calendar') drawCalendarView();
  
  // Отрисовка формы добавления
  if (showAddForm) drawAddForm();
}

// === ШАПКА ===
function drawHeader() {
  fill(colors.text); textSize(26); textStyle(BOLD); text('📋 Таск Менеджер', 30, 42); textStyle(NORMAL);
  textSize(13); fill('#636e72'); text('Рабочая неделя: 40 часов | Рабочий месяц: 160 часов', 30, 65);
}

// === УВЕДОМЛЕНИЯ ===
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
  for (let i = 0; i < min(notifications.length, 7); i++) {
    fill(notifications[i].type === 'overdue' ? colors.danger : colors.warning);
    textSize(11); text(notifications[i].message, x+15, y+55+i*22);
  }
  if (notifications.length === 0) { fill('#636e72'); textSize(12); text('Нет уведомлений', x+15, y+55); }
  fill('#dfe6e9'); noStroke(); rect(x+15, y+180, 230, 25, 5);
  fill(colors.text); textSize(12); textAlign(CENTER); text('Очистить', x+130, y+198); textAlign(LEFT);
}

// === ВКЛАДКИ ===
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
  
  // Кнопка сохранения
  fill('#0984e3'); noStroke(); rect(620, 88, 130, 32, 7);
  fill('#fff'); textSize(13); textAlign(CENTER); text('💾 Сохранить', 685, 109); textAlign(LEFT);
}

// === ЛИЧНЫЙ ВИД ===
function drawPersonalView() {
  // Выбор сотрудника
  fill('#636e72'); textSize(13); text('Сотрудник:', 30, 150);
  for (let i = 0; i < managers.length; i++) {
    let bx = 120 + i * 180;
    fill(managers[i] === currentManager ? colors.weekly : '#dfe6e9'); noStroke(); rect(bx, 136, 165, 28, 5);
    fill(managers[i] === currentManager ? '#fff' : colors.text); textSize(11); textAlign(CENTER); text(managers[i].name, bx+82, 155); textAlign(LEFT);
  }
  
  // Три блока задач
  drawBlock('Еженедельные', currentManager.getWeeklyTasks(), 30, 180, colors.weekly);
  drawBlock('Ежемесячные', currentManager.getMonthlyTasks(), 380, 180, colors.monthly);
  drawBlock('Разовые', currentManager.getOnetimeTasks(), 730, 180, colors.onetime);
  
  // Завершённые
  drawCompletedBlock(currentManager.getCompletedTasks(), 30, 420);
  
  // Статистика
  drawStats();
  
  // Кнопка добавления
  fill('#00b894'); noStroke(); rect(850, 710, 200, 40, 20);
  fill('#fff'); textSize(15); textAlign(CENTER); text('+ Новая задача', 950, 736); textAlign(LEFT);
}

// === ФОРМА ДОБАВЛЕНИЯ ===
function drawAddForm() {
  // Затемнение фона
  fill(0, 0, 0, 120); noStroke(); rect(0, 0, 1200, 850);
  
  // Форма
  fill('#fff'); stroke('#636e72'); strokeWeight(2); rect(200, 250, 800, 300, 12);
  noStroke();
  
  fill(colors.text); textSize(20); textStyle(BOLD); text('Новая задача', 230, 290); textStyle(NORMAL);
  
  // Поле названия
  fill('#fff'); stroke('#b2bec3'); strokeWeight(1); rect(230, 310, 250, 35, 4);
  noStroke(); fill('#636e72'); textSize(13); text(newTaskTitle || 'Название задачи...', 240, 333);
  
  // Выбор типа
  let types = ['weekly', 'monthly', 'onetime'];
  let typeNames = ['Еженед.', 'Ежемес.', 'Разов.'];
  for (let i = 0; i < 3; i++) {
    let tx = 230 + i * 100;
    fill(newTaskType === types[i] ? colors[types[i]] : '#dfe6e9');
    noStroke(); rect(tx, 360, 90, 30, 4);
    fill(newTaskType === types[i] ? '#fff' : colors.text);
    textSize(12); textAlign(CENTER); text(typeNames[i], tx+45, 380); textAlign(LEFT);
  }
  
  // Поле часов
  fill('#fff'); stroke('#b2bec3'); rect(550, 310, 60, 35, 4);
  noStroke(); fill('#636e72'); textSize(13); text(newTaskHours || 'Часы', 560, 333);
  
  // Поле дедлайна
  fill('#fff'); stroke('#b2bec3'); rect(630, 310, 120, 35, 4);
  noStroke(); fill('#636e72'); textSize(13); text(newTaskDeadline || 'Дедлайн', 640, 333);
  
  // Выбор ответственного
  fill('#636e72'); textSize(13); text('Ответственный:', 230, 420);
  for (let i = 0; i < managers.length; i++) {
    let mx = 370 + i * 160;
    fill(newTaskAssignee === managers[i] ? '#0984e3' : '#dfe6e9');
    noStroke(); rect(mx, 405, 140, 28, 4);
    fill(newTaskAssignee === managers[i] ? '#fff' : colors.text);
    textSize(11); textAlign(CENTER); text(managers[i].name.split('(')[0].trim(), mx+70, 424); textAlign(LEFT);
  }
  
  // Кнопки
  fill('#00b894'); noStroke(); rect(230, 460, 160, 40, 8);
  fill('#fff'); textSize(16); textAlign(CENTER); text('💾 Сохранить', 310, 486); textAlign(LEFT);
  
  fill('#d63031'); noStroke(); rect(410, 460, 120, 40, 8);
  fill('#fff'); textSize(16); textAlign(CENTER); text('Отмена', 470, 486); textAlign(LEFT);
}

function drawBlock(title, tasks, x, y, color) {
  fill(color); noStroke(); rect(x, y, 340, 34, 7);
  fill('#fff'); textSize(14); textStyle(BOLD); text(title, x+12, y+23); textStyle(NORMAL);
  fill('#fff'); stroke('#e0e0e0'); strokeWeight(1); rect(x, y+34, 340, 185, 0, 0, 7, 7);
  
  let active = tasks.filter(t => t.status !== 'done');
  if (active.length === 0) { fill('#b2bec3'); noStroke(); textSize(12); text('Нет задач', x+12, y+60); return; }
  
  for (let i = 0; i < min(active.length, 5); i++) {
    let t = active[i];
    let ty = y + 46 + i * 34;
    
    fill('#fff'); stroke('#b2bec3'); strokeWeight(2); rect(x+10, ty+6, 16, 16, 3);
    noStroke();
    fill(colors.text); textSize(12); text(t.title, x+32, ty+12);
    fill('#636e72'); textSize(9);
    text(t.hours + 'ч | ' + t.deadline + ' | ' + (t.assignee ? t.assignee.name.split('(')[0].trim() : ''), x+32, ty+26);
    
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
    let t = tasks[i];
    let ty = y + 44 + i * 30;
    fill('#00b894'); noStroke(); textSize(13); text('✓', x+12, ty+12);
    fill(colors.completed); textSize(12); textStyle(ITALIC); text(t.title, x+30, ty+12); textStyle(NORMAL);
    fill('#636e72'); textSize(9);
    text(t.hours + 'ч | Вып: ' + (t.completedDate||'?') + ' | ' + (t.assignee?t.assignee.name.split('(')[0].trim():''), x+30, ty+25);
    
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

// === ДАШБОРД ===
function drawTeamView() {
  let y = 160;
  fill(colors.text); textSize(20); textStyle(BOLD); text('📊 Сводка по команде', 30, y); textStyle(NORMAL);
  y += 25;
  fill(colors.accent); noStroke(); rect(30, y, 1050, 32, 6);
  fill('#fff'); textSize(12); textStyle(BOLD);
  let hx = 45;
  ['Сотрудник', 'Активные', 'Завершено', 'Занято нед', 'Своб нед', 'Занято мес', 'Загрузка'].forEach(h => { text(h, hx, y+21); hx += 150; });
  textStyle(NORMAL);
  y += 36;
  for (let m of managers) {
    let wh = m.getWeeklyHours(), mh = m.getMonthlyHours();
    let active = m.tasks.filter(t => t.status !== 'done').length;
    let completed = m.tasks.filter(t => t.status === 'done').length;
    let pct = (wh/40)*100;
    fill('#fff'); stroke('#e0e0e0'); rect(30, y, 1050, 46);
    noStroke(); fill(colors.text); textSize(13); textStyle(BOLD); text(m.name, 45, y+18); textStyle(NORMAL);
    fill('#636e72'); textSize(11); text(active + ' | ' + completed, 45, y+36);
    textAlign(CENTER);
    fill(wh>40?colors.danger:colors.text); text(wh.toFixed(1)+'ч', 345, y+28);
    fill(max(0,40-wh)>0?colors.ok:'#636e72'); text(max(0,40-wh).toFixed(1)+'ч', 495, y+28);
    fill(mh>160?colors.danger:colors.text); text(mh.toFixed(1)+'ч', 645, y+28);
    textAlign(LEFT);
    fill('#dfe6e9'); rect(750, y+14, 200, 12, 6);
    fill(pct>100?colors.danger:pct>80?colors.warning:colors.ok); rect(750, y+14, 200*min(pct/100,1.5), 12, 6);
    fill(colors.text); textSize(10); textAlign(CENTER); text(pct.toFixed(0)+'%', 850, y+36); textAlign(LEFT);
    y += 50;
  }
}

// === КАЛЕНДАРЬ ===
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
  for (let w = 0; w < 4; w++) {
    for (let d = 0; d < 7; d++) {
      let cx = 30 + d*160, cy = y + w*135;
      fill('#fff'); stroke('#e0e0e0'); rect(cx, cy, 155, 130, 5);
      noStroke(); fill(colors.text); textSize(12); textStyle(BOLD); text(w*7+d+1, cx+10, cy+18); textStyle(NORMAL);
    }
  }
  y += 4*135 + 15;
  fill(colors.text); textSize(16); textStyle(BOLD); text('📊 Сводка по неделям', 30, y); textStyle(NORMAL);
  y += 15;
  for (let w = 0; w < 4; w++) {
    fill('#fff'); stroke('#e0e0e0'); rect(30+w*270, y, 255, 40, 6);
    fill(colors.text); textSize(12); textStyle(BOLD); text('Неделя ' + (w+1) + ': 0 / 40 часов', 45+w*270, y+25); textStyle(NORMAL);
  }
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
  getMonthlyHours() { return this.tasks.filter(t => t.status!=='done').reduce((s,t) => s+(t.type==='weekly'?t.hours*4:t.hours), 0); }
  getOnetimeHours() { return this.tasks.filter(t => t.type==='onetime' && t.status!=='done').reduce((s,t) => s+t.hours, 0); }
}

class Task {
  constructor(title, type, hours, deadline, assignee) {
    this.title = title; this.type = type; this.hours = hours;
    this.deadline = deadline; this.assignee = assignee;
    this.status = 'todo'; this.completedDate = null;
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
    if (m.getWeeklyHours() > 40) notifications.push({ type: 'overload', message: m.name + ': перегруз ' + m.getWeeklyHours().toFixed(1) + 'ч' });
  }
}

// === ДАННЫЕ ===
function saveData() {
  let data = managers.map(m => ({
    name: m.name,
    tasks: m.tasks.map(t => ({
      title: t.title, type: t.type, hours: t.hours, deadline: t.deadline,
      status: t.status, completedDate: t.completedDate, assigneeName: t.assignee ? t.assignee.name : null
    }))
  }));
  localStorage.setItem('taskManagerData', JSON.stringify(data));
}

// === КЛИКИ ===
function mousePressed() {
  // Колокольчик
  if (mouseX > 1095 && mouseX < 1130 && mouseY > 10 && mouseY < 45) { showNotifications = !showNotifications; return; }
  
  // Уведомления
  if (showNotifications) {
    if (mouseX < 900 || mouseX > 1160 || mouseY < 55 || mouseY > 275) showNotifications = false;
    if (mouseX > 915 && mouseX < 1145 && mouseY > 235 && mouseY < 260) { notifications = []; showNotifications = false; }
    return;
  }
  
  // Вкладки и кнопки
  if (mouseY > 88 && mouseY < 120) {
    if (mouseX > 30 && mouseX < 170) { activeView = 'personal'; return; }
    if (mouseX > 175 && mouseX < 315) { activeView = 'team'; return; }
    if (mouseX > 320 && mouseX < 460) { activeView = 'calendar'; return; }
    if (mouseX > 480 && mouseX < 610) { exportToXLS(); return; }
    if (mouseX > 620 && mouseX < 750) { saveData(); return; }
  }
  
  // Календарь
  if (activeView === 'calendar') {
    for (let i = 0; i < managers.length; i++) {
      if (mouseX > 280+i*200 && mouseX < 460+i*200 && mouseY > 150 && mouseY < 176) { calendarManager = managers[i]; return; }
    }
    return;
  }
  
  if (activeView === 'team') return;
  
  // Форма добавления
  if (showAddForm) {
    // Тип
    let types = ['weekly', 'monthly', 'onetime'];
    for (let i = 0; i < 3; i++) {
      if (mouseX > 230+i*100 && mouseX < 320+i*100 && mouseY > 360 && mouseY < 390) { newTaskType = types[i]; return; }
    }
    // Ответственный
    for (let i = 0; i < managers.length; i++) {
      if (mouseX > 370+i*160 && mouseX < 510+i*160 && mouseY > 405 && mouseY < 433) { newTaskAssignee = managers[i]; return; }
    }
    // Сохранить
    if (mouseX > 230 && mouseX < 390 && mouseY > 460 && mouseY < 500) {
      if (newTaskTitle && newTaskHours && newTaskDeadline) {
        newTaskAssignee.addTask(new Task(newTaskTitle, newTaskType, parseInt(newTaskHours), newTaskDeadline, newTaskAssignee));
        showAddForm = false;
      }
      return;
    }
    // Отмена
    if (mouseX > 410 && mouseX < 530 && mouseY > 460 && mouseY < 500) { showAddForm = false; return; }
    return;
  }
  
  // Выбор менеджера
  for (let i = 0; i < managers.length; i++) {
    if (mouseX > 120+i*180 && mouseX < 285+i*180 && mouseY > 136 && mouseY < 164) { currentManager = managers[i]; return; }
  }
  
  // Кнопка "Новая задача"
  if (mouseX > 850 && mouseX < 1050 && mouseY > 710 && mouseY < 750) {
    showAddForm = true; newTaskAssignee = currentManager;
    newTaskTitle = ''; newTaskHours = ''; newTaskDeadline = '';
    return;
  }
  
  // Задачи
  if (currentManager) {
    let blocks = [
      { tasks: currentManager.getWeeklyTasks(), x: 30 },
      { tasks: currentManager.getMonthlyTasks(), x: 380 },
      { tasks: currentManager.getOnetimeTasks(), x: 730 }
    ];
    
    for (let b of blocks) {
      let active = b.tasks.filter(t => t.status !== 'done');
      for (let i = 0; i < min(active.length, 5); i++) {
        let ty = 226 + i * 34;
        
        // Удаление
        if (mouseX > b.x+308 && mouseX < b.x+330 && mouseY > ty+6 && mouseY < ty+26) {
          currentManager.removeTask(active[i]); return;
        }
        
        // Чекбокс
        if (mouseX > b.x+10 && mouseX < b.x+26 && mouseY > ty+6 && mouseY < ty+22) {
          active[i].complete(); saveData(); checkNotifications(); return;
        }
      }
    }
    
    // Завершённые
    for (let i = 0; i < min(currentManager.getCompletedTasks().length, 4); i++) {
      let t = currentManager.getCompletedTasks()[i], ty = 464 + i * 30;
      if (mouseX > 335 && mouseX < 360 && mouseY > ty+3 && mouseY < ty+23) { currentManager.removeTask(t); return; }
      if (mouseX > 290 && mouseX < 325 && mouseY > ty+3 && mouseY < ty+23) { t.reopen(); saveData(); checkNotifications(); return; }
    }
  }
}

// === КЛАВИАТУРА ===
function keyPressed() {
  if (showAddForm) {
    if (keyCode === BACKSPACE) {
      if (mouseX > 230 && mouseX < 480 && mouseY > 310 && mouseY < 345) newTaskTitle = newTaskTitle.slice(0, -1);
      else if (mouseX > 550 && mouseX < 610 && mouseY > 310 && mouseY < 345) newTaskHours = newTaskHours.slice(0, -1);
      else if (mouseX > 630 && mouseX < 750 && mouseY > 310 && mouseY < 345) newTaskDeadline = newTaskDeadline.slice(0, -1);
    } else if (keyCode === ENTER) {
      if (newTaskTitle && newTaskHours && newTaskDeadline) {
        newTaskAssignee.addTask(new Task(newTaskTitle, newTaskType, parseInt(newTaskHours), newTaskDeadline, newTaskAssignee));
        showAddForm = false;
      }
    } else if (key.length === 1) {
      if (mouseX > 230 && mouseX < 480 && mouseY > 310 && mouseY < 345) newTaskTitle += key;
      else if (mouseX > 550 && mouseX < 610 && mouseY > 310 && mouseY < 345) newTaskHours += key;
      else if (mouseX > 630 && mouseX < 750 && mouseY > 310 && mouseY < 345) newTaskDeadline += key;
    }
  }
}

// === ЭКСПОРТ ===
function exportToXLS() {
  let xls = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Задачи"><Table>';
  for (let m of managers) { for (let t of m.tasks) { xls += '<Row><Cell><Data ss:Type="String">'+m.name+'</Data></Cell><Cell><Data ss:Type="String">'+t.title+'</Data></Cell><Cell><Data ss:Type="String">'+t.type+'</Data></Cell><Cell><Data ss:Type="Number">'+t.hours+'</Data></Cell><Cell><Data ss:Type="String">'+t.deadline+'</Data></Cell><Cell><Data ss:Type="String">'+(t.status==='done'?'Выполнена':'В работе')+'</Data></Cell></Row>'; } }
  xls += '</Table></Worksheet></Workbook>';
  let blob = new Blob([xls], {type:'application/vnd.ms-excel'}); let a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tasks.xls'; a.click();
}
