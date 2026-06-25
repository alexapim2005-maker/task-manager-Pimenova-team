let managers = [];
let currentManager = null;
let showAddForm = false;
let newTaskType = 'weekly';
let newTaskAssignee = null;
let activeView = 'personal';
let calendarManager = null;
let notifications = [];
let showNotifications = false;
let currentDate = '25.06.2026';

let colors = {
  bg: '#f5f6fa',
  card: '#ffffff',
  weekly: '#6c5ce7',
  monthly: '#e17055',
  onetime: '#00b894',
  done: '#b2bec3',
  completed: '#636e72',
  text: '#2d3436',
  danger: '#d63031',
  warning: '#fdcb6e',
  ok: '#00b894',
  accent: '#0984e3',
  lightWeekly: '#a29bfe',
  lightMonthly: '#fab1a0',
  lightOnetime: '#55efc4',
  boss: '#e17055'
};

function setup() {
  let canvas = createCanvas(1200, 850);
  canvas.parent('app-container');
  textFont('Arial');
  loadData();
  if (managers.length === 0 || managers[0].name !== 'Александра Пименова (Руководитель)') {
    createTestData();
  }
  currentManager = managers[0];
  calendarManager = managers[0];
  newTaskAssignee = currentManager;
  updateAssigneeButtons();
  checkNotifications();
}

function draw() {
  background(colors.bg);
  drawHeader();
  drawViewToggle();
  drawNotificationBell();
  if (showNotifications) {
    drawNotificationsPanel();
  }
  if (activeView === 'personal') {
    drawPersonalView();
  } else if (activeView === 'team') {
    drawTeamDashboard();
  } else if (activeView === 'calendar') {
    drawCalendarView();
  }
}

function drawHeader() {
  fill(colors.text);
  textSize(28);
  textStyle(BOLD);
  text('📋 Таск Менеджер', 30, 45);
  textSize(14);
  textStyle(NORMAL);
  fill('#636e72');
  text('Рабочая неделя: 40 часов | Рабочий месяц: 160 часов | Сегодня: ' + currentDate, 30, 70);
}

function drawNotificationBell() {
  let x = 1100;
  let y = 30;
  fill(notifications.length > 0 ? colors.danger : '#636e72');
  noStroke();
  textSize(28);
  text('🔔', x, y);
  if (notifications.length > 0) {
    fill(colors.danger);
    circle(x + 22, y - 8, 22);
    fill('#ffffff');
    textSize(12);
    textStyle(BOLD);
    textAlign(CENTER);
    text(notifications.length, x + 22, y - 3);
    textAlign(LEFT);
    textStyle(NORMAL);
  }
}

function drawNotificationsPanel() {
  let x = 900;
  let y = 65;
  let w = 280;
  let h = 250;
  fill(0, 0, 0, 10);
  noStroke();
  rect(x + 3, y + 3, w, h, 8);
  fill(colors.card);
  stroke('#e0e0e0');
  strokeWeight(1);
  rect(x, y, w, h, 8);
  fill(colors.text);
  textSize(16);
  textStyle(BOLD);
  text('🔔 Уведомления', x + 15, y + 28);
  textStyle(NORMAL);
  if (notifications.length === 0) {
    fill('#636e72');
    textSize(13);
    text('Нет новых уведомлений', x + 15, y + 60);
  } else {
    for (let i = 0; i < min(notifications.length, 8); i++) {
      let ny = y + 50 + i * 23;
      let icon = notifications[i].type === 'overdue' ? '⏰' : '⚠️';
      fill(notifications[i].type === 'overdue' ? colors.danger : colors.warning);
      textSize(12);
      text(icon + ' ' + notifications[i].message, x + 15, ny + 10);
    }
    fill('#dfe6e9');
    rect(x + 15, y + h - 40, 250, 28, 6);
    fill(colors.text);
    textSize(12);
    textAlign(CENTER);
    text('Очистить все', x + 140, y + h - 22);
    textAlign(LEFT);
  }
}

