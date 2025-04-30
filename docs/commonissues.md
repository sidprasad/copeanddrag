# Common Issues

This page documents common issues users have faced when using Cope and Drag, as well as work-arounds.
[We encourage you to file issues here if you see something not addressed below.](https://github.com/sidprasad/copeanddrag/issues)

### Local images as icons

Cope and Drag icons directives currently only support images hosted on publicly available URIs.
If you want a specific image on your local filesystem to be used in an icon directive:

- Generate a base64 encoding of this image ( [we've found this website useful](https://www.base64-image.de/)).
- Include the base 64 URI in your icon path as below:

```
- icon:
    path: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAO8AAAEACAMAAABsy9Fo....
    selector: someselector
```

Cope and Drag also includes a selection of [built in icons](img/bundledicons.md) for ease of use.