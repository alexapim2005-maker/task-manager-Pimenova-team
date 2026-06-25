let managers = [];
let currentManager = null;
let showAddForm = false;
let newTaskTitle = '';
let newTaskHours = '';
let newTaskDeadline = '';
let newTaskType = 'weekly';
let newTaskAssignee = null;

function setup() {
  createCanvas(1200, 800);
  textFont('Arial');
  
  // Всегда создаём новые данные
  managers = [];
  let alex = new Manager('Александра Пименова');
  let vera = new Manager('Вера Гусева');
  let vary = new Manager('Варвара Андреева');
  managers.push(alex, vera, vary);
  
  alex.tasks.push(new Task('Отчёт', 'weekly', 2, 'ПН', alex));
  alex.tasks.push(new Task('Совещание', 'weekly', 1, 'СР', alex));
  vera.tasks.push(new Task('Звонки', 'weekly', 3, 'ВТ', vera));
  vary.tasks.push(new Task('Анализ', 'weekly', 4, 'ЧТ', vary));
  
  currentManager = managers[0];
  newTaskAssignee = currentManager;
}

function draw() {
  background('#f5f6fa');
  
  // Заголовок
  fill('#2d3436'); textSize(24); textStyle(BOLD); text('Таск Менеджер', 30, 40); textStyle(NORMAL);
  
  // Выбор менеджера
  for (let i = 0; i < managers.length; i++) {
    let bx = 30 + i * 160;
    fill(managers[i] === currentManager ? '#6c5ce7' : '#dfe6e9');
    noStroke(); rect(bx, 60, 150, 30, 6);
    fill(managers[i] === currentManager ? '#fff' : '#2d3436');
    textSize(13); textAlign(CENTER); text(managers[i].name, bx+75, 80); textAlign(LEFT);
  }
  
  // Кнопка "Добавить"
  fill('#00b894'); noStroke(); rect(30, 110, 200, 40, 8);
  fill('#fff'); textSize(16); textAlign(CENTER); text('+ Новая задача', 130, 136); textAlign(LEFT);
  
  // Задачи
  let y = 170;
  fill('#6c5ce7'); noStroke(); rect(30, y, 1140, 32, 6);
  fill('#fff'); textSize(15); textStyle(BOLD); text('Задачи: ' + currentManager.name, 45, y+22); textStyle(NORMAL);
  
  y += 40;
  
  for (let i = 0; i < currentManager.tasks.length; i++) {
    let task = currentManager.tasks[i];
    
    // Фон задачи
    if (task.status === 'done') {
      fill('#dfe6e9');
    } else {
      fill('#ffffff');
    }
    stroke('#e0e0e0'); strokeWeight(1); rect(30, y, 1140, 40, 4);
    noStroke();
    
    // Чекбокс
    if (task.status === 'done') {
      fill('#00b894');
    } else {
      fill('#ffffff');
    }
    stroke('#b2bec3'); strokeWeight(2); rect(45, y+10, 20, 20, 3);
    if (task.status === 'done') {
      stroke('#fff'); strokeWeight(2); line(49, y+20, 53, y+24); line(53, y+24, 62, y+14);
    }
    noStroke();
    
    // Название
    fill(task.status === 'done' ? '#b2bec3' : '#2d3436');
    textSize(14);
    if (task.status === 'done') textStyle(ITALIC);
    text(task.title, 75, y+26);
    textStyle(NORMAL);
    
    // Инфо
    fill('#636e72'); textSize(11);
    text(task.hours + 'ч | ' + task.deadline + ' | ' + task.assignee.name, 75, y+14);
    
    // Кнопка удаления
    fill('#e74c3c'); noStroke(); rect(1125, y+8, 30, 24, 4);
    fill('#fff'); textSize(16); textAlign(CENTER); text('×', 1140, y+27); textAlign(LEFT);
    
    y += 45;
  }
  
  // Форма добавления
  if (showAddForm) {
    fill(0, 0, 0, 100); noStroke(); rect(0, 0, 1200, 800);
    fill('#fff'); stroke('#636e72'); strokeWeight(2); rect(200, 250, 800, 300, 12);
    noStroke();
    fill('#2d3436'); textSize(20); textStyle(BOLD); text('Новая задача', 230, 290); textStyle(NORMAL);
    
    // Поля ввода
    fill('#fff'); stroke('#b2bec3'); strokeWeight(1); rect(230, 310, 300, 35, 4);
    fill('#636e72'); textSize(14); text(newTaskTitle || 'Название', 240, 333);
    
    rect(550, 310, 80, 35, 4);
    text(newTaskHours || 'Часы', 560, 333);
    
    rect(650, 310, 120, 35, 4);
    text(newTaskDeadline || 'Дедлайн', 660, 333);
    
    // Тип задачи
    let types = ['weekly', 'monthly', 'onetime'];
    let typeNames = ['Еженед', 'Ежемес', 'Разов'];
    for (let i = 0; i < 3; i++) {
      let tx = 230 + i * 100;
      fill(newTaskType === types[i] ? '#6c5ce7' : '#dfe6e9');
      noStroke(); rect(tx, 360, 90, 30, 4);
      fill(newTaskType === types[i] ? '#fff' : '#2d3436');
      textSize(12); textAlign(CENTER); text(typeNames[i], tx+45, 380); textAlign(LEFT);
    }
    
    // Ответственный
    fill('#636e72'); textSize(13); text('Ответственный:', 230, 415);
    for (let i = 0; i < managers.length; i++) {
      let mx = 370 + i * 170;
      fill(newTaskAssignee === managers[i] ? '#0984e3' : '#dfe6e9');
      noStroke(); rect(mx, 400, 150, 28, 4);
      fill(newTaskAssignee === managers[i] ? '#fff' : '#2d3436');
      textSize(12); textAlign(CENTER); text(managers[i].name, mx+75, 419); textAlign(LEFT);
    }
    
    // Кнопки сохранить/отмена
    fill('#00b894'); noStroke(); rect(230, 450, 150, 40, 8);
    fill('#fff'); textSize(16); textAlign(CENTER); text('💾 Сохранить', 305, 476); textAlign(LEFT);
    
    fill('#d63031'); rect(400, 450, 120, 40, 8);
    fill('#fff'); textSize(16); textAlign(CENTER); text('Отмена', 460, 476); textAlign(LEFT);
  }
}

