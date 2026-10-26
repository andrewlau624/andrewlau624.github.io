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

Serve it, so the 3D car can load Three.js as an ES module, and so the
visualizer can load its algorithms as modules. Opened straight from disk the
page still works, the car area says to serve locally, and the algorithms page
stays blank.

Or `npm run serve`, which is the same command.

```
.
  index.html    the one page.
  blog.html     the writing list.
  post.html     one post.
  algorithms.html  the visualizer.
  content.js    all content. Written by npm run edit.
  render.js     the column, tabs, items, links, and the car.
  blog.js       the writing list.
  post.js       one post, with the markdown renderer inline.
  stage.js      the car, and the driving game.
  algorithms.js the visualizer shell: clock, controls, canvas.
  algorithms/   the algorithms, and the views they draw with.
  styles.css    the theme.
  posts.js      the generated manifest of the posts.
  posts/        the writing, one markdown file per post.
  scripts/      the editor, and the markdown renderer.
  assets/       the cars, and the images the writing uses.
  andrew_lau_resume.pdf
  README.md
```

## Editing everything

```bash
npm run edit
```

That opens an editor at `localhost:4174`. It is the real page, with a small,
quiet control inside every thing on it:

- **text** name, role, line, and the location in the footer
- **links** edit, delete, and add, on the links row
- **groups** the category labels, with edit, delete, and add
- **items** every row, with edit, delete, and add
- **the song** the Spotify link in the Personal tab
- **the tabs** behind the tabs button, with reorder, plus the blog tab
- **the cars** behind the cars button, with reorder
- **the writing** behind the posts button, drawn as the blog list itself

Editing opens a card with that thing's fields, and the card carries **up** and
**down** so it can be moved in its list, keeping the page itself free of
arrows. The tab row is left alone, since tabs are managed from their card.
Press **Done** and it writes `content.js`, then runs `git add`, `git commit`
and `git push`. If git fails it prints the command to run by hand.

Flags: `--port 4174`, `--no-git`, `--no-open`.

## Writing a post

The **posts** button on the edit page. It lists every post, with edit and
delete, and **New post** starts one. Each post opens with its title, date,
category and summary, a toolbar, the markdown, and the real post page beside
it. **Category** files the post into a folder, and every category already in
use is offered as you type, so an existing one can be reused rather than
retyped. Changing it moves the file, and an emptied folder is cleared away.

The preview is the real post page: the same stylesheet, the same column
width, the same renderer, drawn in an iframe and scaled to fit, so what you
see is exactly what ships. The markdown behaves like an editor:

- Enter continues a list or a quote, and an empty item ends it
- Tab and Shift+Tab indent and outdent
- Cmd or Ctrl with B or I, and the toolbar toggles rather than inserting
- **Link** wraps whatever is selected, so the text carries the link. With
  nothing selected it drops in `[text](url)` and leaves `text` picked out
- Image and File upload to `assets/` and drop the markdown in for you
- Cover picks the one image the list shows
- maths, written as `$z_i$` inline or `$$ ... $$` on its own, rendered by
  KaTeX. A `$$` block is kept out of the paragraph flow, so it stays a block
- tables, written as `| a | b |` with a `|---|---:|` rule under the header.
  The rule sets the alignment, and the numbers line up on tabular figures

**Save & push** writes `posts/<slug>.md`, saves the cover, rebuilds
`posts.js`, then commits and pushes. Deleting a post does the same. The
**Done** on the page writes `content.js` and pushes that too.

Markdown lives under `posts/`, at any depth, with front matter:

```
---
title: Why we rebuilt our search stack
date: 2026-02-14
excerpt: One line for the list.
image: assets/blog/search-stack.png
category: Systems
---

The body.
```

`scripts/build-posts.mjs` turns those into `posts.js`, the manifest the site
loads. Run it alone with `npm run build:posts`. `scripts/markdown.mjs` is the
renderer shared by the editor preview; `post.js` carries the same code so the
site stays dependency free.

## Algorithms

`algorithms.html` is the visualizer. The running algorithm sits at the top:
its name, its complexity, a stage on the left and its pseudocode on the right,
with the line for the current step lit up. Three controls: **Next** (or Space,
or the right arrow), **Auto**, and **Reset**. The left arrow steps back and R
resets. Below that, the algorithms are grouped by kind, and each group
collapses. The chosen algorithm sits in the address bar, so
`algorithms.html#quick` links straight to quicksort.

Five views draw everything, and they all print the numbers:

- **array** bars with their values, for sorting
- **grid** cells with distances or visit order, for pathfinding
- **graph** weighted edges, settled distances, and spanning trees
- **tree** nodes with their values in order, for a binary search tree
- **attention** the weight matrix and the output each query writes

A view owns how to make an input, how to fold an event into its state, and how
to draw it. The shell owns the clock, the controls, and the code panel, which
is what keeps a new algorithm small.

An algorithm is one module: metadata, pseudocode, a map from event to line, and
a generator. `time`, `omega` and `theta` are the worst, best and tight bounds,
shown in a footer under the pseudocode, with `space` beneath them.

```js
export default {
  id: "bubble",
  name: "Bubble Sort",
  view: "array",
  time: "O(n²)",
  omega: "Ω(n)",
  theta: "Θ(n²)",
  space: "O(1)",
  blurb: "One line, shown on the page.",
  code: ["for end = n-1 down to 1:", "  ...", "    swap a[i], a[i+1]"],
  lines: { compare: 0, swap: 2 },
  *run(input) {
    // input.values is a shuffled array
    yield ["compare", i, j];
    yield ["swap", i, j];
    yield ["done"];
  }
};
```

The events a view understands are listed at the top of its file under
`algorithms/views/`. Add the module to the two lists in `algorithms/index.js`
and it appears, with stepping, autoplay, and the code panel, and nothing else
to wire. `lines` can also be a function of the event when one op maps to
different places, as it does in the tree.

An algorithm can also override its view's parameters, since selection merges
`algo.defaults` over `view.defaults`. The minimum spanning trees set
`anchors: false` to drop the start and target rings that Dijkstra draws, and
the graph view understands a `pass` event for an edge skipped because it would
close a cycle.

The site has one accent, a soft blue, and the views spend it only on a
finished result: the found route, the tree the MST settled on, the sorted bars,
the node a search landed on, the attention output. Work in progress stays
off-white at a different wash, or a different shape, so the blue always reads
as the answer.

## Folders and pages

A folder under `posts/` is a category, and `category:` in front matter names
it. The blog list grows a row of category links when there is more than one,
`blog.html?c=llms` narrows to one category, and `blog.perPage` in
`content.js` sets how many posts a page holds. Past that, the list pages
itself with newer/older and page numbers, and paging keeps the category.
Each post carries its category under the title, linking back to that list.

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
