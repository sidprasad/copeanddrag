# Examples


- TODO: We detail some examples here.
- Examples can be downloaded as diagram zps which can be loaded into Cope and Drag at the `/import` endpoint.
- We also provide interactive client side only versions of the examples -- however, you will not be able to alter the CnD spec.

---

{% set examples = [
    {
        "id": "bt",
        "title": "Binary Tree",
        "description": "Uses orientation constraints to ensure that a binary tree's children are appropriately laid out.",
        "image": "bt/icon.png",
        "example_link": "bt/diag.html",
        "download_link": "bt/bt.zip"
    },
    {
        "id": "fruit",
        "title": "Fruit in Baskeds",
        "description": "Uses grouping constraints to group a set of fruit by the baskets they are in, as well as group all rotten fruit in a basket together. Also uses icons to identify each fruit type.",
        "image": "fruit/icon.png",
        "example_link": "fruit/diag.html",
        "download_link": "fruit/fruit.zip"
    }
] %}

<div class="container">
  <div class="row">
    {% for example in examples %}
    <div class="col-md-12" style="margin-bottom: 20px;">
      <div class="card" style="display: flex; flex-direction: row; align-items: center; padding: 15px; border: 1px solid #ddd;">
        <!-- Text Column -->
        <div class="col-md-8">
          <h5 class="card-title">{{ example.title }}</h5>
          <p class="card-text">{{ example.description }}</p>
          <a href="{{ example.example_link }}" class="btn btn-primary" style="margin-right: 10px;">View Interactive Diagram</a>
          {% if example.download_link %}
          <a href="{{ example.download_link }}" class="btn btn-secondary" download>Download Example</a>
          {% endif %}
        </div>
        <!-- Image Column -->
        <div class="col-md-4 text-center">
          <img src="{{ example.image }}" alt="{{ example.title }}" style="max-height: 300px; max-width: 300px; width: auto; height: auto; border: 1px solid #ccc; padding: 5px;">
        </div>
      </div>
    </div>
    {% endfor %}
  </div>
</div>