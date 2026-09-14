---
title: Why we rebuilt our search stack
date: 2026-02-14
excerpt: What we learned replacing keyword search with a hybrid of BM25 and vectors.
image: assets/blog/search-stack.png
---

Search was the part of our product people complained about most, and the part we understood worst. So we spent a quarter rebuilding it.

## What we had

Postgres full text search, tuned once in 2021 and never revisited. It worked well until documents got long, then recall fell off a cliff.

- **Lexical** search missed paraphrases.
- **Vector** search alone missed exact identifiers, error codes and part numbers.
- Neither of them knew whether a result was **fresh**.

## What we built

A hybrid: BM25 for the exact matches, vectors for meaning, then a reranker over the top fifty of each.

```
lexical  = bm25.search(query, k=50)
semantic = vectors.search(query, k=50)
results  = rerank(lexical + semantic)[:10]
```

## What changed

Recall on the evaluation set went from 0.61 to 0.88. More importantly, p95 stayed under 200 ms, because the reranker only ever sees a hundred candidates.

> Hybrid search is not a research project. It is a weekend, plus a month of tuning.

The tuning is the whole job. The model does not know your users, and it never will.