// Классы
class Manager {
  constructor(name) { this.name = name; this.tasks = []; }
}

class Task {
  constructor(title, type, hours, deadline, assignee) {
    this.title = title; this.type = type; this.hours = hours;
    this.deadline = deadline; this.assignee = assignee; this.status = 'todo';
  }
}

// Клики
function mousePressed() {
  // Выбор менеджера
  for (let i = 0; i < managers.length; i++) {
    if (mouseX > 30+i*160 && mouseX < 180+i*160 && mouseY > 60 && mouseY < 90) {
      currentManager = managers[i];
      return;
    }
  }
  
  // Кнопка "Добавить"
  if (mouseX > 30 && mouseX < 230 && mouseY > 110 && mouseY < 150) {
    showAddForm = true;
    return;
  }
  
  // Если форма открыта
  if (showAddForm) {
    // Тип задачи
    let types = ['weekly', 'monthly', 'onetime'];
    for (let i = 0; i < 3; i++) {
      if (mouseX > 230+i*100 && mouseX < 320+i*100 && mouseY > 360 && mouseY < 390) {
        newTaskType = types[i];
        return;
      }
    }
    
    // Ответственный
    for (let i = 0; i < managers.length; i++) {
      if (mouseX > 370+i*170 && mouseX < 520+i*170 && mouseY > 400 && mouseY < 428) {
        newTaskAssignee = managers[i];
        return;
      }
    }
    
    // Сохранить
    if (mouseX > 230 && mouseX < 380 && mouseY > 450 && mouseY < 490) {
      if (newTaskTitle && newTaskHours && newTaskDeadline) {
        let task = new Task(newTaskTitle, newTaskType, parseInt(newTaskHours), newTaskDeadline, newTaskAssignee);
        newTaskAssignee.tasks.push(task);
        newTaskTitle = ''; newTaskHours = ''; newTaskDeadline = '';
        showAddForm = false;
      }
      return;
    }
    
    // Отмена
    if (mouseX > 400 && mouseX < 520 && mouseY > 450 && mouseY < 490) {
      showAddForm = false;
      return;
    }
    
    return;
  }
  
  // Клики по задачам
  for (let i = 0; i < currentManager.tasks.length; i++) {
    let ty = 210 + i * 45;
    
    // Удаление
    if (mouseX > 1125 && mouseX < 1155 && mouseY > ty+8 && mouseY < ty+32) {
      currentManager.tasks.splice(i, 1);
      return;
    }
    
    // Чекбокс
    if (mouseX > 45 && mouseX < 65 && mouseY > ty+10 && mouseY < ty+30) {
      let task = currentManager.tasks[i];
      task.status = task.status === 'done' ? 'todo' : 'done';
      return;
    }
  }
}

// Ввод с клавиатуры
function keyPressed() {
  if (showAddForm) {
    if (keyCode === BACKSPACE) {
      if (mouseX > 230 && mouseX < 530 && mouseY > 310 && mouseY < 345) {
        newTaskTitle = newTaskTitle.slice(0, -1);
      } else if (mouseX > 550 && mouseX < 630 && mouseY > 310 && mouseY < 345) {
        newTaskHours = newTaskHours.slice(0, -1);
      } else if (mouseX > 650 && mouseX < 770 && mouseY > 310 && mouseY < 345) {
        newTaskDeadline = newTaskDeadline.slice(0, -1);
      }
    } else if (keyCode === ENTER) {
      if (newTaskTitle && newTaskHours && newTaskDeadline) {
        let task = new Task(newTaskTitle, newTaskType, parseInt(newTaskHours), newTaskDeadline, newTaskAssignee);
        newTaskAssignee.tasks.push(task);
        newTaskTitle = ''; newTaskHours = ''; newTaskDeadline = '';
        showAddForm = false;
      }
    } else if (key.length === 1) {
      if (mouseX > 230 && mouseX < 530 && mouseY > 310 && mouseY < 345) {
        newTaskTitle += key;
      } else if (mouseX > 550 && mouseX < 630 && mouseY > 310 && mouseY < 345) {
        newTaskHours += key;
      } else if (mouseX > 650 && mouseX < 770 && mouseY > 310 && mouseY < 345) {
        newTaskDeadline += key;
      }
    }
  }
}
