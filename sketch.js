// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
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

// === ЦВЕТОВАЯ СХЕМА ===
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
    // Три блока задач (теперь по 180px высотой, чтобы освободить место)
    drawTaskBlock('Еженедельные задачи', currentManager.getWeeklyTasks(), 30, 180, colors.weekly, 180);
    drawTaskBlock('Ежемесячные задачи', currentManager.getMonthlyTasks(), 380, 180, colors.monthly, 180);
    drawTaskBlock('Разовые задачи', currentManager.getOnetimeTasks(), 730, 180, colors.onetime, 180);
    
    // Блок завершённых задач
    drawCompletedBlock(currentManager.getCompletedTasks(), 30, 400);
    
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
    if (isBoss) displayName = '👑 ' + displayName;
    text(displayName, btnX + btnW/2, y + 20);
    textAlign(LEFT);
  }
}

function drawTaskBlock(title, tasks, x, y, accentColor, blockHeight) {
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
  rect(x, y + 36, 340, blockHeight, 0, 0, 8, 8);
  
  if (activeTasks.length === 0) {
    fill('#b2bec3');
    noStroke();
    textSize(13);
    text('Нет активных задач', x + 15, y + 65);
    return;
  }
  
  let maxVisible = floor((blockHeight - 20) / 38);
  
  for (let i = 0; i < min(activeTasks.length, maxVisible); i++) {
    let task = activeTasks[i];
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
    
    // Чекбокс
    fill('#ffffff');
    stroke('#b2bec3');
    strokeWeight(2);
    rect(x + 12, ty, 18, 18, 4);
    
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
    fill(isTaskOverdue(task) ? colors.danger : colors.text);
    textSize(13);
    text(task.title, x + 38, ty + 14);
    
    fill('#636e72');
    textSize(11);
    let assignee = task.assignee ? task.assignee.name.split('(')[0].trim() : 'Неназначена';
    text(task.hours + 'ч | ' + task.deadline + ' | ' + assignee, x + 38, ty + 30);
    
    // Кнопка удаления (всегда видна)
    fill('#ff7675');
    noStroke();
    rect(x + 300, ty + 8, 22, 18, 3);
    fill('#ffffff');
    textSize(12);
    textAlign(CENTER);
    text('🗑', x + 311, ty + 23);
    textAlign(LEFT);
  }
}

function drawCompletedBlock(tasks, x, y) {
  let blockWidth = 1040;
  let blockHeight = 140;
  
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
  
  // Сортируем по дате выполнения (новые сверху)
  let sortedTasks = tasks.slice().sort((a, b) => {
    if (!a.completedDate) return 1;
    if (!b.completedDate) return -1;
    return b.completedDate.localeCompare(a.completedDate);
  });
  
  let maxVisible = floor((blockHeight - 20) / 30);
  
  for (let i = 0; i < min(sortedTasks.length, maxVisible); i++) {
    let task = sortedTasks[i];
    let ty = y + 48 + i * 30;
    
    // Иконка выполненной задачи
    fill(colors.ok);
    noStroke();
    textSize(14);
    text('✓', x + 15, ty + 12);
    
    // Название задачи (зачёркнуто)
    fill(colors.completed);
    textSize(13);
    textStyle(ITALIC);
    text(task.title, x + 35, ty + 12);
    textStyle(NORMAL);
    
    // Информация
    fill('#636e72');
    textSize(10);
    let assignee = task.assignee ? task.assignee.name.split('(')[0].trim() : '';
    let completedInfo = 'Выполнено: ' + (task.completedDate || 'неизвестно');
    text(task.hours + 'ч | ' + completedInfo + ' | ' + assignee, x + 35, ty + 26);
    
    // Кнопка восстановления
    if (mouseX > x + 280 && mouseX < x + 320 && mouseY > ty - 2 && mouseY < ty + 20) {
      fill('#dfe6e9');
      noStroke();
      rect(x + 280, ty - 2, 40, 22, 3);
      fill(colors.text);
      textSize(10);
      textAlign(CENTER);
      text('↩', x + 300, ty + 14);
      textAlign(LEFT);
    }
    
    // Кнопка удаления
    fill('#ff7675');
    noStroke();
    rect(x + 330, ty + 2, 22, 16, 3);
    fill('#ffffff');
    textSize(10);
    textAlign(CENTER);
    text('🗑', x + 341, ty + 15);
    textAlign(LEFT);
  }
}

