---
title: Notes on prompt compression
date: 2026-03-02
excerpt: The small tricks that took a third off our token bill.
image:
---

Compression sounds exotic. In practice it is three boring things done carefully.

## Drop what the model does not read

Most prompts carry the same twenty lines of instructions on every call. Audit what actually changes between calls, and cache the rest.

## Rewrite, do not summarise

Ask the model to compress its own context and it will lose detail. Ask it to **restate** the same facts in fewer words, and check the result against a schema.

## Route by difficulty

A classifier that only has to answer *is this easy* is cheap. Send the easy half to a smaller model and the bill falls without a quality drop.

The result was about a third off, at the same evaluation score.
