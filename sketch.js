let managers = [];
let currentManager = null;
let managerNames = ['Анна', 'Борис', 'Виктория', 'Дмитрий', 'Елена'];
let showAddForm = false;
let newTaskType = 'weekly';
let newTaskTitle = '';
let newTaskHours = '';
let newTaskDeadline = '';
let newTaskAssignee = null;
let activeView = 'personal';
let calendarManager = null;
let calendarWeek = 0;
let currentMonth = 'Июнь 2026';
let notifications = [];
let showNotifications = false;
let currentDate = '24.06.2026'; // Текущая дата для проверки просрочки

// Цветовая схема
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
  createCanvas(1200, 850);
  textFont('Arial');
  
  loadData();
  
  if (managers.length === 0) {
    createTestData();
  }
  
  currentManager = managers[0];
  calendarManager = managers[0];
  newTaskAssignee = currentManager;
  
  // Проверяем уведомления при загрузке
  checkNotifications();
}

function draw() {
  background(colors.bg);
  
  drawHeader();
  drawViewToggle();
  
  // Рисуем уведомления
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
  
  // Колокольчик
  fill(notifications.length > 0 ? colors.danger : '#636e72');
  noStroke();
  textSize(28);
  text('🔔', x, y);
  
  // Счётчик уведомлений
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
  
  // Тень
  fill(0, 0, 0, 10);
  noStroke();
  rect(x + 3, y + 3, w, h, 8);
  
  // Панель
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
    
    // Кнопка "Очистить"
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
  
  // Кнопка экспорта
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
    drawStats();
  }
  
  drawAddButton();
  
  if (showAddForm) {
    drawAddForm();
  }
}

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
        
        // Подсветка просроченных
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
  let taskDay = null;
  
  if (dl.includes('пн') || dl.includes('понед')) taskDay = 1;
  else if (dl.includes('вт') || dl.includes('втор')) taskDay = 2;
  else if (dl.includes('ср') || dl.includes('сред')) taskDay = 3;
  else if (dl.includes('чт') || dl.includes('четв')) taskDay = 4;
  else if (dl.includes('пт') || dl.includes('пятн')) taskDay = 5;
  else if (dl.includes('сб') || dl.includes('суб')) taskDay = 6;
  else if (dl.includes('вс') || dl.includes('воск')) taskDay = 7;
  else {
    // Для конкретных дат (разовые задачи)
    let dateMatch = dl.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (dateMatch) {
      let taskDate = dateMatch[1] + '.' + dateMatch[2] + '.' + dateMatch[3];
      return taskDate < currentDate;
    }
    return false;
  }
  
  // Для задач с днём недели — считаем, что они на этой неделе
  return false;
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
    
    // Подсветка просроченных
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
    
    // Индикатор просрочки
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

function drawAddForm() {
  let x = 30;
  let y = 640;
  
  fill(colors.card);
  stroke('#636e72');
  strokeWeight(2);
  rect(x, y, 800, 160, 12);
  
  fill(colors.text);
  textSize(16);
  textStyle(BOLD);
  text('Новая задача', x + 20, y + 28);
  textStyle(NORMAL);
  
  fill('#ffffff');
  stroke('#b2bec3');
  strokeWeight(1);
  rect(x + 20, y + 40, 250, 30, 4);
  fill('#636e72');
  textSize(12);
  text(newTaskTitle || 'Название задачи...', x + 28, y + 60);
  
  let types = ['weekly', 'monthly', 'onetime'];
  let typeLabels = ['Еженед.', 'Ежемес.', 'Разов.'];
  for (let i = 0; i < 3; i++) {
    let tx = x + 290 + i * 90;
    fill(newTaskType === types[i] ? colors[types[i]] : '#dfe6e9');
    noStroke();
    rect(tx, y + 40, 80, 30, 4);
    fill(newTaskType === types[i] ? '#ffffff' : colors.text);
    textSize(12);
    textAlign(CENTER);
    text(typeLabels[i], tx + 40, y + 60);
    textAlign(LEFT);
  }
  
  fill('#ffffff');
  stroke('#b2bec3');
  rect(x + 570, y + 40, 60, 30, 4);
  fill('#636e72');
  textSize(12);
  text(newTaskHours || 'Часы', x + 578, y + 60);
  
  fill('#ffffff');
  stroke('#b2bec3');
  rect(x + 640, y + 40, 110, 30, 4);
  fill('#636e72');
  text(newTaskDeadline || 'Дедлайн', x + 648, y + 60);
  
  fill('#636e72');
  textSize(12);
  text('Ответственный:', x + 20, y + 95);
  
  for (let i = 0; i < managers.length; i++) {
    let mx = x + 140 + i * 120;
    let isSelected = (newTaskAssignee === managers[i]);
    
    fill(isSelected ? colors.accent : '#dfe6e9');
    noStroke();
    rect(mx, y + 78, 110, 28, 4);
    
    fill(isSelected ? '#ffffff' : colors.text);
    textSize(12);
    textAlign(CENTER);
    text(managers[i].name, mx + 55, y + 96);
    textAlign(LEFT);
  }
  
  fill(colors.ok);
  noStroke();
  rect(x + 20, y + 120, 150, 30, 6);
  fill('#ffffff');
  textSize(14);
  textAlign(CENTER);
  text('💾 Сохранить', x + 95, y + 140);
  textAlign(LEFT);
}