function drawViewToggle() {
  let x = 30;
  let y = 95;
  let views = [
    { id: 'personal', label: '👤 Мои задачи', w: 140 },
    { id: 'team', label: '👥 Дашборд', w: 140 },
    { id: 'calendar', label: '📅 Календарь', w: 140 }
  ];
  for (let i = 0; i < views.length; i++) {
    let btnX = x + i * 150;
    fill(activeView === views[i].id ? colors.accent : '#dfe6e9');
    noStroke();
    rect(btnX, y, views[i].w, 34, 8);
    fill(activeView === views[i].id ? '#ffffff' : colors.text);
    textSize(14);
    textAlign(CENTER);
    text(views[i].label, btnX + views[i].w/2, y + 22);
    textAlign(LEFT);
  }
  let exportX = x + 3 * 150 + 20;
  fill(colors.ok);
  noStroke();
  rect(exportX, y, 140, 34, 8);
  fill('#ffffff');
  textSize(14);
  textAlign(CENTER);
  text('📥 Экспорт XLS', exportX + 70, y + 22);
  textAlign(LEFT);
}

function drawPersonalView() {
  drawManagerSelector();
  if (currentManager) {
    drawTaskBlock('Еженедельные задачи', currentManager.getWeeklyTasks(), 30, 180, colors.weekly);
    drawTaskBlock('Ежемесячные задачи', currentManager.getMonthlyTasks(), 380, 180, colors.monthly);
    drawTaskBlock('Разовые задачи', currentManager.getOnetimeTasks(), 730, 180, colors.onetime);
    drawCompletedBlock(currentManager.getCompletedTasks(), 30, 420);
    drawStats();
  }
  drawAddButton();
}

function drawManagerSelector() {
  let x = 30;
  let y = 140;
  fill('#636e72');
  textSize(14);
  text('Сотрудник:', x, y + 15);
  for (let i = 0; i < managers.length; i++) {
    let btnX = x + 100 + i * 200;
    let btnW = 185;
    let isActive = (managers[i] === currentManager);
    let isBoss = managers[i].name.includes('Руководитель');
    fill(isActive ? (isBoss ? colors.boss : colors.weekly) : '#dfe6e9');
    noStroke();
    rect(btnX, y, btnW, 30, 6);
    fill(isActive ? '#ffffff' : colors.text);
    textSize(11);
    textAlign(CENTER);
    let displayName = managers[i].name.split('(')[0].trim();
    text(displayName, btnX + btnW/2, y + 20);
    textAlign(LEFT);
  }
}

function drawTaskBlock(title, tasks, x, y, accentColor) {
  fill(accentColor);
  noStroke();
  rect(x, y, 340, 36, 8);
  fill('#ffffff');
  textSize(15);
  textStyle(BOLD);
  text(title, x + 15, y + 24);
  let activeTasks = tasks.filter(t => t.status !== 'done');
  textSize(12);
  textStyle(NORMAL);
  textAlign(RIGHT);
  text(activeTasks.length, x + 325, y + 24);
  textAlign(LEFT);
  fill(colors.card);
  stroke('#e0e0e0');
  strokeWeight(1);
  rect(x, y + 36, 340, 190, 0, 0, 8, 8);
  if (activeTasks.length === 0) {
    fill('#b2bec3');
    noStroke();
    textSize(13);
    text('Нет активных задач', x + 15, y + 65);
    return;
  }
  for (let i = 0; i < min(activeTasks.length, 5); i++) {
    let task = activeTasks[i];
    let ty = y + 50 + i * 36;
    if (isTaskOverdue(task)) {
      fill('#fff5f5');
      noStroke();
      rect(x + 2, ty - 2, 336, 34, 4);
    }
    fill('#ffffff');
    stroke('#b2bec3');
    strokeWeight(2);
    rect(x + 12, ty + 2, 18, 18, 4);
    noStroke();
    fill(isTaskOverdue(task) ? colors.danger : colors.text);
    textSize(12);
    text(task.title, x + 38, ty + 10);
    fill('#636e72');
    textSize(10);
    let assignee = task.assignee ? task.assignee.name.split('(')[0].trim() : 'Неназначена';
    text(task.hours + 'ч | ' + task.deadline + ' | ' + assignee, x + 38, ty + 26);
    let delX = x + 308;
    let delY = ty + 2;
    let delW = 22;
    let delH = 22;
    if (mouseX > delX && mouseX < delX + delW && mouseY > delY && mouseY < delY + delH) {
      fill('#c0392b');
    } else {
      fill('#e74c3c');
    }
    noStroke();
    rect(delX, delY, delW, delH, 4);
    fill('#ffffff');
    textSize(14);
    textAlign(CENTER);
    text('×', delX + delW/2, delY + 17);
    textAlign(LEFT);
    if (isTaskOverdue(task)) {
      fill(colors.danger);
      noStroke();
      circle(x + 325, ty + 8, 10);
      fill('#ffffff');
      textSize(7);
      textAlign(CENTER);
      text('!', x + 325, ty + 12);
      textAlign(LEFT);
    }
  }
}

