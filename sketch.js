function setup() {
  createCanvas(400, 400);
  background('#f5f6fa');
  fill('#2d3436');
  textSize(20);
  textAlign(CENTER);
  text('Если видишь это - p5 работает', 200, 180);
  text('Нажми в любое место', 200, 220);
}

function mousePressed() {
  alert('mousePressed работает! X=' + mouseX + ' Y=' + mouseY);
}