function drawStats() {
  let x = 30;
  let y = 580;
  
  fill(colors.card);
  stroke('#e0e0e0');
  strokeWeight(1);
  rect(x, y, 1040, 100, 8);
  
  fill(colors.text);
  textSize(16);
  textStyle(BOLD);
  text('📊 Нагрузка: ' + currentManager.name.split('(')[0].trim(), x + 20, y + 28);
  textStyle(NORMAL);
  
  let weeklyHours = currentManager.getWeeklyHours();
  let monthlyHours = currentManager.getMonthlyHours();
  
  let weekColor = weeklyHours > 40 ? colors.danger : (weeklyHours > 35 ? colors.warning : colors.ok);
  drawProgressBar(x + 20, y + 42, 300, 'Неделя', weeklyHours, 40, weekColor);
  
  let monthColor = monthlyHours > 160 ? colors.danger : (monthlyHours > 140 ? colors.warning : colors.ok);
  drawProgressBar(x + 370, y + 42, 300, 'Месяц', monthlyHours, 160, monthColor);
  
  let onetimeHours = currentManager.getOnetimeHours();
  fill(colors.text);
  textSize(13);
  text('Разовые задачи: ' + onetimeHours + ' часов', x + 720, y + 42);
  text('Свободно в неделе: ' + max(0, 40 - weeklyHours) + ' часов', x + 720, y + 65);
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
  let y = 700;
  
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
  
  let colWidths = [250, 200, 120, 120, 120, 120, 120];
  let headers = ['Сотрудник', 'Задачи', 'Занято нед.', 'Своб. нед.', 'Занято мес.', 'Своб. мес.', 'Загрузка'];
  
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
    let isBoss = m.name.includes('Руководитель');
    
    let activeCount = m.tasks.filter(t => t.status !== 'done').length;
    let completedCount = m.tasks.filter(t => t.status === 'done').length;
    
    fill(i % 2 === 0 ? '#ffffff' : '#f8f9fa');
    stroke('#e0e0e0');
    strokeWeight(1);
    rect(x, y, sum(colWidths), 50);
    
    noStroke();
    
    fill(colors.text);
    textSize(14);
    textStyle(BOLD);
    text((isBoss ? '👑 ' : '') + m.name, x + 10, y + 20);
    textStyle(NORMAL);
    
    fill('#636e72');
    textSize(11);
    text('Активных: ' + activeCount + ' | Завершено: ' + completedCount, x + 10, y + 40);
    
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
    let btnX = x + 350 + i * 200;
    fill(calendarManager === managers[i] ? colors.accent : '#dfe6e9');
    noStroke();
    rect(btnX, y - 12, 180, 28, 4);
    fill(calendarManager === managers[i] ? '#ffffff' : colors.text);
    textSize(11);
    textAlign(CENTER);
    text(managers[i].name.split('(')[0].trim(), btnX + 90, y + 7);
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
  
  let dateMatch = dl.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dateMatch) {
    let taskDate = dateMatch[1] + '.' + dateMatch[2] + '.' + dateMatch[3];
    return taskDate < currentDate;
  }
  return false;
}

