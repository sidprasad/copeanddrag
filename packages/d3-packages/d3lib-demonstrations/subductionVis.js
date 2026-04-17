let stage = new Stage()

let objectGrid = new Grid({
    grid_location: {x: 15, y: 50},
    grid_dimensions: {
        x_size: 5,
        y_size: 2
    },
    cell_size: {
        x_size: 120,
        y_size: 180
    }
})


objectGrid.hide_grid_lines()

stage.add(objectGrid)

let objectMap = {}

let specialMembers = Array.from(Subduction$0.join(special)
    .join(members)
    .tuples()
    .map((member) => "s" + member
            .atoms()[0]
            .id()
            .slice(0, -2)))

specialMembers = [specialMembers[0], specialMembers[2], specialMembers[1]]
    
let generalMembers = Array.from(Subduction$0.join(general)
    .join(members)
    .tuples()
    .map((member) => "g" + member
            .atoms()[0]
            .id()
            .slice(0, -2)))

let specialLinks = Array.from(Subduction$0.join(special)
    .join(links).tuples().map(member => member.atoms()[0])
    .map((link) => {
        let source = Subduction$0
            .join(special)
            .join(outLinks)
            .join(link)
            .tuples()
            .map(tuple => "s" + tuple.atoms()[0].id().slice(0, -2))[0] ?? 
            Subduction$0
            .join(general)
            .join(outLinks)
            .join(link)
            .tuples()
            .map(tuple => "g" + tuple.atoms()[0].id().slice(0, -2))[0]

        let sink = Subduction$0
            .join(special)
            .join(inLinks)
            .join(link)
            .tuples()
            .map(tuple => "s" + tuple.atoms()[0].id().slice(0, -2))[0] ??
            Subduction$0
            .join(general)
            .join(inLinks)
            .join(link)
            .tuples()
            .map(tuple => "g" + tuple.atoms()[0].id().slice(0, -2))[0]

        return [link.id().slice(0, -2), source, sink]
    }))

generalLinks = Array.from(Subduction$0.join(general)
    .join(links).tuples().map(member => member.atoms()[0])
    .map((link) => {
        let source = Subduction$0
            .join(general)
            .join(outLinks)
            .join(link)
            .tuples()
            .map(tuple => "g" + tuple.atoms()[0].id().slice(0, -2))[0]

        let sink = Subduction$0
            .join(general)
            .join(inLinks)
            .join(link)
            .tuples()
            .map(tuple => "g" + tuple.atoms()[0].id().slice(0, -2))[0]

        return [link.id().slice(0, -2), source, sink]
    }))

attachments = Array.from(Subduction$0
    .join(layering)
    .join(attachments)
    .tuples().map((attachment) => {
        source = "s" + attachment.atoms()[0].id().slice(0, -2)
        sink = "g" + attachment.atoms()[1].id().slice(0, -2)
        return ["", source, sink]
    }))

/**
 * Everything from this point forward will be the actual visualization.
 */

specialMembers.forEach((member, i) => {
    let circ = new Circle({
        radius: 20,
        color: "white",
        borderWidth: 2,
        borderColor: "black",
        labelSize: 9,
        label: member.slice(1)
    })
    objectMap[member] = circ
    objectGrid.add({
        x: 1 + i,
        y: 0
    }, circ)
})

generalMembers.forEach((member, i) => {
    let circ = new Circle({
        radius: 20,
        color: "white",
        borderWidth: 2,
        borderColor: "black",
        labelSize: 9,
        label: member.slice(1)
    })
    objectMap[member] = circ
    objectGrid.add({
        x: i,
        y: 1
    }, circ)
})

attachments.concat(generalLinks).concat(specialLinks).forEach((link) => {
    if (link[1] != link[2]){
    let edge = new Edge({
            obj1: objectMap[link[1]],
            obj2: objectMap[link[2]],
            lineProps: {
                arrow: true,
                width: 2,
            },
            textProps: {
                text: link[0],
                fontSize: 9
            },
            textLocation: "clockwise"
        })

    stage.add(edge)
    }
})

topBox = boxUnion(["sM1", "sM5", "sM3"].map(id => objectMap[id].boundingBox()))
topRect = new Rectangle({
    center: {
        x: topBox.top_left.x - 20,
        y: topBox.top_left.y - 20
        },
    width: topBox.bottom_right.x - topBox.top_left.x + 20,
    height: topBox.bottom_right.y - topBox.top_left.y + 20,
    opacity: 1,
    color: "red",
    borderWidth: 2,
    borderColor: "black"
})
console.log(topRect.center())
stage.add(topRect)


stage.render(svg, document)
