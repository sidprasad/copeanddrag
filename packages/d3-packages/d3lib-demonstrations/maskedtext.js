const stage = new Stage();

const text = new TextBox({
  text: 'hi',
  coords: { x: 50, y: 50 },
  fontSize: 100
});
text.addMask({ top_left: { x: 0, y: 0 }, bottom_right: { x: 30, y: 30 } });

stage.add(text);
stage.render(svg);