// === КЛАССЫ ===

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
    return weekly.reduce((sum, t) => sum + t.hours, 0) + 
           monthly.reduce((sum, t) => sum + t.hours / 4, 0);
  }
  
  getMonthlyHours() {
    return this.tasks.filter(t => t.status !== 'done')
      .reduce((sum, t) => sum + (t.type === 'weekly' ? t.hours * 4 : t.hours), 0);
  }
  
  getOnetimeHours() {
    return this.tasks.filter(t => t.type === 'onetime' && t.status !== 'done')
      .reduce((sum, t) => sum + t.hours, 0);
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
    // Формируем дату выполнения
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

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function checkNotifications() {
  notifications = [];
  
  for (let m of managers) {
    let weeklyHours = m.getWeeklyHours();
    if (weeklyHours > 40) {
      notifications.push({
        type: 'overload',
        message: m.name.split(' ')[0] + ': перегруз ' + weeklyHours.toFixed(1) + 'ч / 40ч'
      });
    }
    
    for (let t of m.tasks) {
      if (isTaskOverdue(t)) {
        notifications.push({
          type: 'overdue',
          message: m.name.split(' ')[0] + ': просрочена «' + t.title + '»'
        });
      }
    }
  }
}

// === ЭКСПОРТ В EXCEL ===

function exportToXLS() {
  let xlsContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xlsContent += '<?mso-application progid="Excel.Sheet"?>\n';
  xlsContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xlsContent += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  
  xlsContent += '<Styles>\n';
  xlsContent += '<Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#0984e3" ss:Pattern="Solid"/></Style>\n';
  xlsContent += '<Style ss:ID="overload"><Interior ss:Color="#ff7675" ss:Pattern="Solid"/></Style>\n';
  xlsContent += '<Style ss:ID="completed"><Interior ss:Color="#b2bec3" ss:Pattern="Solid"/></Style>\n';
  xlsContent += '</Styles>\n';
  
  xlsContent += '<Worksheet ss:Name="Сводка по команде">\n<Table>\n';
  xlsContent += '<Row ss:StyleID="header">';
  ['Сотрудник', 'Занято нед.', 'Своб. нед.', 'Занято мес.', 'Своб. мес.', 'Загрузка %', 'Активные', 'Завершено'].forEach(h => {
    xlsContent += '<Cell><Data ss:Type="String">' + h + '</Data></Cell>';
  });
  xlsContent += '</Row>\n';
  
  for (let m of managers) {
    let weeklyHours = m.getWeeklyHours();
    let monthlyHours = m.getMonthlyHours();
    let loadPct = ((weeklyHours / 40) * 100).toFixed(1);
    let activeTasks = m.tasks.filter(t => t.status !== 'done').length;
    let completedTasks = m.tasks.filter(t => t.status === 'done').length;
    let isOverload = weeklyHours > 40;
    
    xlsContent += '<Row' + (isOverload ? ' ss:StyleID="overload"' : '') + '>';
    xlsContent += '<Cell><Data ss:Type="String">' + m.name + '</Data></Cell>';
    xlsContent += '<Cell><Data ss:Type="Number">' + weeklyHours.toFixed(1) + '</Data></Cell>';
    xlsContent += '<Cell><Data ss:Type="Number">' + max(0, 40 - weeklyHours).toFixed(1) + '</Data></Cell>';
    xlsContent += '<Cell><Data ss:Type="Number">' + monthlyHours.toFixed(1) + '</Data></Cell>';
    xlsContent += '<Cell><Data ss:Type="Number">' + max(0, 160 - monthlyHours).toFixed(1) + '</Data></Cell>';
    xlsContent += '<Cell><Data ss:Type="Number">' + loadPct + '</Data></Cell>';
    xlsContent += '<Cell><Data ss:Type="Number">' + activeTasks + '</Data></Cell>';
    xlsContent += '<Cell><Data ss:Type="Number">' + completedTasks + '</Data></Cell>';
    xlsContent += '</Row>\n';
  }
  
  xlsContent += '</Table>\n</Worksheet>\n';
  
  xlsContent += '<Worksheet ss:Name="Все задачи">\n<Table>\n';
  xlsContent += '<Row ss:StyleID="header">';
  ['Сотрудник', 'Задача', 'Тип', 'Часы', 'Дедлайн', 'Статус', 'Дата выполнения', 'Ответственный'].forEach(h => {
    xlsContent += '<Cell><Data ss:Type="String">' + h + '</Data></Cell>';
  });
  xlsContent += '</Row>\n';
  
  for (let m of managers) {
    for (let t of m.tasks) {
      let typeLabel = t.type === 'weekly' ? 'Еженедельная' : (t.type === 'monthly' ? 'Ежемесячная' : 'Разовая');
      let statusLabel = t.status === 'done' ? 'Выполнена' : 'В работе';
      let assigneeName = t.assignee ? t.assignee.name.split('(')[0].trim() : '';
      let completedDate = t.completedDate || '';
      
      xlsContent += '<Row' + (t.status === 'done' ? ' ss:StyleID="completed"' : '') + '>';
      xlsContent += '<Cell><Data ss:Type="String">' + m.name + '</Data></Cell>';
      xlsContent += '<Cell><Data ss:Type="String">' + t.title + '</Data></Cell>';
      xlsContent += '<Cell><Data ss:Type="String">' + typeLabel + '</Data></Cell>';
      xlsContent += '<Cell><Data ss:Type="Number">' + t.hours + '</Data></Cell>';
      xlsContent += '<Cell><Data ss:Type="String">' + t.deadline + '</Data></Cell>';
      xlsContent += '<Cell><Data ss:Type="String">' + statusLabel + '</Data></Cell>';
      xlsContent += '<Cell><Data ss:Type="String">' + completedDate + '</Data></Cell>';
      xlsContent += '<Cell><Data ss:Type="String">' + assigneeName + '</Data></Cell>';
      xlsContent += '</Row>\n';
    }
  }
  
  xlsContent += '</Table>\n</Worksheet>\n';
  xlsContent += '</Workbook>';
  
  let blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = 'TaskManager_export.xls';
  a.click();
  URL.revokeObjectURL(url);
}

// === HTML-ФОРМА ===

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
      for (let b of buttons) {
        b.classList.remove('active');
      }
      btn.classList.add('active');
    };
    if (m === newTaskAssignee) {
      btn.classList.add('active');
    }
    container.appendChild(btn);
  }
}