// === Классы ===

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
  }
}

// === Вспомогательные функции ===

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function checkNotifications() {
  notifications = [];
  
  for (let m of managers) {
    // Проверка на перегруз
    let weeklyHours = m.getWeeklyHours();
    if (weeklyHours > 40) {
      notifications.push({
        type: 'overload',
        message: m.name + ': перегруз ' + weeklyHours.toFixed(1) + 'ч / 40ч на неделе'
      });
    }
    
    // Проверка на просроченные задачи
    for (let t of m.tasks) {
      if (isTaskOverdue(t)) {
        notifications.push({
          type: 'overdue',
          message: m.name + ': просрочена задача «' + t.title + '»'
        });
      }
    }
  }
}

// === Экспорт в Excel ===

function exportToXLS() {
  let xlsContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xlsContent += '<?mso-application progid="Excel.Sheet"?>\n';
  xlsContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xlsContent += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  
  // Стили
  xlsContent += '<Styles>\n';
  xlsContent += '<Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#0984e3" ss:Pattern="Solid"/></Style>\n';
  xlsContent += '<Style ss:ID="overload"><Interior ss:Color="#ff7675" ss:Pattern="Solid"/></Style>\n';
  xlsContent += '</Styles>\n';
  
  // Лист 1: Сводка по команде
  xlsContent += '<Worksheet ss:Name="Сводка по команде">\n<Table>\n';
  xlsContent += '<Row ss:StyleID="header">';
  ['Менеджер', 'Занято нед.', 'Своб. нед.', 'Занято мес.', 'Своб. мес.', 'Загрузка %', 'Активные задачи'].forEach(h => {
    xlsContent += '<Cell><Data ss:Type="String">' + h + '</Data></Cell>';
  });
  xlsContent += '</Row>\n';
  
  for (let m of managers) {
    let weeklyHours = m.getWeeklyHours();
    let monthlyHours = m.getMonthlyHours();
    let loadPct = ((weeklyHours / 40) * 100).toFixed(1);
    let activeTasks = m.tasks.filter(t => t.status !== 'done').length;
    let isOverload = weeklyHours > 40;
    
    xlsContent += '<Row' + (isOverload ? ' ss:StyleID="overload"' : '') + '>';
    xlsContent += '<Cell><Data ss:Type="String">' + m.name + '</Data></Cell>';
    xlsContent += '<Cell><Data ss:Type="Number">' + weeklyHours.toFixed(1) + '</Data></Cell>';
    xlsContent += '<Cell><Data ss:Type="Number">' + max(0, 40 - weeklyHours).toFixed(1) + '</Data></Cell>';
    xlsContent += '<Cell><Data ss:Type="Number">' + monthlyHours.toFixed(1) + '</Data></Cell>';
    xlsContent += '<Cell><Data ss:Type="Number">' + max(0, 160 - monthlyHours).toFixed(1) + '</Data></Cell>';
    xlsContent += '<Cell><Data ss:Type="Number">' + loadPct + '</Data></Cell>';
    xlsContent += '<Cell><Data ss:Type="Number">' + activeTasks + '</Data></Cell>';
    xlsContent += '</Row>\n';
  }
  
  xlsContent += '</Table>\n</Worksheet>\n';
  
  // Лист 2: Все задачи
  xlsContent += '<Worksheet ss:Name="Все задачи">\n<Table>\n';
  xlsContent += '<Row ss:StyleID="header">';
  ['Менеджер', 'Задача', 'Тип', 'Часы', 'Дедлайн', 'Статус', 'Ответственный'].forEach(h => {
    xlsContent += '<Cell><Data ss:Type="String">' + h + '</Data></Cell>';
  });
  xlsContent += '</Row>\n';
  
  for (let m of managers) {
    for (let t of m.tasks) {
      let typeLabel = t.type === 'weekly' ? 'Еженедельная' : (t.type === 'monthly' ? 'Ежемесячная' : 'Разовая');
      let statusLabel = t.status === 'done' ? 'Выполнена' : 'В работе';
      let assigneeName = t.assignee ? t.assignee.name : '';
      
      xlsContent += '<Row>';
      xlsContent += '<Cell><Data ss:Type="String">' + m.name + '</Data></Cell>';
      xlsContent += '<Cell><Data ss:Type="String">' + t.title + '</Data></Cell>';
      xlsContent += '<Cell><Data ss:Type="String">' + typeLabel + '</Data></Cell>';
      xlsContent += '<Cell><Data ss:Type="Number">' + t.hours + '</Data></Cell>';
      xlsContent += '<Cell><Data ss:Type="String">' + t.deadline + '</Data></Cell>';
      xlsContent += '<Cell><Data ss:Type="String">' + statusLabel + '</Data></Cell>';
      xlsContent += '<Cell><Data ss:Type="String">' + assigneeName + '</Data></Cell>';
      xlsContent += '</Row>\n';
    }
  }
  
  xlsContent += '</Table>\n</Worksheet>\n';
  xlsContent += '</Workbook>';
  
  // Скачиваем файл
  let blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = 'TaskManager_export.xls';
  a.click();
  URL.revokeObjectURL(url);
}