function drawCompletedBlock(tasks, x, y) {
  let blockWidth = 1040;
  let blockHeight = 145;
  fill(colors.completed);
  noStroke();
  rect(x, y, blockWidth, 36, 8);
  fill('#ffffff');
  textSize(15);
  textStyle(BOLD);
  text('✅ Завершённые задачи', x + 15, y + 24);
  textSize(12);
  textStyle(NORMAL);
  textAlign(RIGHT);
  text(tasks.length, x + blockWidth - 25, y + 24);
  textAlign(LEFT);
  fill(colors.card);
  stroke('#e0e0e0');
  strokeWeight(1);
  rect(x, y + 36, blockWidth, blockHeight, 0, 0, 8, 8);
  if (tasks.length === 0) {
    fill('#b2bec3');
    noStroke();
    textSize(13);
    text('Нет завершённых задач', x + 15, y + 65);
    return;
  }
  let sortedTasks = tasks.slice().sort((a, b) => {
    if (!a.completedDate) return 1;
    if (!b.completedDate) return -1;
    return b.completedDate.localeCompare(a.completedDate);
  });
  let maxVisible = floor((blockHeight - 20) / 32);
  for (let i = 0; i < min(sortedTasks.length, maxVisible); i++) {
    let task = sortedTasks[i];
    let ty = y + 48 + i * 32;
    fill(colors.ok);
    noStroke();
    textSize(14);
    text('✓', x + 15, ty + 10);
    fill(colors.completed);
    textSize(12);
    textStyle(ITALIC);
    text(task.title, x + 35, ty + 10);
    textStyle(NORMAL);
    fill('#636e72');
    textSize(9);
    let assignee = task.assignee ? task.assignee.name.split('(')[0].trim() : '';
    let completedInfo = 'Выполнено: ' + (task.completedDate || 'неизвестно');
    text(task.hours + 'ч | ' + completedInfo + ' | ' + assignee, x + 35, ty + 24);
    let restoreX = x + 270;
    let restoreY = ty + 2;
    if (mouseX > restoreX && mouseX < restoreX + 40 && mouseY > restoreY && mouseY < restoreY + 22) {
      fill('#74b9ff');
    } else {
      fill('#dfe6e9');
    }
    noStroke();
    rect(restoreX, restoreY, 40, 22, 3);
    fill(colors.text);
    textSize(10);
    textAlign(CENTER);
    text('↩', restoreX + 20, restoreY + 16);
    textAlign(LEFT);
    let delX = x + 320;
    let delY = ty + 2;
    if (mouseX > delX && mouseX < delX + 28 && mouseY > delY && mouseY < delY + 22) {
      fill('#c0392b');
    } else {
      fill('#e74c3c');
    }
    noStroke();
    rect(delX, delY, 28, 22, 3);
    fill('#ffffff');
    textSize(12);
    textAlign(CENTER);
    text('×', delX + 14, delY + 17);
    textAlign(LEFT);
  }
}

function drawStats() {
  let x = 30;
  let y = 610;
  fill(colors.card);
  stroke('#e0e0e0');
  strokeWeight(1);
  rect(x, y, 1040, 75, 8);
  fill(colors.text);
  textSize(16);
  textStyle(BOLD);
  text('📊 Нагрузка: ' + currentManager.name.split('(')[0].trim(), x + 20, y + 28);
  textStyle(NORMAL);
  let weeklyHours = currentManager.getWeeklyHours();
  let monthlyHours = currentManager.getMonthlyHours();
  let weekColor = weeklyHours > 40 ? colors.danger : (weeklyHours > 35 ? colors.warning : colors.ok);
  drawProgressBar(x + 20, y + 40, 300, 'Неделя', weeklyHours, 40, weekColor);
  let monthColor = monthlyHours > 160 ? colors.danger : (monthlyHours > 140 ? colors.warning : colors.ok);
  drawProgressBar(x + 370, y + 40, 300, 'Месяц', monthlyHours, 160, monthColor);
  let onetimeHours = currentManager.getOnetimeHours();
  fill(colors.text);
  textSize(13);
  text('Разовые: ' + onetimeHours + 'ч', x + 720, y + 40);
  text('Свободно в неделе: ' + max(0, 40 - weeklyHours) + 'ч', x + 720, y + 60);
}