function setType(type) {
  newTaskType = type;
  let buttons = document.getElementsByClassName('type-btn');
  for (let btn of buttons) {
    btn.classList.remove('active');
    if (btn.classList.contains(type)) {
      btn.classList.add('active');
    }
  }
}

function saveTask() {
  let titleInput = document.getElementById('task-title');
  let hoursInput = document.getElementById('task-hours');
  let deadlineInput = document.getElementById('task-deadline');
  
  let title = titleInput.value;
  let hours = parseInt(hoursInput.value);
  let deadline = deadlineInput.value;
  
  if (title && hours && deadline && newTaskAssignee) {
    let task = new Task(title, newTaskType, hours, deadline, newTaskAssignee);
    newTaskAssignee.addTask(task);
    
    titleInput.value = '';
    hoursInput.value = '';
    deadlineInput.value = '';
    
    hideForm();
  }
}

function showForm() {
  showAddForm = true;
  newTaskAssignee = currentManager;
  
  let form = document.getElementById('add-form');
  form.classList.add('visible');
  
  setType('weekly');
  updateAssigneeButtons();
}

function hideForm() {
  showAddForm = false;
  let form = document.getElementById('add-form');
  form.classList.remove('visible');
  
  document.getElementById('task-title').value = '';
  document.getElementById('task-hours').value = '';
  document.getElementById('task-deadline').value = '';
}

// === ОБРАБОТКА СОБЫТИЙ ===