// === Обработка событий ===

function mousePressed() {
  // Колокольчик уведомлений
  if (mouseX > 1090 && mouseX < 1130 && mouseY > 5 && mouseY < 45) {
    showNotifications = !showNotifications;
    return;
  }
  
  // Закрытие уведомлений при клике вне
  if (showNotifications) {
    if (mouseX < 900 || mouseX > 1180 || mouseY < 65 || mouseY > 315) {
      showNotifications = false;
    }
    // Кнопка "Очистить все"
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
      return;
    }
    if (mouseX > 180 && mouseX < 320) {
      activeView = 'team';
      showAddForm = false;
      return;
    }
    if (mouseX > 330 && mouseX < 470) {
      activeView = 'calendar';
      showAddForm = false;
      return;
    }
  }
  
  if (activeView === 'calendar') {
    let cy = 150;
    for (let i = 0; i < managers.length; i++) {
      let btnX = 380 + i * 100;
      if (mouseX > btnX && mouseX < btnX + 90 && mouseY > cy - 12 && mouseY < cy + 16) {
        calendarManager = managers[i];
      }
    }
    return;
  }
  
  if (activeView === 'team') return;
  
  // Переключение менеджеров
  let y = 140;
  for (let i = 0; i < managers.length; i++) {
    let btnX = 120 + i * 90;
    if (mouseX > btnX && mouseX < btnX + 80 && mouseY > y && mouseY < y + 30) {
      currentManager = managers[i];
      showAddForm = false;
    }
  }
  
  // Кнопка "Новая задача"
  if (mouseX > 850 && mouseX < 1070 && mouseY > 640 && mouseY < 684) {
    showAddForm = !showAddForm;
    if (showAddForm) {
      newTaskAssignee = currentManager;
    }
    return;
  }
  
  // Форма добавления
  if (showAddForm) {
    let types = ['weekly', 'monthly', 'onetime'];
    for (let i = 0; i < 3; i++) {
      let tx = 320 + i * 90;
      if (mouseX > tx && mouseX < tx + 80 && mouseY > 680 && mouseY < 710) {
        newTaskType = types[i];
      }
    }
    
    for (let i = 0; i < managers.length; i++) {
      let mx = 170 + i * 120;
      if (mouseX > mx && mouseX < mx + 110 && mouseY > 718 && mouseY < 746) {
        newTaskAssignee = managers[i];
      }
    }
    
    if (mouseX > 50 && mouseX < 200 && mouseY > 760 && mouseY < 790) {
      if (newTaskTitle && newTaskHours && newTaskDeadline && newTaskAssignee) {
        let task = new Task(newTaskTitle, newTaskType, int(newTaskHours), newTaskDeadline, newTaskAssignee);
        newTaskAssignee.addTask(task);
        newTaskTitle = '';
        newTaskHours = '';
        newTaskDeadline = '';
        newTaskAssignee = currentManager;
        showAddForm = false;
      }
    }
    
    return;
  }
  
  // Клик по чекбоксам и удалению
  if (currentManager) {
    let blocks = [
      { tasks: currentManager.getWeeklyTasks(), x: 30, y: 216 },
      { tasks: currentManager.getMonthlyTasks(), x: 380, y: 216 },
      { tasks: currentManager.getOnetimeTasks(), x: 730, y: 216 }
    ];
    
    for (let block of blocks) {
      for (let i = 0; i < block.tasks.length; i++) {
        let task = block.tasks[i];
        let ty = block.y + i * 38;
        
        if (mouseX > block.x + 12 && mouseX < block.x + 30 && 
            mouseY > ty && mouseY < ty + 18) {
          task.status = task.status === 'done' ? 'todo' : 'done';
          saveData();
          checkNotifications();
        }
        
        if (mouseX > block.x + 300 && mouseX < block.x + 325 && 
            mouseY > ty && mouseY < ty + 18) {
          currentManager.removeTask(task);
        }
      }
    }
  }
}