function drawProgressBar(x, y, w, label, current, max, color) {
  fill('#636e72');
  textSize(12);
  text(label + ': ' + current + ' / ' + max + 'ч', x, y - 5);
  fill('#dfe6e9');
  noStroke();
  rect(x, y + 8, w, 20, 10);
  let pct = min(current / max, 1);
  fill(color);
  rect(x, y + 8, w * pct, 20, 10);
}

function drawAddButton() {
  let x = 850;
  let y = 705;
  fill(showAddForm ? colors.danger : colors.weekly);
  noStroke();
  rect(x, y, 220, 44, 22);
  fill('#ffffff');
  textSize(16);
  textAlign(CENTER);
  text(showAddForm ? '✕ Отмена' : '+ Новая задача', x + 110, y + 29);
  textAlign(LEFT);
}

class Manager {
  constructor(name) {
    this.name = name;
    this.tasks = [];
  }
  addTask(task) {
    this.tasks.push(task);
    saveData();
    checkNotifications();
  }
  removeTask(task) {
    let index = this.tasks.indexOf(task);
    if (index > -1) {
      this.tasks.splice(index, 1);
      saveData();
      checkNotifications();
    }
  }
  getWeeklyTasks() {
    return this.tasks.filter(t => t.type === 'weekly');
  }
  getMonthlyTasks() {
    return this.tasks.filter(t => t.type === 'monthly');
  }
  getOnetimeTasks() {
    return this.tasks.filter(t => t.type === 'onetime');
  }
  getCompletedTasks() {
    return this.tasks.filter(t => t.status === 'done');
  }
  getWeeklyHours() {
    let weekly = this.tasks.filter(t => t.type === 'weekly' && t.status !== 'done');
    let monthly = this.tasks.filter(t => t.type === 'monthly' && t.status !== 'done');
    return weekly.reduce((sum, t) => sum + t.hours, 0) + monthly.reduce((sum, t) => sum + t.hours / 4, 0);
  }
  getMonthlyHours() {
    return this.tasks.filter(t => t.status !== 'done').reduce((sum, t) => sum + (t.type === 'weekly' ? t.hours * 4 : t.hours), 0);
  }
  getOnetimeHours() {
    return this.tasks.filter(t => t.type === 'onetime' && t.status !== 'done').reduce((sum, t) => sum + t.hours, 0);
  }
}

class Task {
  constructor(title, type, hours, deadline, assignee) {
    this.title = title;
    this.type = type;
    this.hours = hours;
    this.deadline = deadline;
    this.assignee = assignee;
    this.status = 'todo';
    this.completedDate = null;
  }
  complete() {
    this.status = 'done';
    let now = new Date();
    let day = String(now.getDate()).padStart(2, '0');
    let month = String(now.getMonth() + 1).padStart(2, '0');
    let year = now.getFullYear();
    this.completedDate = day + '.' + month + '.' + year;
  }
  reopen() {
    this.status = 'todo';
    this.completedDate = null;
  }
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function checkNotifications() {
  notifications = [];
  for (let m of managers) {
    let weeklyHours = m.getWeeklyHours();
    if (weeklyHours > 40) {
      notifications.push({ type: 'overload', message: m.name.split(' ')[0] + ': перегруз ' + weeklyHours.toFixed(1) + 'ч / 40ч' });
    }
    for (let t of m.tasks) {
      if (isTaskOverdue(t)) {
        notifications.push({ type: 'overdue', message: m.name.split(' ')[0] + ': просрочена «' + t.title + '»' });
      }
    }
  }
}

function isTaskOverdue(task) {
  if (task.status === 'done') return false;
  let dl = task.deadline.toLowerCase();
  let dateMatch = dl.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dateMatch) {
    let taskDate = dateMatch[1] + '.' + dateMatch[2] + '.' + dateMatch[3];
    return taskDate < currentDate;
  }
  return false;
}

function getDayTasks(manager, dayNum) {
  let tasks = [];
  for (let task of manager.tasks) {
    if (task.status === 'done') continue;
    let taskDay = null;
    let dl = task.deadline.toLowerCase();
    if (dl.includes('пн') || dl.includes('понед')) taskDay = 1;
    else if (dl.includes('вт') || dl.includes('втор')) taskDay = 2;
    else if (dl.includes('ср') || dl.includes('сред')) taskDay = 3;
    else if (dl.includes('чт') || dl.includes('четв')) taskDay = 4;
    else if (dl.includes('пт') || dl.includes('пятн')) taskDay = 5;
    else if (dl.includes('сб') || dl.includes('суб')) taskDay = 6;
    else if (dl.includes('вс') || dl.includes('воск')) taskDay = 7;
    else {
      if (task.type === 'monthly') {
        taskDay = ((task.title.length + task.hours) % 28) + 1;
      } else {
        taskDay = ((task.title.length * 3) % 28) + 1;
      }
    }
    if (taskDay === dayNum) tasks.push(task);
  }
  return tasks;
}