function mousePressed() {
  // Колокольчик уведомлений
  if (mouseX > 1090 && mouseX < 1130 && mouseY > 5 && mouseY < 45) {
    showNotifications = !showNotifications;
    return;
  }
  
  // Закрытие уведомлений
  if (showNotifications) {
    if (mouseX < 900 || mouseX > 1180 || mouseY < 65 || mouseY > 315) {
      showNotifications = false;
    }
    if (mouseX > 915 && mouseX < 1165 && mouseY > 275 && mouseY < 303) {
      notifications = [];
      showNotifications = false;
    }
    return;
  }
  
  // Экспорт
  if (mouseY > 95 && mouseY < 129) {
    if (mouseX > 500 && mouseX < 640) {
      exportToXLS();
      return;
    }
  }
  
  // Переключатель вида
  if (mouseY > 95 && mouseY < 129) {
    if (mouseX > 30 && mouseX < 170) {
      activeView = 'personal';
      hideForm();
      return;
    }
    if (mouseX > 180 && mouseX < 320) {
      activeView = 'team';
      hideForm();
      return;
    }
    if (mouseX > 330 && mouseX < 470) {
      activeView = 'calendar';
      hideForm();
      return;
    }
  }
  
  if (activeView === 'calendar') {
    let cy = 150;
    for (let i = 0; i < managers.length; i++) {
      let btnX = 380 + i * 200;
      if (mouseX > btnX && mouseX < btnX + 180 && mouseY > cy - 12 && mouseY < cy + 16) {
        calendarManager = managers[i];
      }
    }
    return;
  }
  
  if (activeView === 'team') return;
  
  // Переключение менеджеров
  let y = 140;
  for (let i = 0; i < managers.length; i++) {
    let btnX = 130 + i * 200;
    if (mouseX > btnX && mouseX < btnX + 185 && mouseY > y && mouseY < y + 30) {
      currentManager = managers[i];
      hideForm();
    }
  }
  
  // Кнопка "Новая задача"
  if (mouseX > 850 && mouseX < 1070 && mouseY > 700 && mouseY < 744) {
    if (showAddForm) {
      hideForm();
    } else {
      showForm();
    }
    return;
  }
  
  // Обработка кликов по задачам и завершённым
  if (currentManager && !showAddForm) {
    // Блоки активных задач
    let blocks = [
      { tasks: currentManager.getWeeklyTasks(), x: 30, y: 216 },
      { tasks: currentManager.getMonthlyTasks(), x: 380, y: 216 },
      { tasks: currentManager.getOnetimeTasks(), x: 730, y: 216 }
    ];
    
    for (let block of blocks) {
      let activeTasks = block.tasks.filter(t => t.status !== 'done');
      for (let i = 0; i < activeTasks.length; i++) {
        let task = activeTasks[i];
        let ty = block.y + i * 38;
        
        // Клик по чекбоксу — завершить задачу
        if (mouseX > block.x + 12 && mouseX < block.x + 30 && 
            mouseY > ty && mouseY < ty + 18) {
          task.complete();
          saveData();
          checkNotifications();
        }
        
        // Клик по корзине — удалить задачу
        if (mouseX > block.x + 300 && mouseX < block.x + 322 && 
            mouseY > ty + 8 && mouseY < ty + 26) {
          currentManager.removeTask(task);
        }
      }
    }
    
    // Блок завершённых задач
    let completedTasks = currentManager.getCompletedTasks();
    let completedBlockY = 436;
    let sortedCompleted = completedTasks.slice().sort((a, b) => {
      if (!a.completedDate) return 1;
      if (!b.completedDate) return -1;
      return b.completedDate.localeCompare(a.completedDate);
    });
    
    for (let i = 0; i < sortedCompleted.length; i++) {
      let task = sortedCompleted[i];
      let ty = completedBlockY + i * 30;
      
      // Кнопка восстановления
      if (mouseX > 310 && mouseX < 350 && mouseY > ty - 2 && mouseY < ty + 20) {
        task.reopen();
        saveData();
      }
      
      // Кнопка удаления
      if (mouseX > 360 && mouseX < 382 && mouseY > ty + 2 && mouseY < ty + 18) {
        currentManager.removeTask(task);
      }
    }
  }
}

// === СОХРАНЕНИЕ И ЗАГРУЗКА ===

function saveData() {
  let data = {
    managers: managers.map(m => ({
      name: m.name,
      tasks: m.tasks.map(t => ({
        title: t.title,
        type: t.type,
        hours: t.hours,
        deadline: t.deadline,
        status: t.status,
        completedDate: t.completedDate,
        assigneeName: t.assignee ? t.assignee.name : null
      }))
    }))
  };
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
        if (assignee) {
          let task = new Task(t.title, t.type, t.hours, t.deadline, assignee);
          task.status = t.status;
          task.completedDate = t.completedDate || null;
          manager.tasks.push(task);
        }
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
  alexandra.addTask(new Task('Квартальный отчёт', 'monthly', 8, '25 число', alexandra));
  
  vera.addTask(new Task('Отчёт по продажам', 'weekly', 3, 'ПН', vera));
  vera.addTask(new Task('Звонки клиентам', 'weekly', 5, 'ВТ', vera));
  vera.addTask(new Task('Подготовка презентации', 'onetime', 6, '28.06.2026', vera));
  
  varvara.addTask(new Task('Анализ рынка', 'weekly', 4, 'ПН', varvara));
  varvara.addTask(new Task('Встреча с партнёрами', 'monthly', 3, '15 число', varvara));
  varvara.addTask(new Task('Обновление базы данных', 'onetime', 8, '27.06.2026', varvara));
  
  saveData();
  checkNotifications();
}
