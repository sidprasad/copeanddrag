/**
 * CONSTANTS
 */

FONT_SIZE = 9;
LINE_WIDTH = 1;
CIRCLE_RADII = 17;
VERTICAL_DISTANCE = 180;
HORIZONTAL_DISTANCE = 120;
BOUNDBOXPADDING = 30;

/**
 * Deriving logical representations of objects.
 */

let stage = new Stage();

let objectGrid = new Grid({
  grid_location: { x: 15, y: 50 },
  grid_dimensions: {
    x_size: 5,
    y_size: 2
  },
  cell_size: {
    x_size: HORIZONTAL_DISTANCE,
    y_size: VERTICAL_DISTANCE
  }
});

objectGrid.hide_grid_lines();

stage.add(objectGrid);

let objectMap = {};

let specialMembers = Array.from(
  Subduction$0.join(special)
    .join(members)
    .tuples()
    .map((member) => 's' + member.atoms()[0].id().slice(0, -2))
);

specialMembers = [specialMembers[0], specialMembers[2], specialMembers[1]];

let generalMembers = Array.from(
  Subduction$0.join(general)
    .join(members)
    .tuples()
    .map((member) => 'g' + member.atoms()[0].id().slice(0, -2))
);

let specialLinks = Array.from(
  Subduction$0.join(special)
    .join(links)
    .tuples()
    .map((member) => member.atoms()[0])
    .map((link) => {
      let source =
        Subduction$0.join(special)
          .join(outLinks)
          .join(link)
          .tuples()
          .map((tuple) => 's' + tuple.atoms()[0].id().slice(0, -2))[0] ??
        Subduction$0.join(general)
          .join(outLinks)
          .join(link)
          .tuples()
          .map((tuple) => 'g' + tuple.atoms()[0].id().slice(0, -2))[0];

      let sink =
        Subduction$0.join(special)
          .join(inLinks)
          .join(link)
          .tuples()
          .map((tuple) => 's' + tuple.atoms()[0].id().slice(0, -2))[0] ??
        Subduction$0.join(general)
          .join(inLinks)
          .join(link)
          .tuples()
          .map((tuple) => 'g' + tuple.atoms()[0].id().slice(0, -2))[0];

      return [link.id().slice(0, -2), source, sink];
    })
);

generalLinks = Array.from(
  Subduction$0.join(general)
    .join(links)
    .tuples()
    .map((member) => member.atoms()[0])
    .map((link) => {
      let source = Subduction$0.join(general)
        .join(outLinks)
        .join(link)
        .tuples()
        .map((tuple) => 'g' + tuple.atoms()[0].id().slice(0, -2))[0];

      let sink = Subduction$0.join(general)
        .join(inLinks)
        .join(link)
        .tuples()
        .map((tuple) => 'g' + tuple.atoms()[0].id().slice(0, -2))[0];

      return [link.id().slice(0, -2), source, sink];
    })
);

attachments = Array.from(
  Subduction$0.join(layering)
    .join(attachments)
    .tuples()
    .map((attachment) => {
      source = 's' + attachment.atoms()[0].id().slice(0, -2);
      sink = 'g' + attachment.atoms()[1].id().slice(0, -2);
      return ['', source, sink];
    })
);

/**
 * Everything from this point forward will be the actual visualization.
 */

specialMembers.forEach((member, i) => {
  let circ = new Circle({
    radius: CIRCLE_RADII,
    color: 'white',
    borderWidth: LINE_WIDTH,
    borderColor: 'black',
    labelSize: FONT_SIZE,
    label: member.slice(1)
  });
  objectMap[member] = circ;
  objectGrid.add(
    {
      x: 1 + i,
      y: 0
    },
    circ
  );
});

generalMembers.forEach((member, i) => {
  let circ = new Circle({
    radius: CIRCLE_RADII,
    color: 'white',
    borderWidth: LINE_WIDTH,
    borderColor: 'black',
    labelSize: FONT_SIZE,
    label: member.slice(1)
  });
  objectMap[member] = circ;
  objectGrid.add(
    {
      x: i,
      y: 1
    },
    circ
  );
});

attachments
  .concat(generalLinks)
  .concat(specialLinks)
  .forEach((link) => {
    if (link[1] != link[2]) {
      let edge = new Edge({
        obj1: objectMap[link[1]],
        obj2: objectMap[link[2]],
        lineProps: {
          arrow: true,
          width: LINE_WIDTH
        },
        textProps: {
          text: link[0],
          fontSize: FONT_SIZE
        },
        textLocation: 'clockwise'
      });

      stage.add(edge);
    }
  });

topBox = boxUnion(
  ['sM1', 'sM5', 'sM3'].map((id) => objectMap[id].boundingBox())
);
topRect = new Rectangle({
  center: {
    x: topBox.top_left.x - BOUNDBOXPADDING,
    y: topBox.top_left.y - BOUNDBOXPADDING
  },
  width: topBox.bottom_right.x - topBox.top_left.x + BOUNDBOXPADDING * 2,
  height: topBox.bottom_right.y - topBox.top_left.y + BOUNDBOXPADDING * 2,
  color: 'rgba(198, 45, 205, 0)',
  borderWidth: LINE_WIDTH,
  borderColor: 'black',
  label: 'special',
  labelSize: FONT_SIZE,
  labelLocation: 'topLeft'
});

bottomBox = boxUnion(
  ['gM0', 'gM1', 'gM2', 'gM3', 'gM4'].map((id) => objectMap[id].boundingBox())
);
bottomRect = new Rectangle({
  center: {
    x: bottomBox.top_left.x - BOUNDBOXPADDING,
    y: bottomBox.top_left.y - BOUNDBOXPADDING
  },
  width: bottomBox.bottom_right.x - bottomBox.top_left.x + BOUNDBOXPADDING * 2,
  height: bottomBox.bottom_right.y - bottomBox.top_left.y + BOUNDBOXPADDING * 2,
  color: 'rgba(198, 45, 205, 0)',
  borderWidth: LINE_WIDTH,
  borderColor: 'black',
  label: 'general',
  labelSize: FONT_SIZE,
  labelLocation: 'bottomLeft'
});

stage.add(topRect);
stage.add(bottomRect);

const fullObjs = ['sM1', 'sM5', 'sM3', 'gM0', 'gM1', 'gM2', 'gM3', 'gM4'];
const fullObjBox = new Hull({
  objs: fullObjs.map((id) => objectMap[id]),
  fuzz: 80
});
fullObjBox.addMask({
  top_left: { x: 0, y: 290 },
  bottom_right: { x: 1000, y: 1000 }
});

stage.add(fullObjBox);

stage.render(svg, document);