// === Сохранение и загрузка ===

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
        let task = new Task(t.title, t.type, t.hours, t.deadline, assignee);
        task.status = t.status;
        manager.tasks.push(task);
      }
    }
    
    checkNotifications();
  }
}

function createTestData() {
  managers = [];
  let managerObjects = [];
  
  for (let name of managerNames) {
    let m = new Manager(name);
    managers.push(m);
    managerObjects.push(m);
  }
  
  let task1 = new Task('Отчёт по продажам', 'weekly', 2, 'ПН', managerObjects[0]);
  managerObjects[0].addTask(task1);
  
  let task2 = new Task('Планёрка команды', 'weekly', 1, 'СР', managerObjects[0]);
  managerObjects[0].addTask(task2);
  
  let task3 = new Task('Сверка счетов', 'monthly', 4, '15 число', managerObjects[1]);
  managerObjects[1].addTask(task3);
  
  let task4 = new Task('Презентация для клиента', 'onetime', 6, '20.06.2026', managerObjects[2]);
  managerObjects[2].addTask(task4);
  
  let task5 = new Task('Звонок поставщику', 'weekly', 1, 'ВТ', managerObjects[1]);
  managerObjects[1].addTask(task5);
  
  // Добавим задачу с большой нагрузкой для проверки уведомлений
  let task6 = new Task('Квартальный аудит', 'weekly', 35, 'ПН', managerObjects[3]);
  managerObjects[3].addTask(task6);
  
  saveData();
  checkNotifications();
}

function keyPressed() {
  if (showAddForm && activeView === 'personal') {
    if (keyCode === BACKSPACE) {
      if (mouseY > 680 && mouseY < 710) {
        if (mouseX > 50 && mouseX < 300) newTaskTitle = newTaskTitle.slice(0, -1);
        if (mouseX > 600 && mouseX < 660) newTaskHours = newTaskHours.slice(0, -1);
        if (mouseX > 670 && mouseX < 780) newTaskDeadline = newTaskDeadline.slice(0, -1);
      }
    } else if (keyCode === ENTER) {
      if (newTaskTitle && newTaskHours && newTaskDeadline && newTaskAssignee) {
        let task = new Task(newTaskTitle, newTaskType, int(newTaskHours), newTaskDeadline, newTaskAssignee);
        newTaskAssignee.addTask(task);
        newTaskTitle = '';
        newTaskHours = '';
        newTaskDeadline = '';
        newTaskAssignee = currentManager;
        showAddForm = false;
      }
    } else if (key.length === 1) {
      if (mouseY > 680 && mouseY < 710) {
        if (mouseX > 50 && mouseX < 300) newTaskTitle += key;
        if (mouseX > 600 && mouseX < 660) newTaskHours += key;
        if (mouseX > 670 && mouseX < 780) newTaskDeadline += key;
      }
    }
  }
}
