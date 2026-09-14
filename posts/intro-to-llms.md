---
title: Intro to LLMs
date: 2026-09-14
excerpt: 
image: 
---

# Intro to LLMs

While many use it regularly, they may not know the inner workings of LLMs. On a high-level, LLMs are autoregressive models, meaning that they predict the next word based off the previous one. To understand more, let's first familiarize ourselves with some LLM terminology.

---

## Sampling

**Sampling** is the process of choosing the next token from the probability distribution produced by an LLM.

### Temperature

Temperature controls how randomly an LLM samples its next token.

The formula is:

$$
P_i = \frac{e^{z_i/T}}{\sum_{j} e^{z_j/T}}
$$

Where:

* $z_i$ = the model's logit (raw score) for token $i$
* $T$ = temperature
* $P_i$ = probability of selecting token $i$

**Low temperature ($T < 1$):** Makes the probability distribution more concentrated, so the model is more deterministic.

**Temperature = 1:** Uses the original probability distribution.

**High temperature ($T > 1$):** Makes the probability distribution flatter, increasing randomness and diversity.

In simple terms, temperature scales the logits before applying softmax, controlling how predictable or random the next-token selection is.

### Top-K and Top-P

**Top-K:** Limits the possible tokens to the top-$K$ highest-probability options before sampling.

**Top-P (Nucleus Sampling):** Limits the possible tokens to the smallest set whose cumulative probability is at least $P$.

For example, if the model predicts:

| Token  | Probability |
| ------ | ----------: |
| "the"  |        0.50 |
| "a"    |        0.25 |
| "one"  |        0.15 |
| "this" |        0.07 |
| "my"   |        0.03 |

With **Top-K = 3**, only `"the"`, `"a"`, and `"one"` can be selected.

With **Top-P = 0.80**, the model selects the smallest set of tokens whose cumulative probability reaches 0.80:

$$
0.50 + 0.25 + 0.15 = 0.90
$$

So `"the"`, `"a"`, and `"one"` would be included.

In simple terms:

* **Top-K:** "Only consider the $K$ most likely tokens."
* **Top-P:** "Consider as many tokens as needed to reach probability $P$."

---

# Tokens

LLMs do not directly process words. They process **tokens**, which are pieces of text.

A token can be:

* An entire word
* Part of a word
* Punctuation
* Whitespace
* Special characters

For example:

$$
\text{"Hello world!"}
$$

could be split into:

$$
[\text{"Hello"}, \text{" world"}, \text{"!"}]
$$

The exact tokens depend on the tokenizer being used.

### Tokenization

**Tokenization** is the process of converting text into tokens.

Each token is assigned a unique integer called a **token ID**.

For example:

$$
\text{"Hello"} \rightarrow 15496
$$

So an input such as:

$$
\text{"Hello world!"}
$$

could become:

$$
[15496, 995, 0]
$$

The model then works with these token IDs rather than the original text.

---

# Embeddings

Token IDs are just integers, so they do not contain much useful information by themselves.

The model converts each token ID into a vector called an **embedding**.

For example:

$$
15496 \rightarrow
[0.12, -0.43, 0.87, ..., 0.21]
$$

If the model has an embedding dimension of $d$, each token is represented as:

$$
x \in \mathbb{R}^d
$$

These embeddings are learned during training.

The model can therefore learn relationships between different tokens and represent them as vectors.

---

# Transformers

Modern LLMs are primarily built using the **Transformer architecture**.