function getWeekHours(manager, weekNum) {
  let hours = 0;
  for (let d = 0; d < 7; d++) {
    let dayNum = weekNum * 7 + d + 1;
    let dayTasks = getDayTasks(manager, dayNum);
    hours += dayTasks.reduce((sum, t) => sum + t.hours, 0);
  }
  return hours;
}

function exportToXLS() {
  let xlsContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xlsContent += '<?mso-application progid="Excel.Sheet"?>\n';
  xlsContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xlsContent += '<Worksheet ss:Name="Сводка">\n<Table>\n';
  xlsContent += '<Row><Cell><Data ss:Type="String">Сотрудник</Data></Cell><Cell><Data ss:Type="String">Занято нед</Data></Cell><Cell><Data ss:Type="String">Своб нед</Data></Cell></Row>\n';
  for (let m of managers) {
    let wh = m.getWeeklyHours();
    xlsContent += '<Row><Cell><Data ss:Type="String">' + m.name + '</Data></Cell><Cell><Data ss:Type="Number">' + wh + '</Data></Cell><Cell><Data ss:Type="Number">' + max(0, 40 - wh) + '</Data></Cell></Row>\n';
  }
  xlsContent += '</Table>\n</Worksheet>\n</Workbook>';
  let blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = 'export.xls';
  a.click();
  URL.revokeObjectURL(url);
}

function updateAssigneeButtons() {
  let container = document.getElementById('assignee-btns');
  if (!container) return;
  container.innerHTML = '';
  for (let m of managers) {
    let btn = document.createElement('button');
    btn.className = 'assignee-btn';
    btn.textContent = m.name.split('(')[0].trim();
    btn.onclick = function() {
      newTaskAssignee = m;
      let buttons = container.getElementsByClassName('assignee-btn');
      for (let b of buttons) b.classList.remove('active');
      btn.classList.add('active');
    };
    if (m === newTaskAssignee) btn.classList.add('active');
    container.appendChild(btn);
  }
}

function setType(type) {
  newTaskType = type;
  let buttons = document.getElementsByClassName('type-btn');
  for (let btn of buttons) {
    btn.classList.remove('active');
    if (btn.classList.contains(type)) btn.classList.add('active');
  }
}

function saveTask() {
  let title = document.getElementById('task-title').value;
  let hours = parseInt(document.getElementById('task-hours').value);
  let deadline = document.getElementById('task-deadline').value;
  if (title && hours && deadline && newTaskAssignee) {
    let task = new Task(title, newTaskType, hours, deadline, newTaskAssignee);
    newTaskAssignee.addTask(task);
    document.getElementById('task-title').value = '';
    document.getElementById('task-hours').value = '';
    document.getElementById('task-deadline').value = '';
    hideForm();
  }
}

function showForm() {
  showAddForm = true;
  newTaskAssignee = currentManager;
  document.getElementById('add-form').classList.add('visible');
  setType('weekly');
  updateAssigneeButtons();
}

function hideForm() {
  showAddForm = false;
  document.getElementById('add-form').classList.remove('visible');
  document.getElementById('task-title').value = '';
  document.getElementById('task-hours').value = '';
  document.getElementById('task-deadline').value = '';
}

