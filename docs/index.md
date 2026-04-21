---
layout: home

hero:
  name: Cope and Drag
  text: Diagramming by spatial refinement
  tagline: A language for describing diagrams by how their parts relate in space — built on Sterling, powered by SpyTial.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: CnD Language
      link: /cnd/
    - theme: alt
      text: View on GitHub
      link: https://github.com/sidprasad/copeanddrag

features:
  - title: Constraints, separate from directives
    details: Spatial constraints describe where atoms go. Visual directives describe how they look. The two compose independently.
  - title: For Alloy and Forge instances
    details: CnD reads solver output and lets you specify layouts declaratively over sigs, atoms, and fields — no pixel coordinates.
  - title: Grounded in how diagrams communicate
    details: The constraint and directive vocabulary is drawn from cognitive-science principles and corpus studies on spatial reasoning in diagrams.
  - title: Runs inside Sterling
    details: A fork of the Sterling visualizer for Alloy and Forge, with CnD replacing DAGRE as the layout engine.
---
