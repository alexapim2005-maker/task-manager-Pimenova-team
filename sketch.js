// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
let managers = [];
let currentManager = null;
let managerNames = ['Анна', 'Борис', 'Виктория', 'Дмитрий', 'Елена']; // ЗАМЕНИ НА СВОИХ!
let showAddForm = false;
let newTaskType = 'weekly';
let newTaskAssignee = null;
let activeView = 'personal';
let calendarManager = null;
let notifications = [];
let showNotifications = false;
let currentDate = '25.06.2026';

// === ЦВЕТОВАЯ СХЕМА ===
let colors = {
  bg: '#f5f6fa',
  card: '#ffffff',
  weekly: '#6c5ce7',
  monthly: '#e17055',
  onetime: '#00b894',
  done: '#b2bec3',
  text: '#2d3436',
  danger: '#d63031',
  warning: '#fdcb6e',
  ok: '#00b894',
  accent: '#0984e3',
  lightWeekly: '#a29bfe',
  lightMonthly: '#fab1a0',
  lightOnetime: '#55efc4'
};

function setup() {
  let canvas = createCanvas(1200, 850);
  canvas.parent('app-container');
  textFont('Arial');
  
  loadData();
  
  if (managers.length === 0) {
    createTestData();
  }
  
  currentManager = managers[0];
  calendarManager = managers[0];
  newTaskAssignee = currentManager;
  
  // Создаём кнопки ответственных
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

// === ИНТЕРФЕЙС: ШАПКА ===
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

// === ЛИЧНЫЙ ВИД ===
function drawPersonalView() {
  drawManagerSelector();
  
  if (currentManager) {
    drawTaskBlock('Еженедельные задачи', currentManager.getWeeklyTasks(), 30, 180, colors.weekly);
    drawTaskBlock('Ежемесячные задачи', currentManager.getMonthlyTasks(), 380, 180, colors.monthly);
    drawTaskBlock('Разовые задачи', currentManager.getOnetimeTasks(), 730, 180, colors.onetime);
    drawStats();
  }
  
  drawAddButton();
}

function drawManagerSelector() {
  let x = 30;
  let y = 140;
  
  fill('#636e72');
  textSize(14);
  text('Менеджер:', x, y + 15);
  
  for (let i = 0; i < managers.length; i++) {
    let btnX = x + 90 + i * 90;
    let btnW = 80;
    let isActive = (managers[i] === currentManager);
    
    fill(isActive ? colors.weekly : '#dfe6e9');
    noStroke();
    rect(btnX, y, btnW, 30, 6);
    
    fill(isActive ? '#ffffff' : colors.text);
    textSize(13);
    textAlign(CENTER);
    text(managers[i].name, btnX + btnW/2, y + 20);
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
  
  let doneCount = tasks.filter(t => t.status === 'done').length;
  textSize(12);
  textStyle(NORMAL);
  textAlign(RIGHT);
  text(doneCount + '/' + tasks.length, x + 325, y + 24);
  textAlign(LEFT);
  
  fill(colors.card);
  stroke('#e0e0e0');
  strokeWeight(1);
  rect(x, y + 36, 340, 250, 0, 0, 8, 8);
  
  if (tasks.length === 0) {
    fill('#b2bec3');
    noStroke();
    textSize(13);
    text('Нет задач', x + 15, y + 70);
    return;
  }
  
  for (let i = 0; i < min(tasks.length, 6); i++) {
    let task = tasks[i];
    let ty = y + 50 + i * 38;
    
    if (isTaskOverdue(task)) {
      fill('#fff5f5');
      noStroke();
      rect(x + 2, ty - 2, 336, 34, 4);
    } else if (mouseX > x && mouseX < x + 340 && mouseY > ty && mouseY < ty + 35) {
      fill('#f8f9fa');
      noStroke();
      rect(x + 2, ty - 2, 336, 34, 4);
    }
    
    let isDone = task.status === 'done';
    fill(isDone ? colors.done : '#ffffff');
    stroke(isDone ? colors.done : '#b2bec3');
    strokeWeight(2);
    rect(x + 12, ty, 18, 18, 4);
    
    if (isDone) {
      stroke('#ffffff');
      strokeWeight(2);
      line(x + 15, ty + 9, x + 19, ty + 13);
      line(x + 19, ty + 13, x + 26, ty + 4);
    }
    
    if (isTaskOverdue(task)) {
      fill(colors.danger);
      noStroke();
      circle(x + 325, ty + 9, 12);
      fill('#ffffff');
      textSize(8);
      textAlign(CENTER);
      text('!', x + 325, ty + 13);
      textAlign(LEFT);
    }
    
    noStroke();
    fill(isDone ? colors.done : (isTaskOverdue(task) ? colors.danger : colors.text));
    textSize(13);
    textStyle(task.status === 'done' ? ITALIC : NORMAL);
    text(task.title, x + 38, ty + 14);
    textStyle(NORMAL);
    
    fill(isDone ? colors.done : '#636e72');
    textSize(11);
    let assignee = task.assignee ? task.assignee.name : 'Неназначена';
    text(task.hours + 'ч | ' + task.deadline + ' | ' + assignee, x + 38, ty + 30);
    
    if (mouseX > x + 300 && mouseX < x + 325 && mouseY > ty && mouseY < ty + 18) {
      fill('#ff7675');
      noStroke();
      rect(x + 300, ty, 20, 18, 4);
      fill('#ffffff');
      textSize(14);
      text('×', x + 306, ty + 14);
    }
  }
}

function drawStats() {
  let x = 30;
  let y = 500;
  
  fill(colors.card);
  stroke('#e0e0e0');
  strokeWeight(1);
  rect(x, y, 1040, 120, 8);
  
  fill(colors.text);
  textSize(18);
  textStyle(BOLD);
  text('📊 Нагрузка: ' + currentManager.name, x + 20, y + 30);
  textStyle(NORMAL);
  
  let weeklyHours = currentManager.getWeeklyHours();
  let monthlyHours = currentManager.getMonthlyHours();
  
  let weekColor = weeklyHours > 40 ? colors.danger : (weeklyHours > 35 ? colors.warning : colors.ok);
  drawProgressBar(x + 20, y + 50, 300, 'Неделя', weeklyHours, 40, weekColor);
  
  let monthColor = monthlyHours > 160 ? colors.danger : (monthlyHours > 140 ? colors.warning : colors.ok);
  drawProgressBar(x + 370, y + 50, 300, 'Месяц', monthlyHours, 160, monthColor);
  
  let onetimeHours = currentManager.getOnetimeHours();
  fill(colors.text);
  textSize(14);
  text('Разовые задачи: ' + onetimeHours + ' часов', x + 720, y + 50);
  text('Свободно в неделе: ' + max(0, 40 - weeklyHours) + ' часов', x + 720, y + 75);
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
  let y = 640;
  
  fill(showAddForm ? colors.danger : colors.weekly);
  noStroke();
  rect(x, y, 220, 44, 22);
  
  fill('#ffffff');
  textSize(16);
  textAlign(CENTER);
  text(showAddForm ? '✕ Отмена' : '+ Новая задача', x + 110, y + 29);
  textAlign(LEFT);
}

// === ДАШБОРД КОМАНДЫ ===
function drawTeamDashboard() {
  let x = 30;
  let y = 150;
  
  fill(colors.text);
  textSize(20);
  textStyle(BOLD);
  text('📊 Сводка по команде', x, y);
  textStyle(NORMAL);
  
  y += 20;
  
  let colWidths = [200, 250, 120, 120, 120, 120, 120];
  let headers = ['Менеджер', 'Задачи (активные)', 'Занято нед.', 'Своб. нед.', 'Занято мес.', 'Своб. мес.', 'Загрузка'];
  
  fill(colors.accent);
  noStroke();
  rect(x, y, sum(colWidths), 36, 8);
  
  fill('#ffffff');
  textSize(12);
  textStyle(BOLD);
  let hx = x + 10;
  for (let i = 0; i < headers.length; i++) {
    text(headers[i], hx, y + 23);
    hx += colWidths[i];
  }
  textStyle(NORMAL);
  
  y += 40;
  
  for (let i = 0; i < managers.length; i++) {
    let m = managers[i];
    let weeklyHours = m.getWeeklyHours();
    let monthlyHours = m.getMonthlyHours();
    let freeWeekly = max(0, 40 - weeklyHours);
    let freeMonthly = max(0, 160 - monthlyHours);
    let loadPct = (weeklyHours / 40) * 100;
    let loadColor = loadPct > 100 ? colors.danger : (loadPct > 80 ? colors.warning : colors.ok);
    
    fill(i % 2 === 0 ? '#ffffff' : '#f8f9fa');
    stroke('#e0e0e0');
    strokeWeight(1);
    rect(x, y, sum(colWidths), 50);
    
    noStroke();
    
    fill(colors.text);
    textSize(14);
    textStyle(BOLD);
    text(m.name, x + 10, y + 20);
    textStyle(NORMAL);
    
    let activeTasks = m.tasks.filter(t => t.status !== 'done');
    let taskList = activeTasks.slice(0, 3).map(t => t.title).join(', ');
    if (activeTasks.length > 3) taskList += '...';
    fill('#636e72');
    textSize(11);
    text(taskList || 'Нет задач', x + 10, y + 40);
    
    fill(weeklyHours > 40 ? colors.danger : colors.text);
    textSize(14);
    textAlign(CENTER);
    text(weeklyHours.toFixed(1) + 'ч', x + colWidths[0] + colWidths[1] + 60, y + 30);
    
    fill(freeWeekly > 0 ? colors.ok : '#636e72');
    text(freeWeekly.toFixed(1) + 'ч', x + colWidths[0] + colWidths[1] + colWidths[2] + 60, y + 30);
    
    fill(monthlyHours > 160 ? colors.danger : colors.text);
    text(monthlyHours.toFixed(1) + 'ч', x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 60, y + 30);
    
    fill(freeMonthly > 0 ? colors.ok : '#636e72');
    text(freeMonthly.toFixed(1) + 'ч', x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 60, y + 30);
    
    let barX = x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 10;
    let barY = y + 10;
    let barW = colWidths[5] - 20;
    
    fill('#dfe6e9');
    rect(barX, barY, barW, 12, 6);
    
    let barFill = min(loadPct / 100, 1.5);
    if (barFill > 1) {
      fill(colors.danger);
      rect(barX, barY, barW, 12, 6);
      fill('#ffffff');
      for (let stripe = 0; stripe < barW; stripe += 6) {
        rect(barX + stripe, barY, 3, 12);
      }
    } else {
      fill(loadColor);
      rect(barX, barY, barW * barFill, 12, 6);
    }
    
    fill(colors.text);
    textSize(11);
    textAlign(CENTER);
    text(loadPct.toFixed(0) + '%', barX + barW/2, barY + 35);
    textAlign(LEFT);
    
    y += 54;
  }
  
  y += 10;
  fill(colors.accent);
  noStroke();
  rect(x, y, sum(colWidths), 36, 8);
  
  let teamWeekly = managers.reduce((sum, m) => sum + m.getWeeklyHours(), 0);
  let teamMonthly = managers.reduce((sum, m) => sum + m.getMonthlyHours(), 0);
  let teamFreeWeekly = managers.length * 40 - teamWeekly;
  let teamFreeMonthly = managers.length * 160 - teamMonthly;
  
  fill('#ffffff');
  textSize(13);
  textStyle(BOLD);
  text('ИТОГО ПО КОМАНДЕ', x + 10, y + 24);
  
  textAlign(CENTER);
  text(teamWeekly.toFixed(1) + 'ч', x + colWidths[0] + colWidths[1] + 60, y + 24);
  text(teamFreeWeekly.toFixed(1) + 'ч', x + colWidths[0] + colWidths[1] + colWidths[2] + 60, y + 24);
  text(teamMonthly.toFixed(1) + 'ч', x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 60, y + 24);
  text(teamFreeMonthly.toFixed(1) + 'ч', x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 60, y + 24);
  textAlign(LEFT);
  textStyle(NORMAL);
}

// === КАЛЕНДАРЬ ===
function drawCalendarView() {
  let x = 30;
  let y = 150;
  
  fill(colors.text);
  textSize(20);
  textStyle(BOLD);
  text('📅 Календарь загрузки', x, y);
  
  fill('#636e72');
  textSize(14);
  textStyle(NORMAL);
  text('Сотрудник:', x + 250, y);
  
  for (let i = 0; i < managers.length; i++) {
    let btnX = x + 350 + i * 100;
    fill(calendarManager === managers[i] ? colors.accent : '#dfe6e9');
    noStroke();
    rect(btnX, y - 12, 90, 28, 4);
    fill(calendarManager === managers[i] ? '#ffffff' : colors.text);
    textSize(12);
    textAlign(CENTER);
    text(managers[i].name, btnX + 45, y + 7);
    textAlign(LEFT);
  }
  
  y += 40;
  let legendItems = [
    { color: colors.weekly, label: 'Еженедельные' },
    { color: colors.monthly, label: 'Ежемесячные' },
    { color: colors.onetime, label: 'Разовые' }
  ];
  
  for (let i = 0; i < legendItems.length; i++) {
    fill(legendItems[i].color);
    noStroke();
    rect(x + i * 170, y, 14, 14, 3);
    fill(colors.text);
    textSize(12);
    text(legendItems[i].label, x + 20 + i * 170, y + 12);
  }
  
  y += 30;
  let dayNames = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
  let cellW = 155;
  let cellH = 130;
  let startX = x;
  
  for (let d = 0; d < 7; d++) {
    fill(colors.accent);
    noStroke();
    rect(startX + d * cellW + d * 5, y, cellW, 28, 4);
    fill('#ffffff');
    textSize(13);
    textStyle(BOLD);
    textAlign(CENTER);
    text(dayNames[d], startX + d * cellW + d * 5 + cellW/2, y + 19);
    textAlign(LEFT);
    textStyle(NORMAL);
  }
  
  y += 32;
  
  for (let w = 0; w < 4; w++) {
    for (let d = 0; d < 7; d++) {
      let cx = startX + d * cellW + d * 5;
      let cy = y + w * cellH + w * 5;
      let dayNum = w * 7 + d + 1;
      
      fill('#ffffff');
      stroke('#e0e0e0');
      strokeWeight(1);
      rect(cx, cy, cellW, cellH, 6);
      
      noStroke();
      fill(colors.text);
      textSize(12);
      textStyle(BOLD);
      text(dayNum, cx + 10, cy + 18);
      textStyle(NORMAL);
      
      let dayTasks = getDayTasks(calendarManager, dayNum);
      let taskY = cy + 28;
      
      for (let t = 0; t < min(dayTasks.length, 4); t++) {
        let task = dayTasks[t];
        let taskColor;
        if (task.type === 'weekly') taskColor = colors.lightWeekly;
        else if (task.type === 'monthly') taskColor = colors.lightMonthly;
        else taskColor = colors.lightOnetime;
        
        if (isTaskOverdue(task)) {
          taskColor = colors.danger;
        }
        
        fill(taskColor);
        noStroke();
        rect(cx + 8, taskY, cellW - 16, 18, 3);
        
        fill(colors.text);
        textSize(10);
        let taskTitle = task.title.length > 14 ? task.title.substring(0, 13) + '…' : task.title;
        text(taskTitle, cx + 12, taskY + 13);
        
        textAlign(RIGHT);
        text(task.hours + 'ч', cx + cellW - 12, taskY + 13);
        textAlign(LEFT);
        
        taskY += 22;
      }
      
      if (dayTasks.length > 4) {
        fill('#636e72');
        textSize(10);
        text('+' + (dayTasks.length - 4) + ' ещё...', cx + 8, taskY);
      }
    }
  }
  
  y = 150 + 40 + 30 + 32 + 4 * (cellH + 5) + 15;
  
  fill(colors.text);
  textSize(16);
  textStyle(BOLD);
  text('📊 Сводка по неделям', x, y);
  textStyle(NORMAL);
  
  y += 20;
  
  for (let w = 0; w < 4; w++) {
    let wx = x + w * 280;
    let weekHours = getWeekHours(calendarManager, w);
    let weekColor = weekHours > 40 ? colors.danger : (weekHours > 35 ? colors.warning : colors.ok);
    
    fill(colors.card);
    stroke('#e0e0e0');
    strokeWeight(1);
    rect(wx, y, 270, 50, 8);
    
    fill(colors.text);
    textSize(13);
    textStyle(BOLD);
    text('Неделя ' + (w + 1) + ': ' + weekHours + ' / 40 часов', wx + 15, y + 20);
    textStyle(NORMAL);
    
    fill('#dfe6e9');
    noStroke();
    rect(wx + 15, y + 28, 240, 12, 6);
    
    let pct = min(weekHours / 40, 1.5);
    if (pct > 1) {
      fill(colors.danger);
      rect(wx + 15, y + 28, 240, 12, 6);
    } else {
      fill(weekColor);
      rect(wx + 15, y + 28, 240 * pct, 12, 6);
    }
  }
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
    
    if (taskDay === dayNum) {
      tasks.push(task);
    }
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

function isTaskOverdue(task) {
  if (task.status === 'done') return false;
  
  let dl = task.deadline.toLowerCase();
 