function mousePressed() {
  if (mouseX > 1090 && mouseX < 1130 && mouseY > 5 && mouseY < 45) { showNotifications = !showNotifications; return; }
  if (showNotifications) {
    if (mouseX < 900 || mouseX > 1180 || mouseY < 65 || mouseY > 315) showNotifications = false;
    if (mouseX > 915 && mouseX < 1165 && mouseY > 275 && mouseY < 303) { notifications = []; showNotifications = false; }
    return;
  }
  if (mouseY > 95 && mouseY < 129 && mouseX > 500 && mouseX < 640) { exportToXLS(); return; }
  if (mouseY > 95 && mouseY < 129) {
    if (mouseX > 30 && mouseX < 170) { activeView = 'personal'; hideForm(); return; }
    if (mouseX > 180 && mouseX < 320) { activeView = 'team'; hideForm(); return; }
    if (mouseX > 330 && mouseX < 470) { activeView = 'calendar'; hideForm(); return; }
  }
  if (activeView === 'calendar') {
    for (let i = 0; i < managers.length; i++) {
      if (mouseX > 380 + i * 200 && mouseX < 560 + i * 200 && mouseY > 138 && mouseY < 166) calendarManager = managers[i];
    }
    return;
  }
  if (activeView === 'team') return;
  for (let i = 0; i < managers.length; i++) {
    if (mouseX > 130 + i * 200 && mouseX < 315 + i * 200 && mouseY > 140 && mouseY < 170) { currentManager = managers[i]; hideForm(); }
  }
  if (mouseX > 850 && mouseX < 1070 && mouseY > 705 && mouseY < 749) { showAddForm ? hideForm() : showForm(); return; }
  if (currentManager && !showAddForm) {
    let blocks = [
      { tasks: currentManager.getWeeklyTasks(), x: 30, y: 216 },
      { tasks: currentManager.getMonthlyTasks(), x: 380, y: 216 },
      { tasks: currentManager.getOnetimeTasks(), x: 730, y: 216 }
    ];
    for (let block of blocks) {
      let activeTasks = block.tasks.filter(t => t.status !== 'done');
      for (let i = 0; i < activeTasks.length; i++) {
        let task = activeTasks[i];
        let ty = block.y + 50 + i * 36;
        if (mouseX > block.x + 12 && mouseX < block.x + 30 && mouseY > ty + 2 && mouseY < ty + 20) { task.complete(); saveData(); checkNotifications(); return; }
        if (mouseX > block.x + 308 && mouseX < block.x + 330 && mouseY > ty + 2 && mouseY < ty + 24) { currentManager.removeTask(task); return; }
      }
    }
    let completedTasks = currentManager.getCompletedTasks().slice().sort((a, b) => {
      if (!a.completedDate) return 1;
      if (!b.completedDate) return -1;
      return b.completedDate.localeCompare(a.completedDate);
    });
    for (let i = 0; i < completedTasks.length; i++) {
      let task = completedTasks[i];
      let ty = 420 + 48 + i * 32;
      if (mouseX > 300 && mouseX < 340 && mouseY > ty + 2 && mouseY < ty + 24) { task.reopen(); saveData(); checkNotifications(); return; }
      if (mouseX > 350 && mouseX < 378 && mouseY > ty + 2 && mouseY < ty + 24) { currentManager.removeTask(task); return; }
    }
  }
}

function saveData() {
  let data = managers.map(m => ({
    name: m.name,
    tasks: m.tasks.map(t => ({
      title: t.title, type: t.type, hours: t.hours, deadline: t.deadline,
      status: t.status, completedDate: t.completedDate,
      assigneeName: t.assignee ? t.assignee.name : null
    }))
  }));
  localStorage.setItem('taskManagerData', JSON.stringify(data));
}

function loadData() {
  let saved = localStorage.getItem('taskManagerData');
  if (saved) {
    let data = JSON.parse(saved);
    managers = [];
    let managerMap = {};
    for (let m of data.managers) {
      let manager = new Manager(m.name);
      managerMap[m.name] = manager;
      managers.push(manager);
    }
    for (let m of data.managers) {
      let manager = managerMap[m.name];
      for (let t of m.tasks) {
        let assignee = t.assigneeName ? managerMap[t.assigneeName] : manager;
        let task = new Task(t.title, t.type, t.hours, t.deadline, assignee);
        task.status = t.status;
        task.completedDate = t.completedDate || null;
        manager.tasks.push(task);
      }
    }
    checkNotifications();
  }
}

function createTestData() {
  localStorage.removeItem('taskManagerData');
  managers = [];
  let alexandra = new Manager('Александра Пименова (Руководитель)');
  let vera = new Manager('Вера Гусева (Менеджер)');
  let varvara = new Manager('Варвара Андреева (Менеджер)');
  managers.push(alexandra, vera, varvara);
  alexandra.addTask(new Task('Стратегическое планирование', 'weekly', 4, 'ПН', alexandra));
  alexandra.addTask(new Task('Совещание с командой', 'weekly', 2, 'СР', alexandra));
  vera.addTask(new Task('Отчёт по продажам', 'weekly', 3, 'ПН', vera));
  vera.addTask(new Task('Подготовка презентации', 'onetime', 6, '28.06.2026', vera));
  varvara.addTask(new Task('Анализ рынка', 'weekly', 4, 'ПН', varvara));
  varvara.addTask(new Task('Обновление базы данных', 'onetime', 8, '27.06.2026', varvara));
  saveData();
  checkNotifications();
}
