// ====== FIREBASE ======
const firebaseConfig = {
  apiKey: "AIzaSyDW3bm7Kb5Sv3KHQFEq-LxBWmYo3O9rGUk",
  authDomain: "team-tasks-30813.firebaseapp.com",
  databaseURL: "https://team-tasks-30813-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "team-tasks-30813",
  storageBucket: "team-tasks-30813.firebasestorage.app",
  messagingSenderId: "591079444769",
  appId: "1:591079444769:web:f18a3330f267a3bf572e60"
};

firebase.initializeApp(firebaseConfig);
var database = firebase.database();
var dataRef = database.ref('managers');

var managers = [];
var currentManager = null;
var activeView = 'personal';
var calendarManager = null;
var notifications = [];
var showNotifications = false;
var showAddForm = false;
var newTaskType = 'weekly';
var newTaskAssignee = null;
var dataLoaded = false;
var calendarMonth = new Date().getMonth();
var calendarYear = new Date().getFullYear();

var colors = {

var colors = {
  bg: '#f5f6fa', card: '#ffffff', weekly: '#6c5ce7', monthly: '#e17055',
  onetime: '#00b894', done: '#b2bec3', completed: '#636e72', text: '#2d3436',
  danger: '#d63031', warning: '#fdcb6e', ok: '#00b894', accent: '#0984e3'
};

function setup() {
  var canvas = createCanvas(1200, 850);
  canvas.parent('app-container');
  textFont('Arial');
  
  // Загружаем данные из Firebase
  dataRef.on('value', function(snapshot) {
    var data = snapshot.val();
    if (data) {
      managers = [];
      var map = {};
      
      // Преобразуем объект в массив
      var keys = Object.keys(data);
      for (var k = 0; k < keys.length; k++) {
        var item = data[keys[k]];
        var mgr = new Manager(item.name);
        map[item.name] = mgr;
        managers.push(mgr);
      }
      
      for (var k = 0; k < keys.length; k++) {
        var item = data[keys[k]];
        var mgr = map[item.name];
        var tasks = item.tasks || [];
        for (var j = 0; j < tasks.length; j++) {
          var t = tasks[j];
          var assignee = t.assigneeName ? map[t.assigneeName] : mgr;
          var task = new Task(t.title, t.type, t.hours, t.deadline, assignee, t.description||'');
          task.status = t.status || 'todo';
          task.completedDate = t.completedDate || null;
          mgr.tasks.push(task);
        }
      }
    } else {
      createTestData();
    }
    
    if (!dataLoaded) {
      dataLoaded = true;
      currentManager = managers[0];
      calendarManager = managers[0];
      newTaskAssignee = currentManager;
      updateAssigneeButtons();
    }
    checkNotifications();
  });
}
function createTestData() {
  managers = [];
  var a = new Manager('Александра Пименова (Руководитель)');
  var v = new Manager('Вера Гусева (Менеджер)');
  var va = new Manager('Варвара Андреева (Менеджер)');
  managers.push(a, v, va);
  a.addTask(new Task('Стратегическое планирование', 'weekly', 4, 'ПН', a, 'Определить цели на квартал'));
  a.addTask(new Task('Совещание с командой', 'weekly', 2, 'СР', a, 'Обсудить результаты'));
  v.addTask(new Task('Отчёт по продажам', 'weekly', 3, 'ПН', v, 'Собрать данные из CRM'));
  v.addTask(new Task('Презентация для клиента', 'onetime', 6, '28.06.2026', v, 'Для встречи с Петровым'));
  va.addTask(new Task('Анализ рынка', 'weekly', 4, 'ПН', va, 'Мониторинг конкурентов'));
  va.addTask(new Task('Обновление базы', 'onetime', 8, '27.06.2026', va, 'Перенести данные в CRM'));
  saveData();
}

function draw() {
  if (!dataLoaded) {
    background(colors.bg);
    fill(colors.text); textSize(20); textAlign(CENTER); text('Загрузка данных...', 600, 400); textAlign(LEFT);
    return;
  }
  background(colors.bg);
  drawHeader();
  drawViewTabs();
  drawNotificationBell();
  if (showNotifications) drawNotificationsPanel();
  if (activeView === 'personal') drawPersonalView();
  else if (activeView === 'team') drawTeamView();
  else if (activeView === 'calendar') drawCalendarView();
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
  var x = 900, y = 55;
  fill('#fff'); stroke('#636e72'); strokeWeight(2); rect(x, y, 260, 220, 10);
  fill(colors.text); textSize(15); textStyle(BOLD); text('Уведомления', x+15, y+28); textStyle(NORMAL);
  if (notifications.length === 0) { fill('#636e72'); textSize(12); text('Нет уведомлений', x+15, y+55); }
  else { for (var i = 0; i < Math.min(notifications.length, 7); i++) { fill(notifications[i].type==='overdue'?colors.danger:colors.warning); textSize(11); text(notifications[i].message, x+15, y+55+i*22); } }
  fill('#dfe6e9'); noStroke(); rect(x+15, y+180, 230, 25, 5);
  fill(colors.text); textSize(12); textAlign(CENTER); text('Очистить', x+130, y+198); textAlign(LEFT);
}

function drawViewTabs() {
  var tabs = [
    { id: 'personal', label: '👤 Мои задачи', x: 30 },
    { id: 'team', label: '👥 Дашборд', x: 175 },
    { id: 'calendar', label: '📅 Календарь', x: 320 }
  ];
  for (var i = 0; i < tabs.length; i++) {
    var t = tabs[i];
    fill(activeView === t.id ? colors.accent : '#dfe6e9'); noStroke(); rect(t.x, 88, 140, 32, 7);
    fill(activeView === t.id ? '#fff' : colors.text); textSize(13); textAlign(CENTER); text(t.label, t.x+70, 109); textAlign(LEFT);
  }
}

function drawPersonalView() {
  fill('#636e72'); textSize(13); text('Сотрудник:', 30, 150);
  for (var i = 0; i < managers.length; i++) {
    var bx = 120 + i * 180;
    fill(managers[i] === currentManager ? colors.weekly : '#dfe6e9'); noStroke(); rect(bx, 136, 165, 28, 5);
    fill(managers[i] === currentManager ? '#fff' : colors.text); textSize(11); textAlign(CENTER); text(managers[i].name.split('(')[0].trim(), bx+82, 155); textAlign(LEFT);
  }
  drawBlock('Еженедельные', currentManager.getWeeklyTasks(), 30, 180, colors.weekly);
  drawBlock('Ежемесячные', currentManager.getMonthlyTasks(), 380, 180, colors.monthly);
  drawBlock('Разовые', currentManager.getOnetimeTasks(), 730, 180, colors.onetime);
  drawCompletedBlock(currentManager.getCompletedTasks(), 30, 440);
  drawStats();
  fill('#00b894'); noStroke(); rect(850, 710, 200, 45, 22);
  fill('#fff'); textSize(16); textStyle(BOLD); textAlign(CENTER); text('+ Новая задача', 950, 738); textAlign(LEFT); textStyle(NORMAL);
}

function drawBlock(title, tasks, x, y, color) {
  fill(color); noStroke(); rect(x, y, 340, 34, 7);
  fill('#fff'); textSize(14); textStyle(BOLD); text(title, x+12, y+23); textStyle(NORMAL);
  
  // Увеличим высоту блока для описаний
  fill('#fff'); stroke('#e0e0e0'); strokeWeight(1); rect(x, y+34, 340, 220, 0, 0, 7, 7);
  var active = tasks.filter(function(t) { return t.status !== 'done'; });
  if (active.length === 0) { fill('#b2bec3'); noStroke(); textSize(12); text('Нет задач', x+12, y+60); return; }
  
  for (var i = 0; i < Math.min(active.length, 6); i++) {
    var t = active[i];
    var hasDesc = t.description && t.description.length > 0;
    var rowHeight = hasDesc ? 48 : 34;
    var ty = y + 46;
    for (var k = 0; k < i; k++) {
      ty += (active[k].description && active[k].description.length > 0) ? 48 : 34;
    }
    
    fill('#fff'); stroke('#b2bec3'); strokeWeight(2); rect(x+10, ty+4, 16, 16, 3); noStroke();
    fill(colors.text); textSize(12); text(t.title, x+32, ty+14);
    
    var an = t.assignee ? t.assignee.name.split('(')[0].trim() : '';
    fill('#636e72'); textSize(9);
    text(t.hours + 'ч | ' + t.deadline + ' | ' + an, x+32, ty+26);
    
    // Описание на отдельной строке
    if (hasDesc) {
      fill('#636e72'); textSize(8); textStyle(ITALIC);
      var descText = t.description;
      if (descText.length > 40) descText = descText.substring(0, 38) + '…';
      text(descText, x+32, ty+40);
      textStyle(NORMAL);
    }
    
    fill('#e74c3c'); noStroke(); rect(x+308, ty+2, 22, 20, 3);
    fill('#fff'); textSize(14); textAlign(CENTER); text('×', x+319, ty+17); textAlign(LEFT);
  }
}
function drawCompletedBlock(tasks, x, y) {
  fill(colors.completed); noStroke(); rect(x, y, 1040, 34, 7);
  fill('#fff'); textSize(14); textStyle(BOLD); text('✅ Завершённые задачи', x+12, y+23); textStyle(NORMAL);
  fill('#fff'); stroke('#e0e0e0'); rect(x, y+34, 1040, 140, 0, 0, 7, 7);
  if (tasks.length === 0) { fill('#b2bec3'); noStroke(); textSize(12); text('Нет завершённых задач', x+12, y+60); return; }
  for (var i = 0; i < Math.min(tasks.length, 4); i++) {
    var t = tasks[i]; var ty = y + 44 + i * 30;
    fill('#00b894'); noStroke(); textSize(13); text('✓', x+12, ty+12);
    fill(colors.completed); textSize(12); textStyle(ITALIC); text(t.title, x+30, ty+12); textStyle(NORMAL);
    fill('#636e72'); textSize(9);
    var an = t.assignee ? t.assignee.name.split('(')[0].trim() : '';
    text(t.hours + 'ч | Вып: ' + (t.completedDate||'?') + ' | ' + an, x+30, ty+25);
    fill('#dfe6e9'); noStroke(); rect(x+260, ty+3, 35, 20, 3);
    fill(colors.text); textSize(10); textAlign(CENTER); text('↩', x+277, ty+17); textAlign(LEFT);
    fill('#e74c3c'); noStroke(); rect(x+305, ty+3, 25, 20, 3);
    fill('#fff'); textSize(12); textAlign(CENTER); text('×', x+317, ty+17); textAlign(LEFT);
  }
}

function drawStats() {
  var y = 630;
  fill('#fff'); stroke('#e0e0e0'); rect(30, y, 1040, 55, 7);
  fill(colors.text); textSize(15); textStyle(BOLD); text('📊 Нагрузка: ' + currentManager.name, 48, y+22); textStyle(NORMAL);
  var wh = currentManager.getWeeklyHours(), mh = currentManager.getMonthlyHours();
  fill('#636e72'); textSize(11); text('Неделя: ' + wh + ' / 40ч', 48, y+40);
  fill('#dfe6e9'); noStroke(); rect(150, y+32, 180, 12, 6);
  fill(wh > 40 ? colors.danger : wh > 35 ? colors.warning : colors.ok); rect(150, y+32, 180 * Math.min(wh/40, 1), 12, 6);
  fill('#636e72'); textSize(11); text('Месяц: ' + mh + ' / 160ч', 360, y+40);
  fill('#dfe6e9'); noStroke(); rect(450, y+32, 180, 12, 6);
  fill(mh > 160 ? colors.danger : mh > 140 ? colors.warning : colors.ok); rect(450, y+32, 180 * Math.min(mh/160, 1), 12, 6);
  fill(colors.text); textSize(12); text('Разовые: ' + currentManager.getOnetimeHours() + 'ч | Свободно: ' + Math.max(0, 40-wh) + 'ч', 660, y+40);
}

function drawTeamView() {
  var y = 160;
  fill(colors.text); textSize(20); textStyle(BOLD); text('📊 Сводка по команде', 30, y); textStyle(NORMAL); y += 25;
  fill(colors.accent); noStroke(); rect(30, y, 1050, 32, 6);
  fill('#fff'); textSize(12); textStyle(BOLD);
  var hx = 45;
  ['Сотрудник', 'Активные', 'Завершено', 'Занято нед', 'Своб нед', 'Занято мес', 'Загрузка'].forEach(function(h) { text(h, hx, y+21); hx += 150; });
  textStyle(NORMAL); y += 36;
  for (var i = 0; i < managers.length; i++) {
    var m = managers[i]; var wh = m.getWeeklyHours(), mh = m.getMonthlyHours(), pct = (wh/40)*100;
    fill('#fff'); stroke('#e0e0e0'); rect(30, y, 1050, 46); noStroke();
    fill(colors.text); textSize(13); textStyle(BOLD); text(m.name, 45, y+18); textStyle(NORMAL);
    fill('#636e72'); textSize(11); text(m.tasks.filter(function(t){return t.status!=='done';}).length + ' | ' + m.tasks.filter(function(t){return t.status==='done';}).length, 45, y+36);
    textAlign(CENTER);
    fill(wh>40?colors.danger:colors.text); text(wh.toFixed(1)+'ч', 345, y+28);
    fill(Math.max(0,40-wh)>0?colors.ok:'#636e72'); text(Math.max(0,40-wh).toFixed(1)+'ч', 495, y+28);
    fill(mh>160?colors.danger:colors.text); text(mh.toFixed(1)+'ч', 645, y+28); textAlign(LEFT);
    fill('#dfe6e9'); rect(750, y+14, 200, 12, 6);
    var lc = pct>100?colors.danger:pct>80?colors.warning:colors.ok; fill(lc); rect(750, y+14, 200*Math.min(pct/100,1.5), 12, 6);
    fill(colors.text); textSize(10); textAlign(CENTER); text(pct.toFixed(0)+'%', 850, y+36); textAlign(LEFT);
    y += 50;
  }
}

function drawCalendarView() {
  var y = 160;
  fill(colors.text); textSize(20); textStyle(BOLD); text('📅 Календарь загрузки', 30, y); textStyle(NORMAL);
  for (var i = 0; i < managers.length; i++) {
    var bx = 280 + i * 200;
    fill(calendarManager === managers[i] ? colors.accent : '#dfe6e9'); noStroke(); rect(bx, y-10, 180, 26, 4);
    fill(calendarManager === managers[i] ? '#fff' : colors.text); textSize(11); textAlign(CENTER); text(managers[i].name, bx+90, y+8); textAlign(LEFT);
  }
  y += 35;
  var days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
  for (var d = 0; d < 7; d++) {
    fill(colors.accent); noStroke(); rect(30+d*155+d*5, y, 155, 26, 4);
    fill('#fff'); textSize(12); textStyle(BOLD); textAlign(CENTER); text(days[d], 30+d*160+77, y+18); textAlign(LEFT); textStyle(NORMAL);
  }
  y += 30;
  for (var w = 0; w < 4; w++) for (var d = 0; d < 7; d++) {
    fill('#fff'); stroke('#e0e0e0'); rect(30+d*160, y+w*135, 155, 130, 5);
    noStroke(); fill(colors.text); textSize(12); textStyle(BOLD); text(w*7+d+1, 40+d*160, y+w*135+18); textStyle(NORMAL);
  }
}

// ====== КЛАССЫ ======
function Manager(name) { this.name = name; this.tasks = []; }
Manager.prototype.addTask = function(t) { this.tasks.push(t); saveData(); };
Manager.prototype.removeTask = function(t) { var i = this.tasks.indexOf(t); if(i>-1) { this.tasks.splice(i,1); saveData(); } };
Manager.prototype.getWeeklyTasks = function() { return this.tasks.filter(function(t){return t.type==='weekly';}); };
Manager.prototype.getMonthlyTasks = function() { return this.tasks.filter(function(t){return t.type==='monthly';}); };
Manager.prototype.getOnetimeTasks = function() { return this.tasks.filter(function(t){return t.type==='onetime';}); };
Manager.prototype.getCompletedTasks = function() { return this.tasks.filter(function(t){return t.status==='done';}); };
Manager.prototype.getWeeklyHours = function() {
  var w = this.tasks.filter(function(t){return t.type==='weekly'&&t.status!=='done';}).reduce(function(s,t){return s+t.hours;},0);
  var m = this.tasks.filter(function(t){return t.type==='monthly'&&t.status!=='done';}).reduce(function(s,t){return s+t.hours/4;},0);
  return w+m;
};
Manager.prototype.getMonthlyHours = function() { return this.tasks.filter(function(t){return t.status!=='done';}).reduce(function(s,t){return s+(t.type==='weekly'?t.hours*4:t.hours);},0); };
Manager.prototype.getOnetimeHours = function() { return this.tasks.filter(function(t){return t.type==='onetime'&&t.status!=='done';}).reduce(function(s,t){return s+t.hours;},0); };

function Task(title, type, hours, deadline, assignee, desc) {
  this.title = title; this.type = type; this.hours = hours; this.deadline = deadline;
  this.assignee = assignee; this.description = desc||''; this.status = 'todo'; this.completedDate = null;
}
Task.prototype.complete = function() {
  this.status = 'done';
  var d = new Date();
  this.completedDate = String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear();
};
Task.prototype.reopen = function() { this.status = 'todo'; this.completedDate = null; };

// ====== ФОРМА ======
function updateAssigneeButtons() {
  var c = document.getElementById('assignee-btns'); if(!c)return; c.innerHTML = '';
  for (var i=0;i<managers.length;i++) {
    var m = managers[i]; var b = document.createElement('button'); b.className = 'assignee-btn'; b.textContent = m.name.split('(')[0].trim();
    (function(mgr,btn){btn.onclick=function(){newTaskAssignee=mgr;var bs=c.getElementsByClassName('assignee-btn');for(var j=0;j<bs.length;j++)bs[j].classList.remove('active');btn.classList.add('active');};})(m,b);
    if(m===newTaskAssignee)b.classList.add('active'); c.appendChild(b);
  }
}
function setType(type) { newTaskType=type; var bs=document.getElementsByClassName('type-btn'); for(var i=0;i<bs.length;i++){bs[i].classList.remove('active');if(bs[i].classList.contains(type))bs[i].classList.add('active');} }
function saveTaskFromForm() {
  var t = document.getElementById('task-title').value.trim();
  var h = parseInt(document.getElementById('task-hours').value) || 0;
  var m = parseInt(document.getElementById('task-minutes').value) || 0;
  var d = document.getElementById('task-deadline').value.trim();
// Преобразуем в формат ДД.ММ.ГГГГ
if (d) {
  var parts = d.split('-');
  d = parts[2] + '.' + parts[1] + '.' + parts[0];
}
  var desc = document.getElementById('task-description').value.trim();
  
  var totalHours = h + (m / 60);
  totalHours = Math.round(totalHours * 100) / 100;
  
  if (t && totalHours > 0 && d && newTaskAssignee) {
    newTaskAssignee.addTask(new Task(t, newTaskType, totalHours, d, newTaskAssignee, desc));
    document.getElementById('task-title').value = '';
    document.getElementById('task-hours').value = '';
    document.getElementById('task-minutes').value = '';
    document.getElementById('task-deadline').value = '';
    document.getElementById('task-description').value = '';
    hideForm();
  }
}
function showForm() { showAddForm=true; newTaskAssignee=currentManager; document.getElementById('add-form').classList.add('visible'); document.getElementById('overlay').classList.add('visible'); setType('weekly'); updateAssigneeButtons(); }
function hideForm() { showAddForm=false; document.getElementById('add-form').classList.remove('visible'); document.getElementById('overlay').classList.remove('visible'); }
function checkNotifications() { notifications=[]; for(var i=0;i<managers.length;i++){var m=managers[i]; if(m.getWeeklyHours()>40) notifications.push({type:'overload',message:m.name+': перегруз '+m.getWeeklyHours().toFixed(1)+'ч'});} }

// ====== ДАННЫЕ (Firebase) ======
function saveData() {
  try {
    var data = [];
    for (var i = 0; i < managers.length; i++) {
      var m = managers[i];
      var tasksData = [];
      for (var j = 0; j < m.tasks.length; j++) {
        var t = m.tasks[j];
        tasksData.push({
          title: t.title, type: t.type, hours: t.hours,
          deadline: t.deadline, description: t.description || '',
          status: t.status, completedDate: t.completedDate || null,
          assigneeName: t.assignee ? t.assignee.name : null
        });
      }
      data.push({ name: m.name, tasks: tasksData });
    }
    dataRef.set(data);
  } catch(e) {}
}

// ====== КЛИКИ ======
function mousePressed() {
  if (!dataLoaded) return;
  if (mouseX > 1095 && mouseX < 1130 && mouseY > 10 && mouseY < 45) { showNotifications = !showNotifications; return; }
  if (showNotifications) {
    if (mouseX < 900 || mouseX > 1160 || mouseY < 55 || mouseY > 275) showNotifications = false;
    if (mouseX > 915 && mouseX < 1145 && mouseY > 235 && mouseY < 260) { notifications = []; showNotifications = false; }
    return;
  }
  if (mouseY > 88 && mouseY < 120) {
    if (mouseX > 30 && mouseX < 170) { activeView = 'personal'; hideForm(); return; }
    if (mouseX > 175 && mouseX < 315) { activeView = 'team'; hideForm(); return; }
    if (mouseX > 320 && mouseX < 460) { activeView = 'calendar'; hideForm(); return; }
  }
  if (activeView === 'calendar') {
    for (var i = 0; i < managers.length; i++) {
      if (mouseX > 280+i*200 && mouseX < 460+i*200 && mouseY > 150 && mouseY < 176) calendarManager = managers[i];
    }
    return;
  }
  if (activeView === 'team') return;
  for (var i = 0; i < managers.length; i++) {
    if (mouseX > 120+i*180 && mouseX < 285+i*180 && mouseY > 136 && mouseY < 164) { currentManager = managers[i]; hideForm(); }
  }
  if (mouseX > 850 && mouseX < 1050 && mouseY > 710 && mouseY < 750) { showForm(); return; }
  if (currentManager && !showAddForm) {
    var blocks = [{tasks:currentManager.getWeeklyTasks(),x:30},{tasks:currentManager.getMonthlyTasks(),x:380},{tasks:currentManager.getOnetimeTasks(),x:730}];
    for (var b=0;b<blocks.length;b++) {
      var block=blocks[b]; var active=block.tasks.filter(function(t){return t.status!=='done';});
      for (var j=0;j<Math.min(active.length,5);j++) {
       var ty = 226;
for (var k = 0; k < j; k++) {
  var hasDesc = active[k].description && active[k].description.length > 0;
  ty += hasDesc ? 48 : 34;
}
        if (mouseX>block.x+308&&mouseX<block.x+330&&mouseY>ty+6&&mouseY<ty+26){currentManager.removeTask(active[j]);return;}
        if (mouseX>block.x+10&&mouseX<block.x+26&&mouseY>ty+6&&mouseY<ty+22){active[j].complete();saveData();return;}
      }
    }
    var completed=currentManager.getCompletedTasks();
    for (var k=0;k<Math.min(completed.length,4);k++) {
      var t=completed[k],ty=490+k*30;
      if (mouseX>335&&mouseX<360&&mouseY>ty+3&&mouseY<ty+23){currentManager.removeTask(t);return;}
      if (mouseX>290&&mouseX<325&&mouseY>ty+3&&mouseY<ty+23){t.reopen();saveData();return;}
    }
  }
}