The Transformer was introduced in the 2017 paper *[](https://arxiv.org/pdf/1706.03762)Attention Is All You Need[](https://arxiv.org/pdf/1706.03762)*.

The key idea behind Transformers is **attention**.

Attention allows the model to determine which tokens are important to each other.

For example:

> "The dog chased the cat because it was hungry."

To understand what `"it"` refers to, the model needs to look at other tokens in the sentence.

Attention allows the model to determine which tokens are relevant when processing each token.

---

# Self-Attention

**Self-attention** allows each token to look at the other tokens in the sequence and determine how relevant they are.

Self-attention uses three vectors:

* **Query ($Q$):** What information is this token looking for?
* **Key ($K$):** What information does this token contain?
* **Value ($V$):** What information should be passed along?

The attention formula is:

$$
\text{Attention}(Q,K,V)
=
\text{softmax}
\left(
\frac{QK^T}{\sqrt{d_k}}
\right)V
$$

First, the queries and keys are multiplied:

$$
QK^T
$$

This produces a score representing how relevant each token is to another token.

The scores are divided by:

$$
\sqrt{d_k}
$$

to prevent the values from becoming too large.

Softmax then converts these scores into probabilities:

$$
\text{softmax}
\left(
\frac{QK^T}{\sqrt{d_k}}
\right)
$$

These probabilities are used to take a weighted combination of the value vectors.

The result is a new representation for each token that contains information from the other relevant tokens.

---

# Causal Attention

Since LLMs generate text one token at a time, they cannot look at future tokens.

For example, given:

> "The cat sat on the"

the model should predict the next token without seeing what comes after it.

This is done using a **causal attention mask**.

A token can attend to itself and previous tokens, but not future tokens.

For example:

$$
\begin{bmatrix}
1 & 0 & 0 & 0 \\
1 & 1 & 0 & 0 \\
1 & 1 & 1 & 0 \\
1 & 1 & 1 & 1
\end{bmatrix}
$$

The zeros prevent tokens from attending to future positions.

This is what allows the Transformer to remain autoregressive.

---

# Multi-Head Attention

Instead of performing self-attention once, Transformers use multiple **attention heads**.

Each attention head has its own Query, Key, and Value projections.

This allows different heads to focus on different relationships between tokens.

For example, one head might learn relationships between:

* Subjects and verbs
* Pronouns and nouns
* Nearby tokens
* Tokens that are far apart

The outputs from all of the attention heads are then combined.

This is called **Multi-Head Attention**.

---

# Feed-Forward Network

After the attention layer, the token representations are passed through a **Feed-Forward Network**, also called an MLP.

A simplified version is:

$$
\text{FFN}(x) = W_2 \sigma(W_1x + b_1) + b_2
$$

The MLP applies additional transformations to each token's representation.

The attention layer allows tokens to communicate with each other, while the MLP processes the resulting representations.

---

# Transformer Block

A Transformer is made up of many repeated **Transformer blocks**.

A simplified Transformer block looks like:

$$
\text{Input}
\rightarrow
\text{Self-Attention}
\rightarrow
\text{MLP}
\rightarrow
\text{Output}
$$

In practice, Transformer blocks also contain **residual connections** and **layer normalization**.

### Residual Connections

Residual connections allow the original input to be added back to the output of a layer.

Instead of:

$$
x \rightarrow f(x)
$$

we use:

$$
x + f(x)
$$

This helps information flow through deep networks and makes them easier to train.

### Layer Normalization

Layer normalization normalizes the activations within the network.

A simplified formula is:

$$
\text{LayerNorm}(x)
=
\gamma
\frac{x-\mu}{\sqrt{\sigma^2+\epsilon}}
+\beta
$$

where $\mu$ and $\sigma$ are calculated from the activations.

---

# The LLM

An LLM is essentially many Transformer blocks stacked together.

A simplified architecture looks like:

$$
\text{Tokens}
\rightarrow
\text{Embeddings}
\rightarrow
\boxed{
\text{Transformer Block}
}
\rightarrow
\boxed{
\text{Transformer Block}
}
\rightarrow
...
\rightarrow
\text{Logits}
$$

Each Transformer block updates the representation of every token.

As the representations pass through more layers, the model can build increasingly complex representations of the input.

---

# Logits

After the final Transformer block, the model needs to predict the next token.

The model produces a **logit** for every token in its vocabulary.

If the vocabulary contains $V$ tokens, the model produces:

$$
z \in \mathbb{R}^V
$$

Each value represents how strongly the model predicts that token.

For example:

| Token | Logit |
| ----- | ----: |
| "the" |   4.2 |
| "a"   |   2.1 |
| "one" |   1.3 |
| "my"  |   0.4 |

The logits are then converted into probabilities using softmax:

$$
P_i =
\frac{e^{z_i}}
{\sum_j e^{z_j}}
$$

The resulting probability distribution is what we use for sampling.

---

# Autoregressive Generation

Now we can put everything together.

Suppose the user gives the model:

> "The capital of France is"

The text is first converted into tokens.

Those tokens are converted into embeddings and passed through the Transformer.

The model then produces logits for the next token.

After applying softmax and the chosen sampling strategy, the model might select:

> "Paris"

The model then adds `"Paris"` to the sequence and predicts the next token.

$$
\text{"The capital of France is"}
$$

$$
\downarrow
$$

$$
\text{"Paris"}
$$

$$
\downarrow
$$

$$
\text{"The capital of France is Paris"}
$$

The process repeats one token at a time.

This is what makes an LLM **autoregressive**.

---

# KV Cache

There is an important problem with autoregressive generation.

Every time the model generates a new token, it needs to perform attention over the previous tokens.

Without optimization, the model would repeatedly recompute the same Key and Value vectors for tokens it has already processed.

This is where the **KV cache** comes in.

Recall that attention uses:

$$
Q, K, V
$$

During generation, the model stores the previously computed **Keys and Values** in memory.

When generating the next token, the model can reuse these cached values instead of calculating them again.

For example:

$$
\text{Token 1}
\rightarrow
K_1,V_1
$$

Then:

$$
\text{Token 2}
\rightarrow
K_2,V_2
$$

The cache now contains:

$$
[K_1,K_2]
$$

and:

$$
[V_1,V_2]
$$

When generating token 3, the model only needs to calculate the new $K_3$ and $V_3$ and can reuse the previous values.

So instead of repeatedly recomputing the entire sequence, the model maintains a growing cache:

$$
(K_1,V_1)
\rightarrow
(K_1,V_1),(K_2,V_2)
\rightarrow
(K_1,V_1),(K_2,V_2),(K_3,V_3)
\rightarrow
...
$$

This is the **KV cache**, and it is a major optimization for autoregressive LLM inference.

---

# Putting It All Together

At a high level, the entire process looks like:

$$
\text{Text}
\rightarrow
\text{Tokens}
\rightarrow
\text{Embeddings}
\rightarrow
\text{Transformer Blocks}
\rightarrow
\text{Logits}
\rightarrow
\text{Softmax}
\rightarrow
\text{Sampling}
\rightarrow
\text{Next Token}
$$

The process then repeats:

$$
t_1
\rightarrow
t_2
\rightarrow
t_3
\rightarrow
t_4
\rightarrow
...
$$

During generation, the model uses the **KV cache** to avoid repeatedly recomputing the Keys and Values from previous tokens.

At its core, an LLM is doing one thing repeatedly:

> **Given the tokens that came before, predict the next token.**
