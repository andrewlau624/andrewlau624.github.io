# andrewlau624.github.io

A one screen portfolio in the dark. A name, a line, three tabs, your links,
and an Apollo IE you can drive. One typeface for the whole page, a visible
grain, no accent colour.

This is the GitHub Pages user site, so everything here sits at the root and
publishes to <https://andrewlau624.github.io/> on every push to `main`.

## Run it

```bash
python3 -m http.server 8001
# open http://localhost:8001
```

Serve it, so the 3D car can load Three.js as an ES module. Opened straight
from disk the page still works and the car area says to serve locally.

Or `npm run serve`, which is the same command.

```
.
  index.html    the one page.
  blog.html     the writing list.
  post.html     one post.
  content.js    all content. Written by npm run edit.
  render.js     the column, tabs, items, links, and the car.
  blog.js       the writing list.
  post.js       one post, with the markdown renderer inline.
  stage.js      the car, and the driving game.
  styles.css    the theme.
  posts.js      the generated manifest of the posts.
  posts/        the writing, one markdown file per post.
  scripts/      the editor, and the markdown renderer.
  assets/       the cars, and the images the writing uses.
  resume.pdf
  README.md
```

## Editing everything

```bash
npm run edit
```

That opens an editor at `localhost:4174`. It is the real page, with a small
control beside every field on it:

- **text** name, role, line, and the location in the footer
- **links** edit, delete, and add
- **tabs** edit, delete, and add, plus the blog tab
- **groups** the category labels, with edit, delete, and add
- **items** every row, with edit, delete, and add
- **the song** the Spotify link in the Personal tab
- **the cars** behind the cars button
- **the writing** behind the posts button

The controls are always visible, sitting next to the thing they change. Press
**Done** and it writes `content.js`, then runs `git add`, `git commit` and
`git push`. If git fails it prints the command to run by hand.

Flags: `--port 4174`, `--no-git`, `--no-open`.

## Writing a post

The **posts** button on the edit page. It lists every post, with edit and
delete, and **New post** starts one. Each post opens with its title, date and
summary, a toolbar, the markdown, and the real post page beside it.

The preview is the real post page: the same stylesheet, the same column
width, the same renderer, drawn in an iframe and scaled to fit, so what you
see is exactly what ships. The markdown behaves like an editor:

- Enter continues a list or a quote, and an empty item ends it
- Tab and Shift+Tab indent and outdent
- Cmd or Ctrl with B or I, and the toolbar toggles rather than inserting
- Image and File upload to `assets/` and drop the markdown in for you
- Cover picks the one image the list shows

**Save** writes `posts/<slug>.md`, saves the cover, and rebuilds `posts.js`.
The single **Done** on the page then commits and pushes everything together.

Markdown lives in `posts/*.md` with front matter:

```
---
title: Why we rebuilt our search stack
date: 2026-02-14
excerpt: One line for the list.
image: assets/blog/search-stack.png
---

The body.
```

`scripts/build-posts.mjs` turns those into `posts.js`, the manifest the site
loads. Run it alone with `npm run build:posts`. `scripts/markdown.mjs` is the
renderer shared by the editor preview; `post.js` carries the same code so the
site stays dependency free.

## Tabs

`tabs` in `content.js` drives the whole thing. Each tab has a `label` and one
or more `groups`, and each group has a `label` and `items`. Group labels are
hidden when a tab has only one group.

- **Work** holds industry, projects, then education.
- **Leadership** holds leadership, volunteering, then awards.
- **Personal** holds hobbies, and a song.

## The cars

Three cars sit in `assets/`, listed in `car.models` in `content.js`:

| Car          | File                  | Size   | Colour    |
| ------------ | --------------------- | ------ | --------- |
| Apollo IE    | `assets/apollo.glb`   | 0.5 MB | `#a03328` |
| Corvette ZR1 | `assets/corvette.glb` | 3.1 MB | `#d8a41f` |
| Ferrari SF90 | `assets/ferrari.glb`  | 3.3 MB | `#c8102e` |

One turns on a stand while the rest load. Every seven seconds the next one
takes its place, and the arrow on the right steps through them by hand. Drag
to spin the car on the stand.

The moment you press a key it drops into a driving view:

- **Up / W** accelerate, **Down / S** brake then reverse
- **Left / Right** steer, turning only while you are rolling
- **Shift / Space** boost
- Speed and distance read out in the bottom right

The wheels roll with speed, the rear lights flare when you brake, and the
camera orbits rather than cutting through the car. Each car uses its real
acceleration and top speed, so an Apollo and a Corvette do not feel alike.

Materials are matched by name, so paint, glass, carbon, wheels, lights and
interior land in the right places across all three. The body colour and the
figures are the values per car in `content.js`. Check each model's license
before you publish it.

## The song

The **Personal** tab holds a Spotify embed. Paste any track, album or playlist
link from open.spotify.com into `song.url` in `content.js`, or edit it on the
page. Leave it empty and the slot shows a placeholder.

## Type and colour

One family, **Schibsted Grotesk**, for the whole page. Warm off-white on near
black, three steps of opacity for hierarchy, a hairline rule, and a grain
layer at `body::before` in `styles.css`.

## Notes

- Fits one screen at 1440x900 and 1280x800. Under 700px it scrolls.
- `prefers-reduced-motion` is respected.
- Any static host works. This repo is the GitHub Pages user site, served from
  the root of `main`.
